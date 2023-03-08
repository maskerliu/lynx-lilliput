import { Common } from '.'

export namespace Game {


  export enum CharacterState {
    None,
    Idle,
    Running,
    Jump,
    JumpUp,
    JumpLanding,
    Sitting,
    Dancing,
    Lifting,
    Throwing,
    Kicking,
    BoxIdle,
    BoxWalk,
    Climbing,
    Push,
  }

  export enum IslandStatus {
    None,
    Open,
    Close,
    Private
  }

  export interface Island extends Common.DBDoc {
    owner?: string
    map: Array<MapItem>
    status: IslandStatus
  }

  export interface BattleRoom extends Common.DBDoc {
    island: string
    online: Array<string>
  }

  export interface MapItemSkin {
    orginPart: string
    skin: string
  }

  export interface MapItem {
    x: number
    y: number
    z: number
    prefab: string
    angle: number
    skin?: string
  }

  export enum MsgType {
    Sys, // 系统消息，预留
    Cmd, // 指令动作
    Enter, // 进入
    Leave, // 离开
    Sync, // 同步坐标
  }

  export interface Msg {
    uid?: string
    type: MsgType
    state?: CharacterState
    pos?: { x: number, y: number, z: number }
    dir?: { x: number, y: number, z: number }
    seq?: number // 消息序列
  }
}