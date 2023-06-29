import { ITriggerEvent, Quat, UITransform, Vec2, Vec3, _decorator, quat, v3 } from 'cc'
import { BigWorld } from '../../common/BigWorld'
import { RockerTarget } from '../../common/RockerMgr'
import { QuatNeg, v3ToXYZ } from '../../misc/Utils'
import { Game, PlayerState } from '../../model'
import BattleService from '../BattleService'
import CommonPlayerMgr, { Climb_Speed, Roate_Speed } from './CommonPlayerMgr'

const { ccclass, property } = _decorator

const TryEnterEvent = new BigWorld.PlayerEvent(BigWorld.PlayerEvent.Type.TryEnter)
const LeaveEvent = new BigWorld.PlayerEvent(BigWorld.PlayerEvent.Type.OnLeave)
const InteractEvent = new BigWorld.PropEvent(BigWorld.PropEvent.Type.ShowInteractMenu)

const Move_Speed = 100
const Swim_Speed = 120

@ccclass('MyselfMgr')
export default class MyselfMgr extends CommonPlayerMgr implements RockerTarget {

  private dstRotation: Quat = quat(QuatNeg)
  private frameCount = 0

  private lstState = Game.CharacterState.None
  private lstPos = v3()

  update(dt: number) {
    if (this.rigidBody == null || this.character == null) return

    if (!QuatNeg.equals(this.dstRotation)) {
      if (this.node.rotation.equals(this.dstRotation, 0.12)) {
        this.dstRotation.set(QuatNeg)
      } else {
        this.node.rotation = this.node.rotation.slerp(this.dstRotation, Roate_Speed * dt)
      }
    }

    super.update(dt)

    switch (this._state) {
      case Game.CharacterState.Run:
        this.rigidBody.getLinearVelocity(this.v3_speed)
        let speedY = this.v3_speed.y
        Vec3.multiplyScalar(this.v3_speed, this.node.forward.negative(), Move_Speed * dt)
        this.v3_speed.y = speedY
        this.rigidBody.setLinearVelocity(this.v3_speed)
        break
      case Game.CharacterState.Swim:
        Vec3.multiplyScalar(this.v3_speed, this.node.forward.negative(), Swim_Speed * dt)
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

    if (BigWorld.PlayerSyncableStates.includes(this._state)) {
      if (this.lstState != this._state) {
        this.syncStateFrame()
      } else {
        if (this.frameCount == 0 && !this.node.position.equals(this.lstPos, 0.03)) {
          this.syncStateFrame()
        } else {
          this.frameCount = this.frameCount < 4 ? this.frameCount + 1 : 0
          this.lstState = this._state
        }
      }
    }
  }

  syncStateFrame() {
    this.lstPos.set(this.node.position)
    this.lstState = this._state
    this.frameCount = 0
    let msg: Game.PlayerMsg = {
      cmd: Game.PlayerMsgType.Sync,
      state: this._state,
      pos: v3ToXYZ(this.node.position),
      dir: v3ToXYZ(this.node.forward)
    }
    BattleService.instance.sendPlayerMsg(msg)
  }

  enter(island: BigWorld.IslandMgr, state: PlayerState): void {
    super.enter(island, state)
  }

  leave(): void {
    super.leave()
  }

  onAction(msg: Game.PlayerMsg) {
    super.onAction(msg)

    if (!BigWorld.PlayerSyncableStates.includes(msg.state)) {
      BattleService.instance.sendPlayerMsg(msg)
    }

    // if (this._interactObj) {
    //   BattleService.island()?.handleInteract(this._interactObj.index, msg.state)
    // }
  }

  protected onTriggerEnter(event: ITriggerEvent): void {

    if (event.otherCollider.node.name == 'island') {
      let pos = event.otherCollider.node.getComponent(UITransform).convertToNodeSpaceAR(this.node.worldPosition)
      let mgr = event.otherCollider.node.getComponent('LilliputIslandMgr') as BigWorld.IslandMgr
      TryEnterEvent.customData = { islandId: mgr.senceInfo.id, pos }
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

    if (this._islandMgr) {
      InteractEvent.interactions = this._islandMgr.mapInfo(this._curInteractObj)?.config.interaction
      this.node.dispatchEvent(InteractEvent)
    }

  }

  onDirectionChanged(dir: Vec2) {
    this.dstRotation.set(QuatNeg)
    if (!BigWorld.PlayerSyncableStates.includes(this._state)) return

    this._curDir.set(dir)

    if (Vec2.ZERO.equals(this._curDir)) {
      this.state = Game.CharacterState.None
      return
    }

    this.state = this._inWater ? Game.CharacterState.Swim : Game.CharacterState.Run
    this.dstPos.set(Vec3.NEG_ONE)
    this.v3_dir.set(this._followCamera.forward)
    Vec3.rotateY(this.v3_dir, this.v3_dir, Vec3.ZERO, dir.signAngle(Vec2.UNIT_Y))
    Quat.fromViewUp(this.dstRotation, this.v3_dir.normalize())
  }
}