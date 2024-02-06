import express, { Express } from "express";
import { AuthService, Credentials } from "./auth-service";
import { Tools } from "../utils/tools";
import { Ticket } from "../entities/ticket";
import { TicketService } from "./ticket-service";

export module APIv3Host {
  export function Load(app: Express) {
    app.post("/api/v3/auth/", PostSecureAuth);
    app.post("/api/v3/create/", PostSecureCreate);
    app.post("/api/v3/update/", PostSecureUpdate);
    app.post("/api/v3/delete/", PostSecureDelete);
    app.post("/api/v3/push/", PostTicketPush);
    app.post("/api/v3/pull/", PostTicketPull);
    app.post("/api/v3/flush/", PostTicketFlush);
    app.post("/api/v3/last/", PostTicketLast);
    app.post("/api/v3/", PostAPIv3);
  }
  export const API_V3_VER = 1;

  // SECURE
  async function PostSecureAuth(req: express.Request, res: express.Response) {
    const Username = req.body["username"] as string | undefined;
    const Password = req.body["password"] as string | undefined;

    let result = await AuthService.Auth(new Credentials(Username, Password));
    return res.json(
      result.ok ? { ok: true, status: 100, ID: result.user?.ID } : result
    );
  }
  async function PostSecureCreate(req: express.Request, res: express.Response) {
    const username = req.body["username"] as string | undefined;
    const password = req.body["password"] as string | undefined;

    let result = await AuthService.Create(new Credentials(username, password));
    return res.json(
      result.ok ? { ok: true, status: 120, ID: result.user?.ID } : result
    );
  }
  async function PostSecureUpdate(req: express.Request, res: express.Response) {
    const username = req.body["username"] as string | undefined;
    const password = req.body["password"] as string | undefined;
    const newpassword = req.body["newpassword"] as string | undefined;

    let result = await AuthService.Auth(new Credentials(username, password));
    if (result.ok) {
      let changeresult = await AuthService.Update(
        new Credentials(username, password),
        newpassword
      );

      return res.json(
        changeresult.ok
          ? { ok: true, status: 150, ID: changeresult.user?.ID }
          : changeresult
      );
    } else return res.status(200).json(result);
  }
  async function PostSecureDelete(req: express.Request, res: express.Response) {
    const username = req.body["username"] as string | undefined;
    const password = req.body["password"] as string | undefined;

    let result = await AuthService.Auth(new Credentials(username, password));
    if (!result.ok) return res.json(result);

    let deleteresult = await AuthService.Delete(
      new Credentials(username, password)
    );
    return res.status(200).json(deleteresult);
  }

  // TICKET

  async function PostTicketPush(req: express.Request, res: express.Response) {
    const Username = req.body["username"] as string | undefined;
    const Password = req.body["password"] as string | undefined;

    const Destination = Number(req.body["destination"]) as number | undefined;
    const ResponseID = Number(req.body["responseid"]) as number | undefined;
    const Data = req.body["data"] as string | undefined;

    let result = await AuthService.Auth(new Credentials(Username, Password));
    if (result.ok) {
      let GenRID = Tools.Between(100000, 999999);
      if (ResponseID && ResponseID !== Number.NaN) {
        let ticket = new Ticket();
        ticket.SourceID = result.user?.ID || -1;
        ticket.Data = Data || "";
        ticket.DestinationID = Destination || -1;
        ticket.TicketID = ResponseID || -1;
        ticket.ResponseID = GenRID;

        let tresult = await TicketService.Push(ticket);
        return res.json(tresult);
      } else {
        let ticket = new Ticket();
        ticket.SourceID = result.user?.ID || -1;
        ticket.Data = Data || "";
        ticket.DestinationID = Destination || -1;
        ticket.ResponseID = GenRID;

        let tresult = await TicketService.Push(ticket);
        return res.json(tresult);
      }
    } else return res.json(result);
  }
  async function PostTicketPull(req: express.Request, res: express.Response) {
    const username = req.body["username"] as string | undefined;
    const password = req.body["password"] as string | undefined;

    const offset = Number(req.body["offset"]) as number | undefined;
    const count = Number(req.body["count"]) as number | undefined;

    let result = await AuthService.Auth(new Credentials(username, password));
    if (result.ok) {
      let tres = await TicketService.Pull(
        result.user?.ID || -1,
        offset || -1,
        count || 1
      );
      res.json(tres);
    } else return res.json(result);
  }
  async function PostTicketFlush(req: express.Request, res: express.Response) {
    const username = req.body["username"] as string | undefined;
    const password = req.body["password"] as string | undefined;

    let result = await AuthService.Auth(new Credentials(username, password));
    if (result.ok) {
      let tres = await TicketService.Flush(result.user?.ID || -1);
      return res.json({ ok: true, status: 620, count: tres });
    } else return res.json(result);
  }
  async function PostTicketLast(req: express.Request, res: express.Response) {
    const username = req.body["username"] as string | undefined;
    const password = req.body["password"] as string | undefined;

    let result = await AuthService.Auth(new Credentials(username, password));
    if (result.ok) {
      let tres = await TicketService.GetLast(result.user?.ID || -1);
      return res.json({ ok: true, status: 630, count: tres });
    } else return res.json(result);
  }

  // SYSTEM

  async function PostAPIv3(req: express.Request, res: express.Response) {
    return res.send({ ok: true, status: 800, version: API_V3_VER });
  }
}
