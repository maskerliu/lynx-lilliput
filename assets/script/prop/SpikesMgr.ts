import { Collider, Component, MeshCollider, Node, MeshRenderer, PhysicMaterial, RigidBody, tween, v3, Vec3, _decorator } from 'cc'
import IslandMgr from '../IslandMgr'
import { terrainItemIdx } from '../misc/Utils'
const { ccclass, property } = _decorator

import { Game, Terrain } from '../model'
import TerrainAssetMgr, { PhyEnvGroup } from '../TerrainAssetMgr'
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
  //   if (this.isTranslucent == did) return

  //   for (let i = 0; i < this.leverMeshRenderer.materials.length; ++i) {
  //     let name = this.leverMeshRenderer.materials[i].name.split('-translucent')[0]
  //     name = !this.isTranslucent && did ? `${name}-translucent` : name
  //     this.leverMeshRenderer.setMaterial(TerrainAssetMgr.getMaterial(name), i)
  //   }

  //   for (let i = 0; i < this.handleMeshRenderer.materials.length; ++i) {
  //     let name = this.handleMeshRenderer.materials[i].name.split('-translucent')[0]
  //     name = !this.isTranslucent && did ? `${name}-translucent` : name
  //     this.handleMeshRenderer.setMaterial(TerrainAssetMgr.getMaterial(name), i)
  //   }

  //   this.isTranslucent = did
  // }
}