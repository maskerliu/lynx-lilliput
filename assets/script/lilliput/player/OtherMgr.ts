import { DataChange } from '@colyseus/schema'
import { Vec3, _decorator } from 'cc'
import { BigWorld } from '../../common/BigWorld'
import { Game, PlayerState, User } from '../../model'
import BattleService from '../BattleService'
import CommonPlayerMgr, { Climb_Speed } from './CommonPlayerMgr'

const { ccclass, property } = _decorator

const Speed_Def = 200
const Speed_Fast = 100
const Swim_Speed = 120
const FRAME_SIZE = 10


@ccclass('OtherMgr')
export default class OtherMgr extends CommonPlayerMgr {
  private _speed = Speed_Def

  private _stateFrames: Array<Game.PlayerMsg> = new Array()
  private _stateFrameCost = 0

  private _curIdx = 0
  private _usedIdx = 0
  private _popped = false

  onLoad() {
    for (let i = 0; i < FRAME_SIZE; ++i) {
      this._stateFrames.push({
        cmd: Game.PlayerMsgType.Local,
        state: Game.CharacterState.None,
        dir: { x: -1, y: -1, z: -1 },
        pos: { x: -1, y: -1, z: -1 }
      })
    }
  }

  update(dt: number) {
    if (this.rigidBody == null || this.character == null) return

    super.update(dt)

    this.popStateFrame()

    switch (this._state) {
      case Game.CharacterState.Run:
        this.rigidBody.getLinearVelocity(this.v3_speed)
        let speedY = this.v3_speed.y
        this._speed = Vec3.NEG_ONE.equals(this.dstPos) ? 0 : Speed_Fast
        Vec3.multiplyScalar(this.v3_speed, this.node.forward.negative(), this._speed * dt)
        this.v3_speed.y = speedY
        this.rigidBody.setLinearVelocity(this.v3_speed)
        break
      case Game.CharacterState.Swim:
        if (Vec3.NEG_ONE.equals(this.dstPos)) {
          this.v3_speed.set(Vec3.ZERO)
        } else {
          Vec3.multiplyScalar(this.v3_speed, this.node.forward.negative(), Swim_Speed * dt)
          this.v3_speed.y = 0
        }
        this.rigidBody.setLinearVelocity(this.v3_speed)
        break
      case Game.CharacterState.Climb:
        if (this._canClimb) {
          this.v3_speed.set(0, Climb_Speed, 0)
          this.rigidBody.setLinearVelocity(this.v3_speed)
        } else {
          Vec3.multiplyScalar(this.dstPos, this.node.forward.negative(), 0.5)
          this.dstPos.add(this.node.position)
          this.dstState = Game.CharacterState.Idle
        }
        break
    }
  }

  protected runTo(): void {
    // if (this._stateFrameCost == 6 && !Vec3.NEG_ONE.equals(this.dstPos)) {
    //   this.dstPos.set(Vec3.NEG_ONE)
    //   this.dstForward.set(Vec3.NEG_ONE)
    //   this.dstState = Game.CharacterState.None
    //   this.popStateFrame()
    // } else {
    super.runTo()
    this._stateFrameCost++
    // }
  }

  onAction(msg: Game.PlayerMsg) {
    if (msg == null) return
    super.onAction(msg)

    this._stateFrameCost = 0


    if (this._curInteractObj != Number.MAX_VALUE && BigWorld.PlayerInteractStates.includes(msg.state)) {
      BattleService.instance.island()?.handleInteract(this._curInteractObj, msg.state)
    }
  }

  enter(island: BigWorld.IslandMgr, state: PlayerState): void {
    super.enter(island, state)

    this._stateFrames.forEach(it => {
      it.pos.x = -1
      it.pos.y = -1
      it.pos.z = -1
      it.dir.x = 0
      it.dir.y = 0
      it.dir.z = 0
      it.state = Game.CharacterState.None
    })

    this._curIdx = FRAME_SIZE - 1
    this._usedIdx = 0

    this.updateStateFrame()

    this._playerState.onChange((changes: DataChange[]) => {
      this.onPlayerStateChanged(changes)
    })
  }

  init(profile: User.Profile): this {
    super.init(profile)

    return this
  }

  private onPlayerStateChanged(changes: DataChange[]) {
    this._usedIdx = this._usedIdx == FRAME_SIZE - 1 ? 0 : this._usedIdx + 1

    if (this._usedIdx == this._curIdx) {
      this.dstPos.set(Vec3.NEG_ONE)
      this.dstForward.set(Vec3.NEG_ONE)
      this.dstState = Game.CharacterState.None
      this.popStateFrame()
    }

    if (this._playerState) {
      changes.forEach(it => { this._playerState[it.field] = it.value })
      this.updateStateFrame()
    }
  }

  private updateStateFrame() {
    this._stateFrames[this._usedIdx].pos.x = this._playerState.px
    this._stateFrames[this._usedIdx].pos.y = this._playerState.py
    this._stateFrames[this._usedIdx].pos.z = this._playerState.pz
    this._stateFrames[this._usedIdx].dir.x = this._playerState.dx
    this._stateFrames[this._usedIdx].dir.y = this._playerState.dy
    this._stateFrames[this._usedIdx].dir.z = this._playerState.dz
    this._stateFrames[this._usedIdx].state = this._playerState.state
  }

  private popStateFrame(): boolean {
    if (!Vec3.NEG_ONE.equals(this.dstPos) || !BigWorld.PlayerSyncableStates.includes(this._state)) return false

    if (this._curIdx == this._usedIdx) {
      return false
    } else {
      this._popped = false
      this._curIdx = this._curIdx >= FRAME_SIZE - 1 ? 0 : this._curIdx + 1
      this.onAction(this._stateFrames[this._curIdx])
      return true
    }
  }
}