import { BoxCollider, ITriggerEvent, MeshRenderer, RigidBody, _decorator, v3 } from 'cc'
import { Game, Terrain } from '../../model'
import TerrainItemMgr, { PropEvent } from '../TerrainItemMgr'
import { DynamicPropMtl } from '../../common/Misc'

const { ccclass, property } = _decorator

@ccclass('CrateMgr')
export default class CrateMgr extends TerrainItemMgr {

  protected static ShowInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, true, [Terrain.ModelInteraction.Lift, Terrain.ModelInteraction.Push])
  protected static HideInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, false)


  onLoad() {
    super.onLoad()

    this.rigidBody = this.getComponent(RigidBody)

    this.node.addComponent(BoxCollider)
    let collider = this.node.getComponent(BoxCollider)

    let minPos = v3(), maxPos = v3()
    this.node.getComponent(MeshRenderer).model.modelBounds.getBoundary(minPos, maxPos)
    collider.size = maxPos.subtract(minPos)
    collider.material = DynamicPropMtl

    this.getComponent(BoxCollider)?.on('onTriggerEnter', this.onTriggerEnter, this)
    this.getComponent(BoxCollider)?.on('onTriggerExit', this.onTriggerExit, this)
  }


  private onTriggerEnter(event: ITriggerEvent) {
    if (event.otherCollider.node.name == 'myself') {
      CrateMgr.ShowInteractEvent.propIndex = this.index
      this.node.dispatchEvent(CrateMgr.ShowInteractEvent)
    }
  }

  private onTriggerExit(event: ITriggerEvent) {
    if (event.otherCollider.node.name == 'myself') {
      this.node.dispatchEvent(CrateMgr.HideInteractEvent)
    }
  }

  preview() {

  }

  interact(action: Game.CharacterState) {
    switch (action) {
      case Game.CharacterState.Lift:

        break
    }
  }

  // translucent(did: boolean) {
  // }
}

CrateMgr.ItemName = 'crate'