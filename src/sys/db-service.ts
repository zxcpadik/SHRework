import { DataSource } from "typeorm";
import { Ticket } from "../entities/ticket";
import { User } from "../entities/user";
import { LastTicket } from "../entities/lastticket";
import { Session } from "../entities/session";
import { SmartModule } from "../entities/smartmodule";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number.parseInt(process.env.DB_PORT!),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: false,
  entities: [Ticket, User, SmartModule, LastTicket, Session],
  subscribers: [],
  migrations: [],
});

AppDataSource.initialize()
  .then(() => {
    console.log("[DB] Connected!");
  })
  .catch((err) => {
    console.error("[DB] Failed!", err);
  });

export const UserRepo = AppDataSource.getRepository(User);
export const TicketRepo = AppDataSource.getRepository(Ticket);
export const LastTicketRepo = AppDataSource.getRepository(LastTicket);
export const SessionRepo = AppDataSource.getRepository(Session);
export const ModuleRepo = AppDataSource.getRepository(SmartModule);