import { BoxCollider, ITriggerEvent, MeshCollider, RigidBody, Vec3, _decorator, tween, v3 } from 'cc'
import { Game, Terrain } from '../../model'
import TerrainItemMgr, { PropEvent } from '../TerrainItemMgr'
import { DynamicPropMtl } from '../../common/Misc'

const { ccclass, property } = _decorator

const DicePreviewScale = v3(0.8, 0.8, 0.8)


@ccclass('DiceMgr')
export default class DiceMgr extends TerrainItemMgr {
  private static ShowInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, true, [Terrain.ModelInteraction.Push, Terrain.ModelInteraction.Shake])
  private static HideInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, false)

  private v3_speed = v3()
  private needSync = false

  onLoad() {
    super.onLoad()

    this.rigidBody = this.getComponent(RigidBody)

    this.node.addComponent(MeshCollider)
    let meshCollider = this.node.getComponent(MeshCollider)
    meshCollider.convex = true
    meshCollider.material = DynamicPropMtl

    this.node.addComponent(BoxCollider)
    let collider = this.node.getComponent(BoxCollider)
    collider.isTrigger = true
    collider.size = v3(1.5, 1.5, 1.5)

    this.getComponent(BoxCollider)?.on('onTriggerEnter', this.onTriggerEnter, this)
    this.getComponent(BoxCollider)?.on('onTriggerExit', this.onTriggerExit, this)
  }

  update(dt: number) {
    this.rigidBody?.getLinearVelocity(this.v3_speed)
    if (this.v3_speed.equals(Vec3.ZERO, 0.01) && this.needSync) {
      this.rigidBody?.clearState()
      this.rigidBody?.sleep()
      this.needSync = false
    }
  }

  private onTriggerEnter(event: ITriggerEvent) {
    if (event.otherCollider.node.name == 'myself') {
      DiceMgr.ShowInteractEvent.propIndex = this.index
      this.node.dispatchEvent(DiceMgr.ShowInteractEvent)

    }
  }

  private onTriggerExit(event: ITriggerEvent) {
    if (event.otherCollider.node.name == 'myself') {
      this.node.dispatchEvent(DiceMgr.HideInteractEvent)
    }
  }

  interact(action: Game.CharacterState) {
    switch (action) {
      case Game.CharacterState.Kick:
        setTimeout(() => {
          this.rigidBody?.applyImpulse(v3(0, 14, 0))
          this.rigidBody?.applyTorque(v3(44, 40, 53))
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