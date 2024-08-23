import {
  AppDataSource,
  UserRepo,
  TicketRepo,
  LastTicketRepo,
} from "./db-service";
import { Ticket } from "../entities/ticket";
import { And, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { LastTicket } from "../entities/lastticket";
import { UDPAPI } from "./tcp-api";

export module TicketService {
  export async function Push(ticket: Ticket): Promise<TicketResult> {
    if (
      ticket.DestinationID < 0 ||
      ticket.SourceID < 0 ||
      ticket.ResponseID < 0
    ) return new TicketResult(false, 601);

    let lastTicket = await LastTicketRepo.findOneBy({ UserID: ticket.DestinationID });
    if (!lastTicket) {
      lastTicket = new LastTicket();
      lastTicket.UserID = ticket.DestinationID;
      lastTicket.TicketID = 0;
    }
    lastTicket.TicketID++;
    await LastTicketRepo.save(lastTicket);

    if (!ticket.TicketID) ticket.TicketID = lastTicket.TicketID;

    // TCP-SECTION -- TO BE MOVED TO TCP WITH API-PROXY
    let tcp_s = UDPAPI.USRegistry[ticket.DestinationID];
    if (tcp_s) {
      let tres = new TicketResult(true, 0, [ticket]);
      tcp_s.ProtoHand(tres.GetBuf(), () => {});
    }
    // *-*-*-*

    let tckt = await TicketRepo.save(ticket);
    if (tckt) {
      tckt.Data = "";
    }

    return new TicketResult(true, 600, [tckt]);
  }

  export async function Pull(UserID: number, offset: number, count: number): Promise<TicketResult> {
    if (offset === -1) {
      offset =
        (
          await LastTicketRepo.findOneBy({
            UserID,
          })
        )?.TicketID || -1;

      offset -= count - 1;
    }

    let tickets = await TicketRepo.find({
      take: count,
      where: {
        DestinationID: UserID,
        TicketID: And(MoreThanOrEqual(offset), LessThanOrEqual(offset + count)),
      },
    });

    return new TicketResult(true, 610, tickets);
  }

  export async function GetLast(UserID: number): Promise<TicketServiceResult> {
    let lastTicket = await LastTicketRepo.findOneBy({
      UserID: UserID,
    });

    return new TicketServiceResult(lastTicket !== null, lastTicket !== null ? 630 : 401, lastTicket?.TicketID || -1);
  }

  export async function Flush(UserID: number): Promise<TicketServiceResult> {
    let lastTicket = await TicketRepo.delete({
      DestinationID: UserID,
    });
    await LastTicketRepo.update(
      {
        UserID: UserID,
      },
      {
        TicketID: 0,
      }
    );

    return new TicketServiceResult(lastTicket.affected !== null, lastTicket.affected !== null ? 401 : 620, lastTicket.affected || 0);
  }
}

export class TicketResult {
  /*  Native size table - 6 bytes
   * сid      - ushort (2 bytes) - 10
   * ok       - bool (1 byte)
   * status   - short (2 bytes)
   * count    - uint8 (1 byte)
   * tickets  - buffer (dynamic)
   */

  readonly classID = 10;

  public ok: boolean;
  public status: number;
  public tickets?: Ticket[];

  constructor(Ok: boolean, Status: number, Tickets?: Ticket[]) {
    this.ok = Ok;
    this.status = Status;
    this.tickets = Tickets;
  }

  GetBuf(): Buffer {
    var tlen = 0;
    const _ticketsbuf: Buffer[] = [];
    this.tickets?.forEach((t, i) => {
      _ticketsbuf[i] = t.GetBuf();
      tlen += _ticketsbuf[i].length;
    });

    var ret_buf = Buffer.alloc(6 + tlen);

    ret_buf.writeUint16LE(this.classID, 0);
    ret_buf.writeUint8(this.ok ? 1 : 0, 2);
    ret_buf.writeInt16LE(this.status, 3);
    ret_buf.writeUint8(this.tickets?.length || 0, 5);

    let offset = 0;
    _ticketsbuf.forEach((b, i) => {
      b.copy(ret_buf, 6 + offset);
      offset += _ticketsbuf[i].length;
    });

    return ret_buf;
  }
}
export class TicketServiceResult {
  /*  Native size table - 9
   * cid      - short (2 bytes) - 11
   * ok       - bool (1 byte)
   * status   - short (2 bytes)
   * count    - int (4 byte)
   */

  readonly classID = 11;

  public ok: boolean;
  public status: number;
  public count: number;

  constructor(ok: boolean, status: number, count: number) {
    this.ok = ok;
    this.status = status;
    this.count = count;
  }

  GetBuf(): Buffer {
    var ret_buf = Buffer.alloc(9);

    ret_buf.writeUint16LE(this.classID, 0);
    ret_buf.writeUint8(this.ok ? 1 : 0, 2);
    ret_buf.writeInt16LE(this.status, 3);
    ret_buf.writeInt32LE(this.count, 5);

    return ret_buf;
  }
}