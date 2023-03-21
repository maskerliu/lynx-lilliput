import { lerp, Quat, Vec3, _decorator } from 'cc'
import BattleService from '../BattleService'
import { Game } from '../model'
import PlayerMgr, { Climb_Speed, Move_Speed } from './PlayerMgr'
const { ccclass, property } = _decorator

@ccclass('OtherMgr')
export default class OtherMgr extends PlayerMgr {

  onLoad() {
    super.onLoad()

    this._isMyself = false
  }

  start() {
    super.start()
  }

  update(dt: number) {
    super.update(dt)

    if (this.dstPos.equals(Vec3.NEG_ONE) && this._canSync) {
      let frame = BattleService.popGameFrame(this.userProfile.uid)
      if (frame) {
        this.onAction(frame)
      }
    }

    if (!this.dstPos.equals(Vec3.NEG_ONE)) {
      this.runTo()
    }

    switch (this._state) {
      case Game.CharacterState.Run:
        if (this.dstPos.equals(Vec3.NEG_ONE)) {
          this.rigidBody.getLinearVelocity(this.v3_speed)
          this.v3_speed.set(0, this.v3_speed.y, 0)
          this.rigidBody.setLinearVelocity(this.v3_speed)
        } else {
          let dir = this.node.forward.negative()
          this.rigidBody.getLinearVelocity(this.v3_speed)
          let speedY = this.v3_speed.y
          Vec3.multiplyScalar(this.v3_speed, dir, 2)
          this.v3_speed.y = speedY
          this.rigidBody.setLinearVelocity(this.v3_speed)
        }
        break
      case Game.CharacterState.Climb:
        if (this._canClimb) {
          this.v3_speed.set(0, Climb_Speed, 0)
          this.rigidBody.setLinearVelocity(this.v3_speed)
        } else {
          Vec3.multiplyScalar(this.dstPos, this.node.forward.negative(), 0.5)
          this.dstPos.add(this.node.position)
          // this.runTo()
        }
        break
    }
  }

}