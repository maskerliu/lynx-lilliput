import { BoxCollider, ITriggerEvent, MeshCollider, MeshRenderer, RigidBody, Vec3, _decorator, tween, v3 } from 'cc'
import { DynamicPropPhyMtl, PhyEnvGroup } from '../../common/Misc'
import { Game, Terrain } from '../../model'
import TerrainItemMgr, { PropEvent } from '../TerrainItemMgr'

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
    
  }

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

    this.meshRenderer = this.node.getComponent(MeshRenderer)

    this.rigidBody = this.node.addComponent(RigidBody)
    this.rigidBody.type = RigidBody.Type.DYNAMIC
    this.rigidBody.mass = 2
    this.rigidBody.useGravity = true
    this.rigidBody.group = PhyEnvGroup.Prop
    this.rigidBody.setMask(PhyEnvGroup.Terrain | PhyEnvGroup.Prop | PhyEnvGroup.Player)

    let meshCollider = this.node.addComponent(MeshCollider)
    meshCollider.convex = true
    meshCollider.mesh = this.meshRenderer.mesh
    meshCollider.material = DynamicPropPhyMtl

    let collider = this.node.addComponent(BoxCollider)
    collider.isTrigger = true
    collider.size = v3(1.5, 1.5, 1.5)

    collider.on('onTriggerEnter', this.onTriggerEnter, this)
    collider.on('onTriggerExit', this.onTriggerExit, this)

    return this
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