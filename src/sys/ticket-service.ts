import {
  AppDataSource,
  UserRepo,
  TicketRepo,
  LastTicketRepo,
} from "./db-service";
import { Ticket } from "../entities/ticket";
import { And, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { LastTicket } from "../entities/lastticket";

class TicketServiceBase {
  async Push(ticket: Ticket): Promise<TicketResult> {
    if (
      ticket.DestinationID < 0 ||
      ticket.SourceID < 0 ||
      ticket.ResponseID < 0
    )
      return new TicketResult(false, 601);

    let lastTicket = await LastTicketRepo.findOneBy({
      UserID: ticket.DestinationID,
    });
    if (!lastTicket) {
      lastTicket = new LastTicket();
      lastTicket.UserID = ticket.DestinationID;
      lastTicket.TicketID = 0;
    }
    lastTicket.TicketID++;
    await LastTicketRepo.save(lastTicket);

    if (!ticket.TicketID) ticket.TicketID = lastTicket.TicketID;

    let tckt = await TicketRepo.save(ticket);
    if (tckt) {
      tckt.Data = "";
    }
    return new TicketResult(true, 600, [tckt]);
  }

  async Pull(
    UserID: number,
    offset: number,
    count: number
  ): Promise<TicketResult> {
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

  async GetLast(UserID: number): Promise<Number> {
    let lastTicket = await LastTicketRepo.findOneBy({
      UserID: UserID,
    });

    return lastTicket?.TicketID || 0;
  }

  async Flush(UserID: number): Promise<Number> {
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

    return lastTicket.affected || 0;
  }
}

export class TicketResult {
  /*  Native size table
   * ok - bool (1 byte)
   * status - short (2 bytes)
   * count - uint8_t (1 byte)
   * Ticket - buffer (dynamic)
   */

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

    var ret_buf = Buffer.alloc(4 + tlen);

    ret_buf.writeUint8((this.ok ? 1 : 0), 0);
    ret_buf.writeInt16LE(this.status, 1);
    ret_buf.writeUint8(_ticketsbuf.length, 3);

    let offset = 0;
    _ticketsbuf.forEach((b, i) => {
      b.copy(ret_buf, 4 + offset);
      offset += _ticketsbuf[i].length;
    });

    return ret_buf;
  }
}
export const TicketService = new TicketServiceBase();
