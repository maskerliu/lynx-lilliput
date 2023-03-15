import {
  clamp, Component, CylinderCollider, DirectionalLight, Event, geometry,
  ICollisionEvent, instantiate, ITriggerEvent, lerp, Node, PhysicsSystem, Prefab, quat, Quat,
  RigidBody, SkeletalAnimation, SkinnedMeshRenderer, Texture2D,
  tween, UITransform, v2, v3, Vec2, Vec3, _decorator, physics
} from 'cc'
import BattleService from '../BattleService'
import { Game, User } from '../model'
import IslandAssetMgr from '../IslandAssetMgr'
import TerrainItemMgr from '../TerrainItemMgr'
import { RockerTarget } from '../ui/RockerMgr'
import LadderMgr from '../prop/LadderMgr'
import PlayerMgr from './PlayerMgr'
import BasicPlayerMgr, { Move_Speed } from './BasicPlayerMgr'
const { ccclass, property } = _decorator

@ccclass('MyselfPlayerMgr')
export default class MyselfPlayerMgr extends BasicPlayerMgr implements RockerTarget {



  onLoad() {


  }

  update(dt: number) {
    super.update(dt)

    if (this._state == Game.CharacterState.Run) {
      let dir = this.node.forward.negative()
      Vec3.multiplyScalar(this._speed, dir, Move_Speed)
      this._speed.y = 0
      this.rigidBody.setLinearVelocity(this._speed)
    } else if (this._state == Game.CharacterState.Climb) {
      if (!this.canClimb)
        this.state = Game.CharacterState.Idle
      else {
        this._speed.set(0, 0.3, 0)
        this.rigidBody.setLinearVelocity(this._speed)
      }
    }
  }

  onAction(msg: Game.Msg) {
    switch (msg.state) {
      case Game.CharacterState.JumpUp:
        this.jump()
        break
      case Game.CharacterState.Lift:
        this.lift()
        break
      case Game.CharacterState.Throw:
        this.throw()
        break
      case Game.CharacterState.Kick:
        this.kick()
        break
      case Game.CharacterState.Idle:
        this.state = Game.CharacterState.Idle
        this.rigidBody.clearState()
        this.rigidBody.sleep()
        break
      case Game.CharacterState.BoxIdle:
        this.state = Game.CharacterState.BoxIdle
        this.rigidBody.clearState()
        this.rigidBody.sleep()
        break
      case Game.CharacterState.BoxWalk:
        this.state = Game.CharacterState.BoxWalk
        this.rigidBody.clearState()
        this.rigidBody.sleep()
        break
      case Game.CharacterState.Climb:
        this.climb()
        break
      case Game.CharacterState.Push:
        this.state = Game.CharacterState.Push
        break
    }
  }

  protected onCollisionStay(event: ICollisionEvent) {
    switch (this._state) {
      case Game.CharacterState.JumpUp:
      case Game.CharacterState.Climb:
        break

      case Game.CharacterState.Run:
        if (event.otherCollider.node.name == 'dice') {
          console.log('dice')
          this.fixedConstraint.connectedBody = event.otherCollider.node.getComponent(RigidBody)
        } else {

        }
      default:
        this.rigidBody.clearState()
        break
    }
  }

  protected onTriggerEnter(event: ITriggerEvent) {
    this.curInteractProp = event.otherCollider.node
    if (this.curInteractProp.name == 'ladder') { this.canClimb = true }
  }

  onDirectionChanged(dir: Vec2) {

  }

  onEditModel(edit: boolean) {
    PhysicsSystem.instance.enable = !edit
    if (!edit) {
      this.resume()
    }
  }


  protected set state(state: Game.CharacterState) {

    if (this._state == state) { return }

    super.state = state
    if (this._state == state) {
      BattleService.sendGameMsg({ type: Game.MsgType.Cmd, state })
    }
  }
}