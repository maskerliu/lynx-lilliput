import { MeshRenderer, Node, quat, _decorator } from 'cc'
const { ccclass, property } = _decorator

import IslandAssetMgr from './IslandAssetMgr'
import { Game } from './model'
import TerrainItemMgr from './TerrainItemMgr'


@ccclass('SkinnedTerrainItemMgr')
export default class SkinnedTerrainItemMgr extends TerrainItemMgr {

  private handle: Node

  private leverMeshRenderer: MeshRenderer
  private handleMeshRenderer: MeshRenderer

  private q_roatation = quat()

  onLoad() {
    super.onLoad()
  }

  init(info:Game.MapItem) {
    super.init(info)

    this.updateSkin(this._info.skin)
  }

  updateSkin(skin?: string) {
    if (skin == null) return
    for (let i = 0; i < this.config.material.length; ++i) {
      let mtlName = this.config.material[i]
      if (mtlName == 'grass') {
        this.meshRenderer.setMaterial(IslandAssetMgr.getMaterial(skin), i)
        break
      }
    }
    this._info.skin = skin
  }

}