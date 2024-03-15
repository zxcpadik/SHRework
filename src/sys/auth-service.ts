import { UserRepo } from "./db-service";
import { User } from "../entities/user";
import { AuthUtil } from "../utils/auth-utils";

export module AuthService {
  export async function Auth(credits: Credentials): Promise<SecureResult> {
    if (
      !(
        AuthUtil.ValidatePassword(credits.Password) &&
        AuthUtil.ValidateUsername(credits.Username)
      )
    )
      return new SecureResult(false, 101);
    let User = await UserRepo.findOneBy({
      Username: credits.Username,
    });
    if (!User) return new SecureResult(false, 102);

    if (User.IsPasswordMach(credits.Password)) {
      User.LastAuth = new Date();
      let usr = await UserRepo.save(User);
      return new SecureResult(true, 100, usr);
    }

    return new SecureResult(false, 103);
  }

  export async function Create(credits: Credentials): Promise<SecureResult> {
    if (
      !(
        AuthUtil.ValidatePassword(credits.Password) &&
        AuthUtil.ValidateUsername(credits.Username)
      )
    )
      return new SecureResult(false, 121);

    let UserEx = await UserRepo.existsBy({
      Username: credits.Username,
    });
    if (UserEx) return new SecureResult(false, 122);

    let Usr = new User();
    Usr.Username = credits.Username || "";
    Usr.UpdatePassword(credits.Password || "");

    let usr = await UserRepo.save(Usr);
    return new SecureResult(true, 120, usr);
  }

  export async function Update(
    credits: Credentials,
    newpass: string | undefined
  ): Promise<SecureResult> {
    if (!AuthUtil.ValidateUsername(credits.Username))
      return new SecureResult(false, 151);
    if (!AuthUtil.ValidatePassword(newpass))
      return new SecureResult(false, 152);

    let User = await UserRepo.findOneBy({
      Username: credits.Username,
    });
    if (!User) return new SecureResult(false, 153);

    User.UpdatePassword(newpass || "");

    let usr = await UserRepo.save(User);
    return new SecureResult(true, 150, usr);
  }

  export async function Delete(credits: Credentials): Promise<SecureResult> {
    if (!AuthUtil.ValidateUsername(credits.Username))
      return new SecureResult(false, 131);

    let res = await UserRepo.delete({
      Username: credits.Username,
    });

    return new SecureResult(
      (res.affected || 0) > 1,
      (res.affected || 0) > 0 ? 130 : 131,
      undefined
    );
  }
}

export class Credentials {
  /*  Native size table
   * Username - UTF-8 chars (int 4 bytes + dynamic)
   * Password - UTF-8 chars (int 4 bytes + dynamic)
   */

  public Username?: string;
  public Password?: string;

  constructor(Username?: string, Password?: string) {
    this.Username = Username?.toLowerCase();
    this.Password = Password;
  }

  GetBuf(): Buffer {
    const _userbuf = Buffer.from(this.Username || "null", "utf-8");
    const _passbuf = Buffer.from(this.Password || "null", "utf-8");
    var ret_buf = Buffer.alloc(8 + _userbuf.length + _passbuf.length);

    ret_buf.writeUInt32LE(_userbuf.length, 0);
    ret_buf.writeUInt32LE(_passbuf.length, 4);

    _userbuf.copy(ret_buf, 8);
    _passbuf.copy(ret_buf, 8 + _userbuf.length);

    return ret_buf;
  }

  static FromBuf(buf: Buffer): Credentials {
    let userSize = buf.readUInt32LE(0);
    let passSize = buf.readUInt32LE(4);

    let Username = buf.toString("utf-8", 8, 8 + userSize);
    let Password = buf.toString("utf-8", 8 + userSize, 8 + userSize + passSize);

    return new Credentials(Username, Password);
  }
}

export class SecureResult {
  /*  Native size table
   * ok - bool (1 byte)
   * status - short (2 bytes)
   * User -> UserID int (4 bytes)
   */

  public ok: boolean;
  public status: number;
  public user?: User;

  constructor(Ok: boolean, Status: number, User?: User) {
    this.ok = Ok;
    this.status = Status;
    this.user = User;
  }

  GetBuf(): Buffer {
    let ret_buf = Buffer.alloc(7);

    ret_buf.writeUInt8(this.ok ? 1 : 0, 0);
    ret_buf.writeInt16LE(this.status, 1);
    ret_buf.writeInt32LE((this.user?.ID || -1), 3);

    return ret_buf;
  }
}

//export const AuthService = new AuthServiceBase();
