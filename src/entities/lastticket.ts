import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from "typeorm";

@Entity()
export class LastTicket {
  @PrimaryColumn({ unique: true })
  UserID: number = 0;

  @Column()
  TicketID: number = 0;

  GetBuf(): Buffer {
    let ret_buf = Buffer.alloc(12);

    ret_buf.writeInt32LE(this.UserID, 0);
    ret_buf.writeBigInt64LE(BigInt(this.TicketID), 4);

    return ret_buf;
  }
}
