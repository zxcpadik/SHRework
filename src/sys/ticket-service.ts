import { AppDataSource, UserRepo, TicketRepo, LastTicketRepo } from "./db-service";
import { Ticket } from "../entities/ticket";
import { And, LessThanOrEqual, MoreThanOrEqual  } from "typeorm";
import { LastTicket } from "../entities/lastticket";


class TicketServiceBase { 
  async Push(ticket: Ticket): Promise<TicketResult> {
    if (ticket.DestinationID === -1 || ticket.SourceID === -1 || ticket.ResponseID === -1) return new TicketResult(false, 601);

    let lastTicket = await LastTicketRepo.findOneBy({
      UserID: ticket.DestinationID
    });
    if (!lastTicket) { lastTicket = new LastTicket(); lastTicket.UserID = ticket.DestinationID; lastTicket.TicketID = 0; }
    lastTicket.TicketID++;
    await LastTicketRepo.save(lastTicket);

    if (!ticket.TicketID) ticket.TicketID = lastTicket.TicketID;

    let tckt = await TicketRepo.save(ticket);
    return new TicketResult(true, 600, [tckt]);
  }

  async Pull(UserID: number, offset: number, count: number): Promise<TicketResult> {
    if (offset === -1) {
      offset = (await LastTicketRepo.findOneBy({
        UserID
      }))?.TicketID || -1;

      offset -= count - 1;
    }

    let tickets = await TicketRepo.find({
      take: count,
      where: {
        DestinationID: UserID,
        TicketID: And(MoreThanOrEqual(offset), LessThanOrEqual(offset + count)),
      }
    });

    return new TicketResult(true, 610, tickets);
  }

  async GetLast(UserID: number): Promise<Number> {
    let lastTicket = await LastTicketRepo.findOneBy({
      UserID: UserID
    });

    return lastTicket?.TicketID || 0;
  }

  async Flush(UserID: number): Promise<Number> {
    let lastTicket = await TicketRepo.delete({
      DestinationID: UserID
    });
    await LastTicketRepo.update({
      UserID: UserID
    }, {
      TicketID: 0
    });

    return lastTicket.affected || 0;
  }
}


export class TicketResult {
  public ok: boolean;
  public status: number;
  public tickets?: Ticket[];

  constructor (Ok: boolean, Status: number, Tickets?: Ticket[]) {
    this.ok = Ok;
    this.status = Status;
    this.tickets = Tickets;
  }
}
export const TicketService = new TicketServiceBase(); 