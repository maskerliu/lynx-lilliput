import { BoxCollider, ICollisionEvent, ITriggerEvent, RigidBody, SphereCollider, tween, v3, _decorator } from 'cc'
import { Game, Terrain } from '../model'
const { ccclass, property } = _decorator

import TerrainItemMgr, { PropEvent } from '../TerrainItemMgr'

const DicePreviewScale = v3(0.8, 0.8, 0.8)


@ccclass('DiceMgr')
export default class DiceMgr extends TerrainItemMgr {
  private static ShowInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, true, [Terrain.ModelInteraction.Push, Terrain.ModelInteraction.Shake])
  private static HideInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, false)

  onLoad() {
    super.onLoad()

    this.rigidBody = this.getComponent(RigidBody)

    this.getComponent(SphereCollider).on('onTriggerEnter', this.onTriggerEnter, this)
    this.getComponent(SphereCollider).on('onTriggerExit', this.onTriggerExit, this)
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
          this.rigidBody.applyImpulse(v3(0, 18, 0))
          this.rigidBody.applyTorque(v3(22, 30, 26))
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