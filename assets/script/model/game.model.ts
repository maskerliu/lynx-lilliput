import { Common } from '.'

export namespace Game {


  export enum CharacterState {
    None,
    Idle,
    Run,
    BoxIdle,
    BoxWalk,
    Sit,
    Climb,
    Jump,
    JumpUp,
    JumpLand,
    Lift,
    Throw,
    Kick,
    Push,
    Grab,
    PickUp,
    Watering,
    Attack,
    Dance,
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

  export interface Msg {
    type?: MsgType
    seq?: number // 消息序列
  }

  export enum MsgType {
    Sys, // 系统消息，预留
    Prop,
    Player,
  }

  export enum PlayerMsgType {
    Sync, // 指令动作
    Enter, // 进入
    Leave, // 离开
  }

  export interface PlayerMsg extends Msg {
    uid?: string
    cmd: PlayerMsgType
    state?: CharacterState
    pos?: { x: number, y: number, z: number }
    dir?: { x: number, y: number, z: number }
  }

  export interface PropMsg extends Msg {
    idx?: string
    pos?: { x: number, y: number, z: number }
    action?: CharacterState // None: 位置同步
  }
}