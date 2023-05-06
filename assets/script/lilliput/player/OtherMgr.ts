import { Node, Quat, Vec3, _decorator, lerp, v3 } from 'cc'
import PlayerMgr, { Climb_Speed, Push_Speed, QuatNeg, Roate_Speed } from '../../common/PlayerMgr'
import { Game, User } from '../../model'
import BattleService from '../BattleService'
import { PropMgrs } from '../IslandMgr'
import TerrainItemMgr from '../TerrainItemMgr'


const { ccclass, property } = _decorator

const Speed_Def = 2.5
const Speed_Fast = 3

const MAX_RAIDUS = Math.PI / 180 * 5

@ccclass('OtherMgr')
export default class OtherMgr extends PlayerMgr {
  private _speed = 2.5


  onLoad() {
    super.onLoad()

    // this.prediction = this.node.getChildByName('Prediction')

  }

  update(dt: number) {
    if (this._isEdit) return

    if (!Vec3.NEG_ONE.equals(this.dstPos)) this.runTo()

    // if (!QuatNeg.equals(this._rotation)) {
    //   if (this.node.rotation.equals(this._rotation, 0.128)) {
    //     this._rotation.set(QuatNeg)
    //   } else {
    //     this.node.rotation = this.node.rotation.slerp(this._rotation, Roate_Speed * dt)
    //   }
    //   return
    // }

    super.update(dt)

    switch (this._state) {
      case Game.CharacterState.Run:
        this.rigidBody.getLinearVelocity(this.v3_speed)
        let speedY = this.v3_speed.y
        if (Vec3.NEG_ONE.equals(this.dstPos)) {
          this.v3_speed.set(Vec3.ZERO)
        } else {
          this._speed = BattleService.playerFrameCount(this.userProfile.uid) > 4 ? Speed_Fast : Speed_Def
          Vec3.multiplyScalar(this.v3_speed, this.node.forward.negative(), this._speed)
        }
        this.v3_speed.y = speedY
        this.rigidBody.setLinearVelocity(this.v3_speed)
        break
      case Game.CharacterState.Climb:
        if (this._canClimb) {
          this.v3_speed.set(0, Climb_Speed, 0)
          this.rigidBody.setLinearVelocity(this.v3_speed)
        } else {
          Vec3.multiplyScalar(this.dstPos, this.node.forward.negative(), 0.5)
          this.dstPos.add(this.node.position)
          this._postState = Game.CharacterState.None
        }
        break
    }
  }

  protected lateUpdate(dt: number): void {
    // 正在执行action
    if (this._state != Game.CharacterState.Idle &&
      this._state != Game.CharacterState.Run &&
      this._state != Game.CharacterState.Climb &&
      this._state != Game.CharacterState.TreadWater &&
      this.animState()) {
      return
    }

    if (Vec3.NEG_ONE.equals(this.dstPos)) {
      this.onAction(BattleService.popPlayerFrame(this.userProfile.uid))
    }
  }

  onAction(msg: Game.PlayerMsg) {
    if (msg == null) return
    super.onAction(msg)

    if (this.curInteractProp) {
      let mgr: TerrainItemMgr
      let clazz = PropMgrs.get(this.curInteractProp.name)
      if (clazz != null) {
        mgr = this.curInteractProp.getComponent(clazz)
      } else {
        mgr = this.curInteractProp.getComponent(TerrainItemMgr)
      }
      BattleService.island()?.handleInteract(mgr.index, msg.state)
    }
  }

  protected runTo() {
    if (this.dstPos.equals(this.node.position, 0.032)) {
      if (this._postState != Game.CharacterState.None) {
        this.state = this._postState
        this._rotation.set(QuatNeg)
        if (this._postState == Game.CharacterState.Idle) {
          this.node.forward = this.dstForward
          this.dstForward.set(Vec3.NEG_ONE)
        }
        this._postState = Game.CharacterState.None
      }

      this.dstPos.set(Vec3.NEG_ONE)
      return
    }

    // 当前位置与目标帧出现较大误差，直接跳帧
    if (Math.abs(this.node.position.y - this.dstPos.y) > 0.1 || BattleService.playerFrameCount(this.userProfile.uid) > 4) {
      this.node.position = this.dstPos
      this.state = this._postState == Game.CharacterState.None ? Game.CharacterState.Idle : this._postState
      this._postState = Game.CharacterState.None
      this._rotation.set(QuatNeg)
      this.dstPos.set(Vec3.NEG_ONE)
      if (!Vec3.NEG_ONE.equals(this.dstForward)) {
        // this.node.forward = this.dstForward
        this.dstForward.set(Vec3.NEG_ONE)
      }
    } else {
      this.state = Game.CharacterState.Run
      Vec3.subtract(this.v3_dir, this.dstPos, this.node.position)
      this.v3_dir.y = 0
      Quat.fromViewUp(this._rotation, this.v3_dir.normalize())

      if (Vec3.angle(this.node.forward.negative(), this.v3_dir) > MAX_RAIDUS) {
        this.node.rotation = this._rotation
      }

      // console.log(Vec3.angle(this.node.forward.negative(), this.v3_dir) * 180 / Math.PI)
    }
  }
}