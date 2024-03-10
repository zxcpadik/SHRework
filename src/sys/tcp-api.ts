import express, { Express } from "express";
import { AuthService, Credentials } from "./auth-service";
import { Tools } from "../utils/tools";
import { Ticket } from "../entities/ticket";
import { TicketService } from "./ticket-service";
import net from "net";
import { Readable, Stream } from "stream";
import AwaitEventEmitter from "await-event-emitter";
import { FIFOBuffer } from '../utils/fifo-buffer';

const PORT = 3000;

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
    console.log("Connected!");
    let s = new TCPSession(0, socket, "null");

    for (let i = 0; i < 100; i++) {
      console.log(i);
      let buff = await s.Read(4);
      console.log(buff.toString("utf-8"));
    }
  }
}

class TCPSession {
  ID: number;
  Socket: net.Socket;
  IP: String;

  UserID?: number;
  SN?: number;

  _Buffer: any = new FIFOBuffer();
  _ave = new AwaitEventEmitter();

  Close() {
    this.Socket.destroy();
  }

  Read(count: number): Promise<Buffer> {
    return new Promise((res, rej) => {
      let lfunc = (byts: number) =>{
        if (byts >= count) {
          this._ave.off("data", lfunc);
          return res(this._Buffer.deq(count));
        }
      }

      this._ave.on("data", lfunc);
      if (this._Buffer.size >= count) this._ave.emit("data", this._Buffer.size);
    });
  }

  constructor(ID: number, Socket: net.Socket, IP: String) {
    this.ID = ID;
    this.Socket = Socket;
    this.IP = IP;

    this.Socket.on("data", (data) => {
      this._Buffer.enq(data);
      this._ave.emit("data", this._Buffer.size);
    });
  }
}
