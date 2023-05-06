import { Quat, SkeletalAnimation, SkinnedMeshRenderer, Texture2D, Vec2, Vec3, _decorator, instantiate, lerp, v3 } from 'cc'
import PlayerMgr, { Climb_Speed, QuatNeg, Roate_Speed } from '../../common/PlayerMgr'
import { RockerTarget } from '../../common/RockerMgr'
import { Game, User } from '../../model'
import BattleService from '../BattleService'
import IslandAssetMgr from '../IslandAssetMgr'
import { isDebug } from '../../misc/Utils'


const { ccclass, property } = _decorator

const Move_Speed = 2


@ccclass('MyselfMgr')
export default class MyselfMgr extends PlayerMgr implements RockerTarget {

  private frameCount = 0

  private lstState = Game.CharacterState.None
  private lstPos = v3()

  private curAngle = 0
  private dstAngle = 0
  private radius = 0

  onLoad() {
    super.onLoad()
    // this.node.getChildByName('Prediction').active = false
  }

  update(dt: number) {
    if (this._isEdit) return

    if (QuatNeg.equals(this._rotation)) {

    } else {
      if (this.node.rotation.equals(this._rotation, 0.12)) {
        this._rotation.set(QuatNeg)
      } else {
        this.node.rotation = this.node.rotation.slerp(this._rotation, Roate_Speed * dt)
      }
    }

    super.update(dt)

    if (!Vec3.NEG_ONE.equals(this.dstPos)) {
      this.runTo()
    }

    switch (this._state) {
      case Game.CharacterState.Run:
        this.rigidBody.useGravity = true
        this.rigidBody.getLinearVelocity(this.v3_speed)
        let speedY = this.v3_speed.y
        Vec3.multiplyScalar(this.v3_speed, this.node.forward.negative(), Move_Speed)
        this.v3_speed.y = speedY
        this.rigidBody.setLinearVelocity(this.v3_speed)
        break
      case Game.CharacterState.Climb:
        if (this._canClimb) {
          this.v3_speed.set(0, Climb_Speed, 0)
          this.rigidBody.setLinearVelocity(this.v3_speed)
        } else {
          this._canSync = false
          Vec3.multiplyScalar(this.dstPos, this.node.forward.negative(), 0.5)
          this.dstPos.add(this.node.position)
          this._postState = Game.CharacterState.Idle
        }
        break
    }
  }

  lateUpdate(dt: number) {
    if (!BattleService.started) return

    if (this.frameCount < 4) {
      this.frameCount++
    } else {
      this.frameCount = 0

      if (this._state != Game.CharacterState.Idle && this._state != Game.CharacterState.Run) {
        return
      }

      if (this.lstState == this._state &&
        (this.lstState == Game.CharacterState.Idle || this.lstPos.equals(this.node.position, 0.03))) {
        return
      }

      if (!Vec3.NEG_ONE.equals(this.dstPos))
        return

      this.lstPos.set(this.node.position)
      this.lstState = this._state
      let msg: Game.PlayerMsg = {
        cmd: Game.PlayerMsgType.Sync,
        state: this._state,
        pos: { x: this.node.position.x, y: this.node.position.y, z: this.node.position.z },
        dir: { x: this.node.forward.x, y: this.node.forward.y, z: this.node.forward.z }
      }
      BattleService.sendPlayerMsg(msg)
    }
  }

  onAction(msg: Game.PlayerMsg) {
    super.onAction(msg)

    if (msg.state != Game.CharacterState.Run) {
      BattleService.sendPlayerMsg(msg)
    }
  }

  protected runTo() {
    if (this.dstPos.equals(this.node.position, 0.016)) {
      this.dstPos.set(Vec3.NEG_ONE)
      if (this._postState != Game.CharacterState.None) {
        this.state = this._postState
        this._postState = Game.CharacterState.None
      }
      return
    }

    // 当前位置与目标帧出现较大误差，直接跳帧
    if (Math.abs(this.node.position.y - this.dstPos.y) > 0.1) {
      this.node.position = this.dstPos
      this.dstPos.set(Vec3.NEG_ONE)
      this.state = this._postState == Game.CharacterState.None ? Game.CharacterState.Idle : this._postState
    } else {
      this.state = Game.CharacterState.Run
      Vec3.subtract(this.v3_dir, this.dstPos, this.v3_pos)
      this.v3_dir.y = 0
      Quat.fromViewUp(this._rotation, this.v3_dir.normalize())
      this.node.rotation = this._rotation
      this._rotation.set(QuatNeg)
    }
  }

  onDirectionChanged(dir: Vec2) {
    if (this._state != Game.CharacterState.Idle &&
      this._state != Game.CharacterState.Run &&
      this._state != Game.CharacterState.JumpUp) {
      return
    }

    this._curDir.set(dir)
    // this.rigidBody.getLinearVelocity(this.v3_speed)
    // if (this.v3_speed.y != 0) {
    //   this.state = Game.CharacterState.Idle
    //   return
    // }

    if (Vec2.ZERO.equals(dir)) {
      this.state = Game.CharacterState.Idle
    } else {
      this.state = Game.CharacterState.Run
      this.dstPos.set(Vec3.NEG_ONE)
      this.v3_dir.set(this.followCamera.forward)
      Vec3.rotateY(this.v3_dir, this.v3_dir, Vec3.ZERO, dir.signAngle(Vec2.UNIT_Y))
      Quat.fromViewUp(this._rotation, this.v3_dir.normalize())
    }
  }
}