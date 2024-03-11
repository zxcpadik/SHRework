import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Ticket {
  /*  Native size table
   * GlobalID - unsigned int (4 bytes)
   * SourceID - unsigned int (4 bytes)
   * DestinationID - unsigned int (4 bytes)
   * TicketID - unsigned int (4 bytes)
   * ResponseID - unsigned int (4 bytes)
   * Data - UTF-8 char buffer (unsigned int 4 bytes + dynamic)
   * Date - UTF-8 char buffer (unsigned int 4 bytes + dynamic)
   */

  @PrimaryGeneratedColumn()
  GlobalID: number = -1;

  @Column()
  SourceID: number = -1;

  @Column()
  DestinationID: number = -1;

  @Column()
  TicketID?: number;

  @Column()
  ResponseID: number = -1;

  @Column({ type: "text" })
  Data: string = "";

  @Column({ type: "timestamptz" })
  Date: Date = new Date();

  GetBuf(): Buffer {
    const _databuf = Buffer.from(this.Data, "utf8");
    const _datebuf = Buffer.from(Date.toString(), "utf8");

    var ret_buf = Buffer.alloc(28 + _datebuf.length + _databuf.length);

    ret_buf.writeUint32LE(this.GlobalID, 0);
    ret_buf.writeUint32LE(this.SourceID, 4);
    ret_buf.writeUint32LE(this.DestinationID, 8);
    ret_buf.writeUint32LE(this.TicketID || 0, 12);
    ret_buf.writeUint32LE(this.ResponseID, 16);

    ret_buf.writeUint32LE(_databuf.length, 20);
    ret_buf.writeUint32LE(_datebuf.length, 24);

    _databuf.copy(ret_buf, 28);
    _datebuf.copy(ret_buf, 28 + _databuf.length);

    return ret_buf;
  }
}
