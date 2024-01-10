import { AppDataSource, UserRepo } from "./db-service";
import { User } from "../entities/user";
import { AuthUtil } from "../utils/auth-utils";
import { Repository } from "typeorm";


class AuthServiceBase {
  public async Auth(credits: Credentials) : Promise<SecureResult> {
    if (!(AuthUtil.ValidatePassword(credits.Password) && AuthUtil.ValidateUsername(credits.Username))) return new SecureResult(false, 101);
      let User = await UserRepo.findOneBy({
        Username: credits.Username,
      })
      if (!User) return new SecureResult(false, 102);

      if (User.IsPasswordMach(credits.Password)) {
        User.LastAuth = new Date();
        let usr = await UserRepo.save(User);
        return new SecureResult(true, 100, usr);
      }

      return new SecureResult(false, 103);
  }

  public async Create(credits: Credentials): Promise<SecureResult> {
    if (!(AuthUtil.ValidatePassword(credits.Password) && AuthUtil.ValidateUsername(credits.Username))) return new SecureResult(false, 121);
    
    let UserEx = await UserRepo.existsBy({
      Username: credits.Username,
    })
    if (UserEx) return new SecureResult(false, 122);

    let Usr = new User();
    Usr.Username = credits.Username || '';
    Usr.UpdatePassword(credits.Password || '');

    let usr = await UserRepo.save(Usr);
    return new SecureResult(true, 120, usr);
  }

  public async Update(credits: Credentials, newpass: string | undefined): Promise<SecureResult> {
    if (!AuthUtil.ValidateUsername(credits.Username)) return new SecureResult(false, 151);
    if (!AuthUtil.ValidatePassword(newpass)) return new SecureResult(false, 152);

    let User = await UserRepo.findOneBy({
      Username: credits.Username,
    });
    if (!User) return new SecureResult(false, 153);

    User.UpdatePassword(newpass || '');

    let usr = await UserRepo.save(User);
    return new SecureResult(true, 150, usr);
  }
} 


export class Credentials {
  public Username?: string;
  public Password?: string;

  constructor (Username?: string, Password?: string) {
    this.Username = Username ? Username?.toLowerCase() : undefined;
    this.Password = Password;
  }
}

export class SecureResult {
  public ok: boolean;
  public status: number;
  public user?: User;

  constructor (Ok: boolean, Status: number, User?: User) {
    this.ok = Ok;
    this.status = Status;
    this.user = User;
  }
}


export const AuthService = new AuthServiceBase();