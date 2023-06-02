
export namespace Game {

  export enum CharacterState {
    None,
    Idle,
    Run,
    Sit,
    Climb,
    JumpUp,
    JumpLand,
    Lift,
    Throw,
    Kick,
    Grab,
    PickUp,
    Attack,
    GunFire,
    BwolingThrow,
    FrisbeeThrow,
    TreadWater,
    Swim,
    Kneel,
  }

  export interface BattleRoom {
    island: string
    online: Array<string>
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
    Local,
    Sync, // 指令动作
    Enter, // 进入
    Leave, // 离开
  }

  export interface PlayerMsg extends Msg {
    uid?: string
    cmd: PlayerMsgType
    state?: CharacterState
    interactObj?: number // 互动对象ID
    pos?: { x: number, y: number, z: number }
    dir?: { x: number, y: number, z: number }
  }

  export interface PropMsg extends Msg {
    idx?: string
    pos?: { x: number, y: number, z: number }
    action?: CharacterState // None: 位置同步
  }
}