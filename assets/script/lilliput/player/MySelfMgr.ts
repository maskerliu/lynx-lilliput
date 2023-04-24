import { Quat, Vec2, Vec3, _decorator, lerp } from 'cc'
import PlayerMgr, { Climb_Speed, Roate_Speed } from '../../common/PlayerMgr'
import { RockerTarget } from '../../common/RockerMgr'
import { Game } from '../../model'
import BattleService from '../BattleService'


const { ccclass, property } = _decorator

const Move_Speed = 1.5

@ccclass('MyselfMgr')
export default class MyselfMgr extends PlayerMgr implements RockerTarget {


  onLoad() {
    super.onLoad()

    // this.node.getChildByName('Prediction').active = false
  }

  start() {
    super.start()
  }

  update(dt: number) {
    if (this._isEdit) return

    if (this._rotationSpeedTo != 0) {
      this._rotateSpeed = lerp(this._rotateSpeed, this._rotationSpeedTo, 30 * dt)
      this.node.rotation = this.node.rotation.slerp(this._rotation, this._rotateSpeed * dt)
    }

    super.update(dt)
  }

  onAction(msg: Game.PlayerMsg) {
    super.onAction(msg)
    BattleService.sendPlayerMsg(msg)
  }

  lateUpdate(dt: number) {
    switch (this._state) {
      case Game.CharacterState.Run:
      case Game.CharacterState.Push:

        this.rigidBody.getLinearVelocity(this.v3_speed)
        if (this.v3_speed.equals(Vec3.ZERO)) {
          // console.log('on collision')
        }

        if (this.curDir.equals(Vec2.ZERO) && this._postState == Game.CharacterState.None) {
          this.state = Game.CharacterState.Idle
        }
        let dir = this.node.forward.negative()
        this.rigidBody.getLinearVelocity(this.v3_speed)
        let speedY = this.v3_speed.y
        // Vec3.multiplyScalar(this.v3_speed, dir, this._state == Game.CharacterState.Run ? Move_Speed : Push_Speed)

        Vec3.multiplyScalar(this.v3_speed, dir, Move_Speed)
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

  onDirectionChanged(dir: Vec2) {
    if (this._state != Game.CharacterState.Idle &&
      this._state != Game.CharacterState.Run &&
      this._state != Game.CharacterState.JumpUp &&
      this._state != Game.CharacterState.Push) {
      return
    }

    this.rigidBody.getLinearVelocity(this.v3_speed)
    if (this.v3_speed.y != 0) {
      this.state = Game.CharacterState.Idle
      return
    }

    this._curDir.set(dir)
    if (this._state == Game.CharacterState.Run && dir.equals(Vec2.ZERO)) {
      this.state = Game.CharacterState.Idle
      return
    }

    this._rotationSpeedTo = Roate_Speed
    this._rotateSpeed = 0
    this.state = Game.CharacterState.Run
    this.dstPos.set(Vec3.NEG_ONE)

    let forward = this.followCamera.forward
    this.v3_dir.set(forward.x, 0, forward.z)
    if (!Vec2.ZERO.equals(this._curDir)) {
      Vec3.rotateY(this.v3_dir, this.v3_dir, Vec3.ZERO, this._curDir.signAngle(Vec2.UNIT_Y))
    }
    Quat.fromViewUp(this._rotation, this.v3_dir.normalize())
  }
}