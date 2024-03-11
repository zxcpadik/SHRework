import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from "typeorm";

@Entity()
export class Session {
  @PrimaryColumn({ length: 64 })
  ID: string = "";

  @Column({ length: 16 })
  IP: string = "";

  @Column({ type: "timestamptz" })
  CreationDate: Date = new Date();
}
