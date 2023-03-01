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

  export interface Account extends Common.DBDoc {
    phone?: string,
    encryptPWD?: string,
    token?: string,
  }

  export interface Profile extends Common.DBDoc {
    uid?: string
    showNo?: string,
    name?: string,
    gender?: UserGender,
    avatar?: string,
    score?: number
  }


  export interface UserGradeInfo {
    gradeLevel: number
    curGradeName: string
    curGradeIcon: string
    nextGradeName: string
    nextGradeIcon: string
    diffScore: number
  }

  export interface GradeItem extends Common.DBDoc {
    level: number
    score: number
    icon: string
    name: string
    group: string
  }

  export interface GradeScoreRecord extends Common.DBDoc {
    uid: string
    score: number
    note: string // 积分来源备注
    timestamp: number
  }

  export enum VIPStatus {
    On,  // 在线
    Off  // 下线
  }

  export enum VIPType {
    Normal,
    SVIP
  }

  export interface UserVIPInfo {
    vipType?: VIPType
    vipExpired?: number
    vipId?: string
  }

  export interface VIPItem extends Common.DBDoc {
    name: string
    type: VIPType
    price: number
    discount: number
    expired: number
    status: VIPStatus
    seq: number
  }

  export interface VIPOrder extends Common.DBDoc {
    uid: string
    vipId: string
    type: VIPType
    payId: string
    timestamp: number
    expired: number
  }
}