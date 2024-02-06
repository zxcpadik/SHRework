import { DataSource } from "typeorm";
import { Ticket } from "../entities/ticket";
import { User } from "../entities/user";
import { LastTicket } from "../entities/lastticket";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: false,
  entities: [Ticket, User, LastTicket],
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
