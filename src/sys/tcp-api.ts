import express, { Express } from "express";
import { AuthService, Credentials, SecureResult } from "./auth-service";
import { Tools } from "../utils/tools";
import { Ticket } from "../entities/ticket";
import { TicketResult, TicketService } from "./ticket-service";
import net, { AddressInfo } from "net";
import { And } from "typeorm";
import { Readable, Stream } from "stream";
import AwaitEventEmitter from "await-event-emitter";
import { FIFOBuffer } from "../utils/fifo-buffer";
import { ModuleRepo } from "./db-service";

const PROTO_DBG = false;
const PORT = 3000;

interface ITCPAPIFunctions {
  [key: string]: (buf: Buffer, s: TCPSession) => Promise<Buffer>;
}

export module UDPAPI {
  export function Load(app: Express) {
    if (process.env.TCP_ENABLED === "true") {
      const server = net.createServer(ClientHandler);

      server.listen(PORT, () => {
        console.log(`[TCP] Server listening on port ${PORT}`);
      });
    } else console.log(`[TCP] Server disabled`);
  }
  export const API_TCP_VER = 1;

  var IDcounter = 0;

  async function CheckTCPValid(
    UserID: number,
    SN: string,
    GlobalID: string
  ): Promise<boolean> {
    const sm = await ModuleRepo.findOne({
      where: {
        UserID: UserID
      },
      cache: true
    });

    return sm?.SerialNumber.toLowerCase() === SN && sm.GlobalID.toLowerCase() === GlobalID;
  }

  async function ClientHandler(socket: net.Socket) {
    let s = new TCPSession(++IDcounter, socket, socket.remoteAddress || "null");
    if (PROTO_DBG) console.debug(
      `[${Tools.GetDateTime()}][TCP]{${s.ID}} Connected ${
        (socket.address() as AddressInfo).address
      }`
    );

    const UserID = (await s.Read(4)).readInt32LE();
    const SN = (await s.Read(8)).toString("hex").toLowerCase();
    const GlobalID = (await s.Read(8)).toString("hex").toLowerCase();

    s.UserID = UserID;
    s.SN = SN;

    if (PROTO_DBG) console.debug(
      `[${Tools.GetDateTime()}][TCP]{${s.ID}} Data ${UserID}:${GlobalID}:${SN}`
    );

    const valid = await CheckTCPValid(UserID, SN, GlobalID);
    if (!valid) {
      if (PROTO_DBG) console.debug(`[${Tools.GetDateTime()}][TCP]{${s.ID}} Invalid!`);
      s.Close();
      return;
    }
    if (PROTO_DBG) console.debug(`[${Tools.GetDateTime()}][TCP]{${s.ID}} Valid!`);

    s._idle = true;
    if (s._Buffer.size > 0) s._onData();

    socket.on("error", (err) => {
      s.Close();
      if (PROTO_DBG) console.debug(`[${Tools.GetDateTime()}][TCP]{${s.ID}} Error! ${err.message}`);
    });
  }

  export const APIproxy: ITCPAPIFunctions = {
    ping: async (buf, s): Promise<Buffer> => {
      return Buffer.from(`pong`, "utf8");
    },
    auth: async (buf, s): Promise<Buffer> => {
      let creds = Credentials.FromBuf(buf);
      let result = await AuthService.Auth(creds);
      if (result.ok) {
        if (result.user === s.UserID) {
          s._Credits = creds;
          return result.GetBuf();
        }
        else return new SecureResult(false, 104).GetBuf();
      }
      return result.GetBuf();
    },
    // Create
    // Update
    // Delete

    push: async (buf, s): Promise<Buffer> => {
      let usr = await AuthService.Auth(s._Credits);
      if (!usr.ok) return new TicketResult(false, usr.status).GetBuf();

      let t = Ticket.FromBuf(buf);
      t.SourceID = usr.user?.ID || -1;
      let result = await TicketService.Push(t);
      
      return result.GetBuf();
    },
    pull: async (buf, s): Promise<Buffer> => {
      let usr = await AuthService.Auth(s._Credits);
      if (!usr.ok) return new TicketResult(false, usr.status).GetBuf();

      let _count = buf.readUInt32LE(0);
      let count = _count === 0 ? 1 : _count;
      let _offset = buf.readUInt32LE(4);
      let offset = _offset === 0 ? -1 : _offset;

      let result = await TicketService.Pull(usr.user?.ID || -1, offset, count);
      return result.GetBuf();
    },
    // Last
    // Flush
  };
}

class TCPSession {
  ID: number;
  Socket: net.Socket;
  IP: String;

  UserID?: number;
  SN?: string;

  _Credits: Credentials = new Credentials();

  _Buffer = new FIFOBuffer();
  _ave = new AwaitEventEmitter();
  _idle = false;

  Close() {
    this.Socket.destroy();
  }

  Read(count: number): Promise<Buffer> {
    return new Promise((res, rej) => {
      if (this._Buffer.size >= count)
        return res(this._Buffer.deq(count) || Buffer.alloc(0));

      let lfunc = (byts: number) => {
        if (byts >= count) {
          this._ave.off("data", lfunc);
          return res(this._Buffer.deq(count) || Buffer.alloc(0));
        }
      };

      this._ave.on("data", lfunc);
      if (this._Buffer.size >= count) this._ave.emit("data", this._Buffer.size);
    });
  }

  async ReadPacket() {
    const sizeBuf = await this.Read(4);
    const size = sizeBuf.readUInt32LE();

    if (size > 1024 * 1024) { return; }
    const buf = await this.Read(size);

    const cmdArgSizeBuf = await this.Read(4);
    const cmdArgSize = cmdArgSizeBuf.readUInt32LE();

    if (cmdArgSize > 1024 * 1024) { return; }
    const cmdArgBuf = await this.Read(cmdArgSize);

    const cmd = buf.toString("utf8").toLowerCase();
    if (UDPAPI.APIproxy[cmd] == null) {
      if (PROTO_DBG) console.debug(
        `[${Tools.GetDateTime()}][TCP] Unknow CMD: ${buf.toString(
          "hex"
        )} skip...`
      );
      return;
    }
    const res_buf = (await UDPAPI.APIproxy[cmd](cmdArgBuf, this)) as Buffer;
    const size_buf = Buffer.alloc(4);
    size_buf.writeUint32LE(res_buf.length);

    this.Socket.write(size_buf);
    this.Socket.write(res_buf);

    this._idle = true;
    if (this._Buffer.size > 0) this._onData();
  }

  async _onData() {
    this._ave.emit("data", this._Buffer.size);

    if (this._idle && this._Buffer.size >= 4) {
      this._idle = false;
      this.ReadPacket();
    }
  }

  constructor(ID: number, Socket: net.Socket, IP: String) {
    this.ID = ID;
    this.Socket = Socket;
    this.IP = IP;

    this.Socket.on("data", (data) => {
      this._Buffer.enq(data);
      this._onData();
    });
  }
}
