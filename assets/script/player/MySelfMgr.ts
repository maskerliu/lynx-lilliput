import { Quat, Vec2, Vec3, _decorator } from 'cc'
import { Game } from '../model'
import { RockerTarget } from '../ui/RockerMgr'
import PlayerMgr, { Climb_Speed, Move_Speed, Roate_Speed } from './PlayerMgr'
const { ccclass, property } = _decorator

@ccclass('MyselfMgr')
export default class MyselfMgr extends PlayerMgr implements RockerTarget {


  onLoad() {
    super.onLoad()

    this._isMyself = true
  }

  start() {
    super.start()

  }


  update(dt: number) {
    super.update(dt)

    if (!this.dstPos.equals(Vec3.NEG_ONE)) {
      this.runTo()
    }

    this._canSync = this._postState == Game.CharacterState.None && this._canSync

    switch (this._state) {
      case Game.CharacterState.Run:
        let dir = this.node.forward.negative()
        this.rigidBody.getLinearVelocity(this.v3_speed)
        let speedY = this.v3_speed.y
        Vec3.multiplyScalar(this.v3_speed, dir, Move_Speed)
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

    this._curDir.set(dir)
    if (this._state == Game.CharacterState.Run && dir.equals(Vec2.ZERO)) {
      this.state = Game.CharacterState.Idle
      return
    }

    this.rigidBody.getLinearVelocity(this.v3_speed)
    if (this.v3_speed.y != 0) return

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