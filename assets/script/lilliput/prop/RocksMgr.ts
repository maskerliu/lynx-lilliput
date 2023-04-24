import { BoxCollider, ITriggerEvent, RigidBody, _decorator } from 'cc'
import { Terrain } from '../../model'
import TerrainItemMgr, { PropEvent } from '../TerrainItemMgr'

const { ccclass, property } = _decorator

@ccclass('RocksMgr')
export default class RocksMgr extends TerrainItemMgr {

  private static ShowInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, true, [Terrain.ModelInteraction.Attack, Terrain.ModelInteraction.Sit])
  private static HideInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, false)


  onLoad() {
    super.onLoad()

    this.rigidBody = this.getComponent(RigidBody)

    this.getComponent(BoxCollider)?.on('onTriggerEnter', this.onTriggerEnter, this)
    this.getComponent(BoxCollider)?.on('onTriggerExit', this.onTriggerExit, this)
  }


  private onTriggerEnter(event: ITriggerEvent) {

    if (event.otherCollider.node.name == 'player') {
      // emit can climb event
      RocksMgr.ShowInteractEvent.propIndex = this.index
      this.node.dispatchEvent(RocksMgr.ShowInteractEvent)

    }
  }

  private onTriggerExit(event: ITriggerEvent) {
    if (event.otherCollider.node.name == 'player') {
      // emit can climb event
      this.node.dispatchEvent(RocksMgr.HideInteractEvent)
    }
  }

  preview() {

  }

  // translucent(did: boolean) {
  // }
}

RocksMgr.ItemName = 'rocks'