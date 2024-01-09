import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Ticket {
    @PrimaryGeneratedColumn()
    GlobalID: number = 0;

    @Column()
    SourceID: number = 0;

    @Column()
    DestinationID: number = 0;

    @Column()
    TicketID: number = 0;

    @Column()
    ResponseID: number = 0;

    @Column({ type: 'text' })
    Data: string = '';

    @Column({ type: 'timestamptz' })
    Date: Date = new Date();
}