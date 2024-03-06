import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from "typeorm";

@Entity()
export class LastTicket {
  @PrimaryColumn({ unique: true })
  UserID: number = 0;

  @Column({ length: 64 })
  Key: string = "";
}
