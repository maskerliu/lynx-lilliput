import { BoxCollider, ITriggerEvent, RigidBody, _decorator } from 'cc'
import { Game, Terrain } from '../model'
const { ccclass, property } = _decorator

import TerrainItemMgr, { PropEvent } from '../TerrainItemMgr'

@ccclass('CrateMgr')
export default class CrateMgr extends TerrainItemMgr {

  private static ShowInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, true, [Terrain.ModelInteraction.Lift, Terrain.ModelInteraction.Push])
  private static HideInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, false)


  onLoad() {
    super.onLoad()

    this.rigidBody = this.getComponent(RigidBody)

    this.getComponent(BoxCollider).on('onTriggerEnter', this.onTriggerEnter, this)
    this.getComponent(BoxCollider).on('onTriggerExit', this.onTriggerExit, this)
  }


  private onTriggerEnter(event: ITriggerEvent) {

    if (event.otherCollider.node.name == 'player') {
      // emit can climb event
      CrateMgr.ShowInteractEvent.propIndex = this.index
      this.node.dispatchEvent(CrateMgr.ShowInteractEvent)

    }
  }

  private onTriggerExit(event: ITriggerEvent) {
    if (event.otherCollider.node.name == 'player') {
      // emit can climb event
      this.node.dispatchEvent(CrateMgr.HideInteractEvent)
    }
  }

  preview() {

  }

  interact(action: Game.CharacterState) {

  }

  // translucent(did: boolean) {
  // }
}

CrateMgr.ItemName = 'crate'