import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import SHA256 from "sha256";
import RSTR from "randomstring"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    UserID: number = 0;

    @Column()
    Username: string = '';

    @Column()
    Password: string = '';

    @Column({ type: 'timestamptz' })
    LastAuth: Date = new Date();

    IsPasswordMach(Password: string): boolean {
      let blocks = this.Password.split(':')
      let hash = SHA256(Password);
      return hash === blocks[0];
    }
    UpdatePassword(Password: string) {
      let salt1 = RSTR.generate(16);
      let salt2 = RSTR.generate(16);
      let hash = SHA256(salt1 + Password + salt2)

      this.Password = `${hash}:${salt1}:${salt2}`;
    }


}