import { BoxCollider, MeshCollider, RigidBody, Vec3, _decorator, tween, v3 } from 'cc'
import { Terrain } from '../../common/Terrain'
import { Game } from '../../model'
import TerrainItemMgr from '../TerrainItemMgr'
import LilliputAssetMgr from '../LilliputAssetMgr'

const { ccclass, property } = _decorator

const DicePreviewScale = v3(0.8, 0.8, 0.8)


@ccclass('DiceMgr')
export default class DiceMgr extends TerrainItemMgr {
  private v3_speed = v3()
  private needSync = false

  update(dt: number) {
    this.rigidBody?.getLinearVelocity(this.v3_speed)
    if (this.v3_speed.equals(Vec3.ZERO, 0.01) && this.needSync) {
      this.rigidBody?.clearState()
      this.rigidBody?.sleep()
      this.needSync = false
    }
  }

  init(info: Game.MapItem): DiceMgr {
    super.init(info)

    this.rigidBody = this.node.addComponent(RigidBody)
    this.rigidBody.type = RigidBody.Type.DYNAMIC
    this.rigidBody.mass = 2
    this.rigidBody.useGravity = true
    this.rigidBody.group = Terrain.PhyEnvGroup.Prop
    this.rigidBody.setMask(Terrain.PhyEnvGroup.Terrain | Terrain.PhyEnvGroup.Prop | Terrain.PhyEnvGroup.Player)

    let meshCollider = this.node.addComponent(MeshCollider)
    meshCollider.convex = true
    meshCollider.mesh = this.meshRenderer.mesh
    meshCollider.material = LilliputAssetMgr.getPhyMtl('propDynamic')

    let collider = this.node.addComponent(BoxCollider)
    collider.isTrigger = true
    collider.size = v3(1.5, 1.5, 1.5)
    return this
  }

  interact(action: Game.CharacterState) {
    switch (action) {
      case Game.CharacterState.Kick:
        setTimeout(() => {
          this.rigidBody?.applyImpulse(v3(0, 14, 0))
          this.rigidBody?.applyTorque(v3(88, 70, 100))
          this.needSync = true
        }, 400)
        break
    }
  }

  preview() {
    tween(this.node).to(0.5, { scale: DicePreviewScale }, { easing: 'bounceOut' }).start()
  }

  translucent(did: boolean) {

  }
}

DiceMgr.ItemName = 'dice'