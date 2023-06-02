import { ITriggerEvent, Quat, UITransform, Vec2, Vec3, _decorator, v3 } from 'cc'
import PlayerMgr, { Climb_Speed, QuatNeg, Roate_Speed, SyncableStates } from '../../common/PlayerMgr'
import { RockerTarget } from '../../common/RockerMgr'
import { v3ToXYZ } from '../../misc/Utils'
import { Game, PlayerState } from '../../model'
import BattleService from '../BattleService'
import IslandMgr from '../IslandMgr'
import { Lilliput } from '../LilliputEvents'
import { InteractEvent } from '../TerrainItemMgr'


const { ccclass, property } = _decorator


const TryEnterEvent = new Lilliput.UIEvent(Lilliput.PlayerEvent.Type.TryEnter)
const LeaveEvent = new Lilliput.UIEvent(Lilliput.PlayerEvent.Type.OnLeave)

const Move_Speed = 2

@ccclass('MyselfMgr')
export default class MyselfMgr extends PlayerMgr implements RockerTarget {

  private frameCount = 0

  private lstState = Game.CharacterState.None
  private lstPos = v3()

  update(dt: number) {

    if (QuatNeg.equals(this.q_rotation)) {

    } else {
      if (this.node.rotation.equals(this.q_rotation, 0.12)) {
        this.q_rotation.set(QuatNeg)
      } else {
        this.node.rotation = this.node.rotation.slerp(this.q_rotation, Roate_Speed * dt)
      }
    }

    super.update(dt)

    if (!Vec3.NEG_ONE.equals(this.dstPos)) {
      this.runTo()
    }

    switch (this._state) {
      case Game.CharacterState.Run:
        // this.rigidBody.useGravity = true
        this.rigidBody.getLinearVelocity(this.v3_speed)
        let speedY = this.v3_speed.y
        Vec3.multiplyScalar(this.v3_speed, this.node.forward.negative(), Move_Speed)
        this.v3_speed.y = speedY
        this.rigidBody.setLinearVelocity(this.v3_speed)
        break
      case Game.CharacterState.Swim:
        Vec3.multiplyScalar(this.v3_speed, this.node.forward.negative(), Move_Speed)
        this.v3_speed.y = 0
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

  lateUpdate(dt: number) {
    if (this.frameCount < 4) {
      this.frameCount++
    } else {
      this.frameCount = 0

      if (!Vec3.NEG_ONE.equals(this.dstPos)) return
      if (SyncableStates.findIndex(it => it == this._state) == -1) return

      if (this.lstState == Game.CharacterState.Idle || this.lstState == Game.CharacterState.TreadWater) {
        if (this.lstPos.equals(this.node.position, 0.03)) return
      }

      if (this.lstState == this._state && this.lstPos.equals(this.node.position, 0.03)) return
      this.lstState = this._state
      this.lstPos.set(this.node.position)
      let msg: Game.PlayerMsg = {
        cmd: Game.PlayerMsgType.Sync,
        state: this._state,
        pos: v3ToXYZ(this.node.position),
        dir: v3ToXYZ(this.node.forward)
      }
      BattleService.instance.sendPlayerMsg(msg)
    }
  }

  enter(island: IslandMgr, state: PlayerState): void {
    super.enter(island, state)
  }

  leave(): void {
    super.leave()
  }

  onAction(msg: Game.PlayerMsg) {
    super.onAction(msg)
    if (msg.state != Game.CharacterState.Run) {
      BattleService.instance.sendPlayerMsg(msg)
    }

    // if (this._interactObj) {
    //   BattleService.island()?.handleInteract(this._interactObj.index, msg.state)
    // }
  }

  protected onTriggerEnter(event: ITriggerEvent): void {

    if (event.otherCollider.node.name == 'island') {
      let pos = event.otherCollider.node.getComponent(UITransform).convertToNodeSpaceAR(this.node.worldPosition)
      let mgr = event.otherCollider.node.getComponent(IslandMgr)
      TryEnterEvent.customData = {
        islandId: mgr.senceInfo.id,
        pos
      }
      this.node.dispatchEvent(TryEnterEvent)
      return
    }

    super.onTriggerEnter(event)
  }

  protected onTriggerExit(event: ITriggerEvent): void {
    if (event.otherCollider.node.name == 'island') {
      LeaveEvent.customData = this._profile.id
      this.node.dispatchEvent(LeaveEvent)
      return
    }
    super.onTriggerExit(event)
  }

  protected updateInteractObj(event: ITriggerEvent, enter: boolean): void {
    super.updateInteractObj(event, enter)

    InteractEvent.interactions = this._interactObj?.config.interaction
    this.node.dispatchEvent(InteractEvent)
  }

  protected runTo() {
    if (this.dstPos.equals(this.node.position, 0.016)) {
      this.dstPos.set(Vec3.NEG_ONE)
      this.state = this.dstState
      this.dstState = Game.CharacterState.None
      return
    }

    // 当前位置与目标帧出现较大误差，直接跳帧
    if (Math.abs(this.node.position.y - this.dstPos.y) > 0.1) {
      this.node.position = this.dstPos
      this.state = this.dstState
      this.dstPos.set(Vec3.NEG_ONE)
      this.dstState = Game.CharacterState.None
    } else {
      this.state = Game.CharacterState.Run
      Vec3.subtract(this.v3_dir, this.dstPos, this.v3_pos)
      this.v3_dir.y = 0
      Quat.fromViewUp(this.q_rotation, this.v3_dir.normalize())
      this.node.rotation = this.q_rotation
      this.q_rotation.set(QuatNeg)
    }
  }

  onDirectionChanged(dir: Vec2) {
    if (SyncableStates.findIndex(it => it == this._state) == -1) return

    this._curDir.set(dir)

    if (Vec2.ZERO.equals(this._curDir)) {
      this.state = Game.CharacterState.None
      return
    }

    this.state = this._inWater ? Game.CharacterState.Swim : Game.CharacterState.Run
    this.dstPos.set(Vec3.NEG_ONE)
    this.v3_dir.set(this.followCamera.forward)
    Vec3.rotateY(this.v3_dir, this.v3_dir, Vec3.ZERO, dir.signAngle(Vec2.UNIT_Y))
    Quat.fromViewUp(this.q_rotation, this.v3_dir.normalize())
  }
}