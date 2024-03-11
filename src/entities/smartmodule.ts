import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from "typeorm";

@Entity()
export class SmartModule {
  @PrimaryColumn({ unique: true })
  UserID: number = 0;

  @Column({ unique: true, length: 16 })
  GlobalID: string = "";

  @Column({ unique: true, length: 16 })
  SerialNumber: string = "";
}
