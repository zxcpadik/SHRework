import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Ticket {
    @PrimaryGeneratedColumn()
    GlobalID?: number;

    @Column()
    SourceID: number = -1;

    @Column()
    DestinationID: number = -1;

    @Column()
    TicketID?: number;

    @Column()
    ResponseID: number = -1;

    @Column({ type: 'text' })
    Data: string = '';

    @Column({ type: 'timestamptz' })
    Date: Date = new Date();
}