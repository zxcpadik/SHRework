const goodsymbols =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_0123456789";
class AuthUtils {
  public ValidateString(str: string): boolean {
    for (let i = 0; i < str.length; i++) {
      if (!goodsymbols.includes(str[i])) return false;
    }
    return true;
  }
  public ValidatePassword(pass?: string): boolean {
    if (!pass) return false;

    if (pass.length > 64 || pass.length < 8) return false;
    return this.ValidateString(pass);
  }
  public ValidateUsername(user?: string): boolean {
    if (!user) return false;

    if (user.length > 32 || user.length < 4) return false;
    return this.ValidateString(user);
  }
}

export const AuthUtil = new AuthUtils();
