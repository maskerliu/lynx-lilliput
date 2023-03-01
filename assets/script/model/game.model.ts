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
    Sys,
    Cmd,
    Enter,
    Leave,
  }

  export interface Msg {
    uid?: string
    type: MsgType
    state?: CharacterState
    pos: { x: number, y: number, z: number }
    seq?: number // 消息序列
  }
}