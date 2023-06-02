import { ITriggerEvent, Quat, Vec3, _decorator } from 'cc'
import PlayerMgr, { Climb_Speed, InteractStates, QuatNeg, SyncableStates } from '../../common/PlayerMgr'
import { Game, PlayerState } from '../../model'
import BattleService from '../BattleService'
import IslandMgr from '../IslandMgr'
import { DataChange } from '@colyseus/schema'


const { ccclass, property } = _decorator

const Speed_Def = 2.5
const Speed_Fast = 3

const MAX_RAIDUS = Math.PI / 180 * 5

const FRAME_SIZE = 10

@ccclass('OtherMgr')
export default class OtherMgr extends PlayerMgr {
  private _speed = 2.5

  private _stateFrames: Array<Game.PlayerMsg> = new Array()

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
    this.runTo()

    super.update(dt)

    switch (this._state) {
      case Game.CharacterState.Run:
        this.rigidBody.getLinearVelocity(this.v3_speed)
        let speedY = this.v3_speed.y
        if (Vec3.NEG_ONE.equals(this.dstPos)) {
          this.v3_speed.set(Vec3.ZERO)
        } else {
          // this._speed = BattleService.instance.playerFrameCount(this.profile.id) > 4 ? Speed_Fast : Speed_Def
          this._speed = Speed_Def
          Vec3.multiplyScalar(this.v3_speed, this.node.forward.negative(), this._speed)
        }
        this.v3_speed.y = speedY
        this.rigidBody.setLinearVelocity(this.v3_speed)
        break
      case Game.CharacterState.Swim:
        if (Vec3.NEG_ONE.equals(this.dstPos)) {
          this.v3_speed.set(Vec3.ZERO)
        } else {
          Vec3.multiplyScalar(this.v3_speed, this.node.forward.negative(), Speed_Def)
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
          this.dstState = Game.CharacterState.Run
        }
        break
    }
  }

  protected lateUpdate(dt: number): void {
    this.popPlayerFrame()
  }

  onAction(msg: Game.PlayerMsg) {
    if (msg == null) return
    super.onAction(msg)

    if (this._interactObj && InteractStates.includes(msg.state)) {
      BattleService.instance.island()?.handleInteract(this._interactObj.index, msg.state)
    }
  }

  enter(island: IslandMgr, state: PlayerState): void {
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

  protected runTo() {

    if (Vec3.NEG_ONE.equals(this.dstPos)) return

    if (this.dstPos.equals(this.node.position, 0.032)) {
      this.state = this.dstState
      if (this._state == Game.CharacterState.Idle || this._state == Game.CharacterState.TreadWater) {
        this.node.forward = this.dstForward
      }

      this.dstState = Game.CharacterState.None
      this.dstForward.set(Vec3.NEG_ONE)
      this.dstPos.set(Vec3.NEG_ONE)

      return
    }

    // 当前位置与目标帧出现较大误差，直接跳帧
    if (Math.abs(this.node.position.y - this.dstPos.y) > 0.1) { // || BattleService.instance.playerFrameCount(this.profile.id) > 4) {
      this.node.position = this.dstPos
      this.state = this.dstState
      this.dstState = Game.CharacterState.None
      this.dstPos.set(Vec3.NEG_ONE)
      this.dstForward.set(Vec3.NEG_ONE)
    } else {
      this.state = this._inWater ? Game.CharacterState.Swim : Game.CharacterState.Run
      Vec3.subtract(this.v3_dir, this.dstPos, this.node.position)
      this.v3_dir.y = 0
      Quat.fromViewUp(this.q_rotation, this.v3_dir.normalize())

      if (Vec3.angle(this.node.forward.negative(), this.v3_dir) > MAX_RAIDUS) {
        this.node.rotation = this.q_rotation
      }
    }
  }

  private onPlayerStateChanged(changes: DataChange[]) {
    if (this._usedIdx == FRAME_SIZE - 1) {
      this._usedIdx = 0
    } else {
      this._usedIdx++
    }

    if (this._usedIdx == this._curIdx) {
      this._curIdx += 4

      // 跳帧
      if (this._curIdx >= FRAME_SIZE) { this._curIdx -= FRAME_SIZE }
    }

    changes.forEach(it => {
      this._playerState[it.field] = it.value
    })

    this.updateStateFrame()
  }

  private get prevUsedIdx() {
    return this._usedIdx == FRAME_SIZE - 2 ? 0 : this._usedIdx + 1
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

  private popPlayerFrame() {
    if (SyncableStates.findIndex(it => it == this._state) == -1) return
    if (!Vec3.NEG_ONE.equals(this.dstPos)) return
    if (this._curIdx == this._usedIdx) {
      if (this._popped) { return }
      else {
        this.onAction(this._stateFrames[this._curIdx])
        this._popped = true
        return
      }
    } else {
      this._popped = false
      if (this._curIdx >= FRAME_SIZE - 1) {
        this._curIdx = 0
      } else {
        this._curIdx++
      }
      this.onAction(this._stateFrames[this._curIdx])
    }
  }
}