import { BoxCollider, ITriggerEvent, _decorator, physics, v3, tween } from 'cc'
import { Game, Terrain } from '../model'
const { ccclass, property } = _decorator

import TerrainItemMgr, { PropEvent } from '../TerrainItemMgr'

@ccclass('MushroomMgr')
export default class MushroomMgr extends TerrainItemMgr {

  private static ShowInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, true, [Terrain.ModelInteraction.Grab])
  private static HideInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, false)


  onLoad() {
    super.onLoad()
    this.getComponent(BoxCollider).on('onTriggerEnter', this.onTriggerEnter, this)
    this.getComponent(BoxCollider).on('onTriggerExit', this.onTriggerExit, this)
  }

  preview() {

  }

  private onTriggerEnter(event: ITriggerEvent) {
    if (event.otherCollider.node.name == 'myself') {
      MushroomMgr.ShowInteractEvent.propIndex = this.index
      this.node.dispatchEvent(MushroomMgr.ShowInteractEvent)
    }
  }

  private onTriggerExit(event: ITriggerEvent) {
    if (event.otherCollider.node.name == 'myself') {
      this.node.dispatchEvent(MushroomMgr.HideInteractEvent)
    }
  }

  interact(action: Game.CharacterState) {
    switch (action) {
      case Game.CharacterState.Grab:
        tween(this.node).to(0.5, { scale: v3(0.5, 0.5, 0.5) }, { easing: 'backInOut' }).start()
        break
    }
  }

  // translucent(did: boolean) {
  // }
}

MushroomMgr.ItemName = 'mushrooms'