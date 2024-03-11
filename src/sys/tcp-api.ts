import express, { Express } from "express";
import { AuthService, Credentials } from "./auth-service";
import { Tools } from "../utils/tools";
import { Ticket } from "../entities/ticket";
import { TicketService } from "./ticket-service";
import net, { AddressInfo } from "net";
import { And } from "typeorm";
import { Readable, Stream } from "stream";
import AwaitEventEmitter from "await-event-emitter";
import { FIFOBuffer } from "../utils/fifo-buffer";
import { ModuleRepo } from "./db-service";

const PORT = 3000;

interface ITCPAPIFunctions {
  [key: string]: (buf: Buffer) => Buffer;
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
    return await ModuleRepo.exists({
      where: {
        UserID: UserID,
        SerialNumber: SN,
        GlobalID: GlobalID,
      },
    });
  }

  async function ClientHandler(socket: net.Socket) {
    let s = new TCPSession(++IDcounter, socket, socket.remoteAddress || "null");
    console.debug(
      `[${Tools.GetDateTime()}][TCP]{${s.ID}} Connected ${
        (socket.address() as AddressInfo).address
      }`
    );

    const UserID = (await s.Read(4)).readInt32LE();
    const SN = (await s.Read(8)).toString("hex").toLowerCase();
    const GlobalID = (await s.Read(8)).toString("hex").toLowerCase();

    s.UserID = UserID;
    s.SN = SN;

    console.debug(
      `[${Tools.GetDateTime()}][TCP]{${s.ID}} Data ${UserID}:${GlobalID}:${SN}`
    );

    const valid = await CheckTCPValid(UserID, SN, GlobalID);
    if (!valid) {
      console.debug(`[${Tools.GetDateTime()}][TCP]{${s.ID}} Destroyed!`);
      s.Close();
      return;
    }
    console.debug(`[${Tools.GetDateTime()}][TCP]{${s.ID}} Valid!`);

    s._idle = true;
    if (s._Buffer.size > 0) s._onData();

    socket.on("error", () => {
      s.Close();
    });
  }

  export const APIproxy: ITCPAPIFunctions = {
    "echo": (buf: Buffer): Buffer => {
      return Buffer.from(`Reply: ${buf.toString('utf8')}`, "utf8");
    },
  };
}

class TCPSession {
  ID: number;
  Socket: net.Socket;
  IP: String;

  UserID?: number;
  SN?: string;

  _Buffer = new FIFOBuffer();
  _ave = new AwaitEventEmitter();
  _idle = false;

  Close() {
    this.Socket.destroy();
  }

  Read(count: number): Promise<Buffer> {
    return new Promise((res, rej) => {
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
    const size = this._Buffer.deq(4)?.readUInt32LE();
    if (size == undefined) {
      this._idle = true;
      return;
    }
    if (size > 1024 *  1024) return;
    const buf = await this.Read(size);

    const cmdArgSizeBuf = await this.Read(4);
    const cmdArgSize = cmdArgSizeBuf.readUInt32LE();
    if (cmdArgSize > 1024 * 1024) return;
    const cmdArgBuf = await this.Read(cmdArgSize);

    const cmd = buf.toString("utf8").toLowerCase();
    if (UDPAPI.APIproxy[cmd] == null) { console.debug(`[${Tools.GetDateTime()}][TCP] Unknow CMD: ${buf.toString("hex")} skip...`); return; }
    const res_buf = UDPAPI.APIproxy[cmd](cmdArgBuf) as Buffer;
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
