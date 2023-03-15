import { BoxCollider, ICollisionEvent, Node, ITriggerEvent, v3, _decorator, UITransform, Quat } from 'cc'
import { Terrain } from '../model'
const { ccclass, property } = _decorator

import TerrainItemMgr, { PropEvent } from '../TerrainItemMgr'


@ccclass('LadderMgr')
export default class LadderMgr extends TerrainItemMgr {
  private static ShowInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, true, [Terrain.ModelInteraction.Climb])
  private static HideInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, false)

  private static v3_rotation = v3()
  private point: Node
  onLoad() {
    super.onLoad()
    this.getComponent(BoxCollider).on('onTriggerEnter', this.onTriggerEnter, this)
    this.getComponent(BoxCollider).on('onTriggerExit', this.onTriggerExit, this)
    this.point = this.node.getChildByName('Sphere')

  }

  get ladderPos() {
    let pos = v3(this.node.position)
    let radius = this.info.angle * Math.PI / 180
    pos.x += -Math.sin(radius) * 0.45
    pos.z += -Math.cos(radius) * 0.45

    // this.point.position = pos
    return pos
  }


  private onTriggerEnter(event: ITriggerEvent) {
    if (event.otherCollider.node.name == 'player') {
      this.node.dispatchEvent(LadderMgr.ShowInteractEvent)
    }
  }

  private onTriggerExit(event: ICollisionEvent) {
    if (event.otherCollider.node.name == 'player') {
      this.node.dispatchEvent(LadderMgr.HideInteractEvent)
    }
  }
}

LadderMgr.ItemName = 'ladder'