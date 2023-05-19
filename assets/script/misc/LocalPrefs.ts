import { User } from "../model"


export default class LocalPrefs {
  private static K_Myself = 'k-lilliput-myself'
  private static K_RememberMe = 'k-lilliput-rememberme'
  private static K_AccountType = 'k-lilliput-accountType'
  private static K_Account = 'k-lilliput-account'
  private static K_Password = 'k-lilliput-password'

  public static set myself(val: User.Account & User.Profile | null) {
    localStorage.setItem(this.K_Myself, val == null ? null : JSON.stringify(val))
  }

  public static get myself(): User.Account & User.Profile | null {
    return JSON.parse(localStorage.getItem(this.K_Myself)) || null
  }

  public static set accountType(val: string | null) {
    localStorage.setItem(this.K_AccountType, val)
  }

  public static get accountType(): string | null {
    return localStorage.getItem(this.K_AccountType) || null
  }

  public static set account(val: string | null) {
    localStorage.setItem(this.K_Account, val)
  }

  public static get account(): string | null {
    return localStorage.getItem(this.K_Account) || null
  }

  public static set password(val: string | null) {
    localStorage.setItem(this.K_Password, val)
  }

  public static get password(): string | null {
    return localStorage.getItem(this.K_Password) || null
  }

  public static set rememberMe(val: boolean) {
    localStorage.setItem(this.K_RememberMe, val ? 'true' : 'false')
  }

  public static get rememberMe() {
    return localStorage.getItem(this.K_RememberMe) == 'true' || false
  }
}