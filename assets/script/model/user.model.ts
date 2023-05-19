import { Common } from '.'


export namespace User {

  export enum UserGender {
    FEMALE,
    MALE,
    UNKNOWN
  }

  export interface UserAuth {
    role: string, // 角色
    expired: number, // 有效期
  }

  export interface Account {
    id: string
    phone?: string
    displayPhone?: string
    encryptPwd?: string
  }

  export interface Profile {
    id?: string
    username?: string
    avatar?: string
    coins?: number
  }
}