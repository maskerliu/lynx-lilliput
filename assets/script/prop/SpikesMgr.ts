import { MeshRenderer, Node, tween, v3, _decorator } from 'cc'
const { ccclass, property } = _decorator

import TerrainItemMgr from '../TerrainItemMgr'

@ccclass('SpikesMgr')
export default class SpikesMgr extends TerrainItemMgr {

  private spikes: Node
  private spikesMeshRenderer: MeshRenderer
  private dstPos = v3()

  onLoad() {
    super.onLoad()
    this.spikes = this.node.getChildByName('spikes')

    this.dstPos.set(this.spikes.position)
    this.dstPos.y = this.dstPos.y == 0.075 ? -0.16 : 0.075

    tween(this.spikes).to(0.5, { position: this.dstPos }, {
      easing: 'linear', onComplete: () => {
        this.dstPos.y = this.dstPos.y == 0.075 ? -0.16 : 0.075
      }
    }).repeatForever().start()
  }

  // translucent(did: boolean) {
  // }
}

SpikesMgr.ItemName = 'spikes'