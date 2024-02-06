import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import SHA256 from "sha256";
import RSTR from "randomstring";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  ID: number = -1;

  @Column()
  Username: string = "";

  @Column()
  Password: string = "";

  @Column({ type: "timestamptz" })
  LastAuth?: Date = new Date();

  IsPasswordMach(password?: string): boolean {
    if (!password) return false;

    let blocks = this.Password.split(":");
    let hash = SHA256([blocks[1], password, blocks[2]].join());

    return hash === blocks[0];
  }
  UpdatePassword(password: string) {
    let salt1 = RSTR.generate(16);
    let salt2 = RSTR.generate(16);
    let hash = SHA256([salt1, password, salt2].join());

    this.Password = [hash, salt1, salt2].join(":");
  }
}
