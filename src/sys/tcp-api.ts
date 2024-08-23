import express, { Express } from "express";
import { AuthService, Credentials, SecureResult } from "./auth-service";
import { Ticket } from "../entities/ticket";
import { TicketResult, TicketService } from "./ticket-service";
import net from "net";
import { Readable, Stream } from "stream";
import AwaitEventEmitter from "await-event-emitter";
import { FIFOBuffer } from "../utils/fifo-buffer";
import { ModuleRepo } from "./db-service";
import { randomBytes } from "crypto";

const PORT = process.env.TCP_PORT;
const PROTO_GUARD = "SHRework"

const SIG_SLAVE_VOID_READ  = 100777100;
const SIG_SLAVE_VOID_WRITE = 200777200;
const SIG_SLAVE_DATA_READ  = 300777300;
const SIG_SLAVE_DATA_WRITE = 400777400;

const SIG_MASTER_VOID_READ  = 100555100;
const SIG_MASTER_VOID_WRITE = 200555200;
const SIG_MASTER_DATA_READ  = 300555300;
const SIG_MASTER_DATA_WRITE = 400555400;

const SIG_CROSS   = 100999100;
const SIG_CANCEL  = 200999200;

const Ping_CID = 5;

interface ITCPAPIFunctions {
  [key: string]: (buf: Buffer, s: TCPSession) => Promise<Buffer>;
}
interface IUSRegistry {
  [username: string]: TCPSession;
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

  async function ClientHandler(socket: net.Socket) {
    let s = new TCPSession(socket, socket.remoteAddress || "null");
    socket.setNoDelay(true);
    
    let protoguard = (await s.Read(PROTO_GUARD.length)).toString("utf8");
    if (protoguard !== PROTO_GUARD) return s.Close();

    let AppHash = (await s.Read(8)).toString("hex").toLowerCase();
    s.AppHash = AppHash;
    if (!(await s.Write(Buffer.from(s.SessionHash, 'hex')))) return false; // TODO : ERROR

    s.protect(false);
  }

  export const APIproxy: ITCPAPIFunctions = {
    ping: async (buf, s): Promise<Buffer> => {
      console.log(`[PING] IP: ${s.IP}`);
      let rbuf = Buffer.alloc(2);
      rbuf.writeUInt16LE(Ping_CID);
      return rbuf;
    },
    auth: async (buf, s): Promise<Buffer> => {
      let creds = Credentials.FromBuf(buf);
      let result = await AuthService.Auth(creds);
      if (result.ok) {
        s._Credits = creds;
        s.UserID = result.user?.ID;
        if (s.UserID) USRegistry[s.UserID.toString()] = s;
        return result.GetBuf();
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
      if (!usr.ok) return new SecureResult(false, usr.status).GetBuf();

      let _count = buf.readUInt32LE(0);
      let count = _count === 0 ? 1 : _count;
      let _offset = buf.readUInt32LE(4);
      let offset = _offset === 0 ? -1 : _offset;

      let result = await TicketService.Pull(usr.user?.ID || -1, offset, count);
      return result.GetBuf();
    },
    last: async (buf, s): Promise<Buffer> => {
      let usr = await AuthService.Auth(s._Credits);
      if (!usr.ok) return new SecureResult(false, usr.status).GetBuf();

      let result = await TicketService.GetLast(usr.user?.ID || -1);
      return result.GetBuf();
    },
    // Flush
  };

  export const CIDRegistry: string[] = [
    'null', // 0
    'null', // 1
    'null', // 2
    'null', // 3
    'null', // 4
    'ping', // 5
    'null', // 6
    'null', // 7
    'null', // 8
    'null', // 9
    'null', // 10
    'null', // 11
    'auth', // 12
    'null', // 13
  ];
  export const USRegistry: IUSRegistry = {};

  export function CIDBuf(buf: Buffer) {
    if (buf.length < 2) return 0;
    else return buf.readUint16LE();
  }
}

class TCPSession {
  Socket: net.Socket;
  IP: string;

  AppHash?: string;
  UserID?: number;
  SessionHash: string;

  _Credits: Credentials = new Credentials();

  _Buffer = new FIFOBuffer();
  _ave = new AwaitEventEmitter();
  _protect = true;
  _ticker: NodeJS.Timeout | undefined = undefined;
  _lastData: Date = new Date(0);
  _queue: {buf: Buffer, func: (buf: Buffer | undefined) => (void | Promise<void>)}[] = [];

  isOnline(): boolean {
    return (Date.now() - this._lastData.getTime()) < 15000;
  }

  Close() {
    this.Socket.destroy();
  }

  Read(count: number) {
    return new Promise<Buffer>((res, rej) => {
      if (this._Buffer.size >= count) {
        let buf = this._Buffer.deq(count) || Buffer.alloc(0);
        return res(buf);
      }

      let lfunc = (byts: number) => {
        if (byts >= count) {
          this._ave.off("data", lfunc);
          let buf = this._Buffer.deq(count) || Buffer.alloc(0);
          return res(buf);
        }
      };
      this._ave.on("data", lfunc);
    });
  }
  Write(data: Buffer): boolean{
    return this.Socket.write(data);
  }

  async sig_write(sig: number) {
    let buf = Buffer.alloc(4);
    buf.writeInt32LE(sig);
    return this.Write(buf);
  }

  async sync(_write: boolean) {
    if (this._Buffer.size > 0) {
      let rsig = (await this.Read(4)).readInt32LE();

      switch (rsig) {
        case SIG_SLAVE_VOID_READ: await this.sig_write(_write ? SIG_MASTER_DATA_WRITE : SIG_CANCEL); return _write;
        case SIG_SLAVE_VOID_WRITE: await this.sig_write(_write ? SIG_CROSS : SIG_MASTER_DATA_READ); return !_write;
        case SIG_SLAVE_DATA_READ: await this.sig_write(_write ? SIG_MASTER_DATA_WRITE : SIG_CANCEL); return _write;
        case SIG_SLAVE_DATA_WRITE: await this.sig_write(_write ? SIG_CROSS : SIG_MASTER_DATA_READ); return !_write;
        case SIG_CANCEL: return false;
        case SIG_CROSS: return false;
      }
    } else {
      await this.sig_write(_write ? SIG_MASTER_VOID_WRITE : SIG_MASTER_VOID_READ);
      
      let rsig = (await this.Read(4)).readInt32LE();
      switch (rsig) {
        case SIG_SLAVE_VOID_READ: return _write;
        case SIG_SLAVE_VOID_WRITE: return !_write;
        case SIG_SLAVE_DATA_READ: return _write;
        case SIG_SLAVE_DATA_WRITE: return !_write;
        case SIG_CANCEL: return false;
        case SIG_CROSS: return false;
      }
    }
  }

  async ReadPacket(): Promise<Buffer | undefined> {
    const sizeBuf = await this.Read(4);
    const size = sizeBuf.readUInt32LE();

    if (size > 1024 * 1024) { return undefined; }
    const buf = await this.Read(size);
    
    return buf;
  }
  async WritePacket(buf: Buffer) {
    let sizeBuf = Buffer.alloc(4);
    sizeBuf.writeUInt32LE(buf.length);

    if (!this.Write(sizeBuf)) return false;
    if (!this.Write(buf)) return false;

    return true;
  }

  async ReadPacketEX(): Promise<Buffer | undefined> {
    if (!(await this.sync(false))) return undefined;
    return await this.ReadPacket();
  }
  async WritePacketEX(buf: Buffer) {
    if (!(await this.sync(true))) return false;

    return await this.WritePacket(buf);
  }

  async _protohandsend() {
    if (this._protect || this._queue.length <= 0) return;
    this.protect(true);
    while (this._queue.length > 0) {
      let obj = this._queue.shift();
      if (!obj) break;
      if (!(await this.WritePacketEX(obj.buf))) { this._queue.unshift(obj); break; } // TODO : ERROR SIGNAL
      let res = await this.ReadPacket();
      await obj.func(res);
    }
    this.protect(false);
  }
  async ProtoHand(buf: Buffer, callback: (buf: Buffer | undefined) => void) {
    this._queue.push({ buf: buf, func: callback });
    await this._protohandsend();
  }
  ProtoHandEX(buf: Buffer) {
    return new Promise<Buffer | undefined>((res) => {
      let timeout = setTimeout(() => {return res(undefined)}, 30000);
      this.ProtoHand(buf, (buf) => {
        clearTimeout(timeout);
        return res(buf);
      });
    });
  }

  protect(a: boolean) {
    if (!a) this._protohandsend();
    return this._protect = a;
  }

  async tick() {
    if (this._protect) return;
    this.protect(true);
    let p = await this.ReadPacketEX();
    if (!p) return false;

    let cid = UDPAPI.CIDBuf(p);
    let fid: string = UDPAPI.CIDRegistry[cid];
    let rbuf = (fid != undefined && fid != 'null') ? await UDPAPI.APIproxy[fid](p, this) : Buffer.alloc(0);
    await this.WritePacket(rbuf);
 
    this.protect(false);
  }

  constructor(Socket: net.Socket, IP: string) {
    this.IP = IP;
    this.SessionHash = randomBytes(32).toString('hex');
    this.Socket = Socket;

    this.Socket.on("data", (data) => {
      this._Buffer.enq(data);
      this._ave.emit('data', this._Buffer.size);
      this._lastData = new Date();

      if (this._Buffer.size >= 4 && !this._protect) this.tick();
    });
  }
}
