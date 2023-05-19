import { Node, Quat, SkeletalAnimation, SkinnedMeshRenderer, Vec2, Vec3, instantiate, v3 } from 'cc'
import PlayerMgr, { Climb_Speed, QuatNeg, Roate_Speed } from '../common/PlayerMgr'
import { Game, User } from '../model'

const Move_Speed = 2

export default class ArcadePlayerMgr extends PlayerMgr {

  onLoad(): void {

  }

  init(profile: User.Profile, prefab: Node) {

    this.node.getChildByName('Debug').active = false
    let character = instantiate(prefab)
    character.position = v3(0, -0.5, 0)
    this.node.addChild(character)
    this.animation = this.getComponentInChildren(SkeletalAnimation)
    this.meshRenderer = this.getComponentInChildren(SkinnedMeshRenderer)
    return this
  }

  update(dt: number) {
    if (this._isEdit) return

    if (QuatNeg.equals(this._rotation)) {

    } else {
      if (this.node.rotation.equals(this._rotation, 0.12)) {
        this._rotation.set(QuatNeg)
      } else {
        // this._rotateSpeed = lerp(this._rotateSpeed, Roate_Speed, 30 * dt)
        this.node.rotation = this.node.rotation.slerp(this._rotation, Roate_Speed * dt)
      }
    }
    super.update(dt)
  }

  onAction(msg: Game.PlayerMsg) {
    super.onAction(msg)


    // BattleService.sendPlayerMsg(msg)
  }

  lateUpdate(dt: number) {
    switch (this._state) {
      case Game.CharacterState.Run:
        this.rigidBody.getLinearVelocity(this.v3_speed)
        if (this.v3_speed.equals(Vec3.ZERO)) {
          
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
      this._state != Game.CharacterState.JumpUp) {
      return
    }

    // this.rigidBody.getLinearVelocity(this.v3_speed)
    // if (this.v3_speed.y != 0) {
    //   // this.state = Game.CharacterState.Idle
    //   return
    // }

    if ((this._state == Game.CharacterState.Run || this._state == Game.CharacterState.Idle) && Vec2.ZERO.equals(dir)) {
      this.state = Game.CharacterState.Idle
      return
    }

    this.state = Game.CharacterState.Run
    this.dstPos.set(Vec3.NEG_ONE)

    this.v3_dir.set(this.followCamera.forward.x, 0, this.followCamera.forward.z)
    if (!Vec2.ZERO.equals(dir)) {
      Vec3.rotateY(this.v3_dir, this.v3_dir, Vec3.ZERO, dir.signAngle(Vec2.UNIT_Y))
    }
    Quat.fromViewUp(this._rotation, this.v3_dir.normalize())
  }
}