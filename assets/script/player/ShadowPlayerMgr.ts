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
import BasicPlayerMgr from './BasicPlayerMgr'
const { ccclass, property } = _decorator

@ccclass('ShadowPlayerMgr')
export default class ShadowPlayerMgr extends BasicPlayerMgr {

  private dstPos = v3(Vec3.NEG_ONE)


  onLoad() {


  }

  update(dt: number) {
    super.update(dt)


    if (this.dstPos.equals(Vec3.NEG_ONE)) {
      let frame = BattleService.popGameFrame(this.userProfile.uid)
      if (frame) this.onAction(frame)
    }

    if (this.dstPos.equals(this.node.position, 0.06)) {
      this.dstPos.set(Vec3.NEG_ONE)
      this.rigidBody.clearState()
      this.state = Game.CharacterState.Idle
    }

    if (!this.dstPos.equals(Vec3.NEG_ONE)) {
      this.runTo()
    }
  }


  private runTo() {
    this.state = Game.CharacterState.Run
    Vec3.subtract(this._dir, this.dstPos, this.node.position)
    this._rotationSpeedTo = 0
    this._rotateSpeed = 0
    let rotation = quat()
    Quat.fromViewUp(rotation, this._dir)
    this.node.rotation = rotation
    this._dir.set(Vec3.ZERO)
  }



  protected set state(state: Game.CharacterState) {
    super.state = state
    if (this._state == Game.CharacterState.Idle) { this.dstPos.set(Vec3.ZERO) }
  }
}