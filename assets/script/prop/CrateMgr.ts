import { BoxCollider, ITriggerEvent, RigidBody, SphereCollider, _decorator } from 'cc'
import { Game, Terrain } from '../model'
const { ccclass, property } = _decorator

import TerrainItemMgr, { PropEvent } from '../TerrainItemMgr'

@ccclass('CrateMgr')
export default class CrateMgr extends TerrainItemMgr {

  protected static ShowInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, true, [Terrain.ModelInteraction.Lift, Terrain.ModelInteraction.Push])
  protected static HideInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, false)


  onLoad() {
    super.onLoad()

    this.rigidBody = this.getComponent(RigidBody)

    this.getComponent(SphereCollider).on('onTriggerEnter', this.onTriggerEnter, this)
    this.getComponent(SphereCollider).on('onTriggerExit', this.onTriggerExit, this)
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
    switch(action) {
      case Game.CharacterState.Lift:
        
        break
    }
  }

  // translucent(did: boolean) {
  // }
}

CrateMgr.ItemName = 'crate'