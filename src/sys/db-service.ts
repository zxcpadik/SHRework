import { DataSource } from "typeorm";
import { Ticket } from "../entities/ticket";
import { User } from "../entities/user";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: true,
  entities: [ Ticket, User ],
  subscribers: [],
  migrations: [],
})

AppDataSource.initialize().then(() => {
  console.log("[DB] Connected!")
}).catch((err) => {
  console.error("[DB] Failed!", err)
});