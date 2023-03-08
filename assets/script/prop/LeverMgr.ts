import { Collider, Component, Mesh, MeshCollider, MeshRenderer, Node, PhysicMaterial, Quat, quat, RigidBody, tween, v3, Vec3, _decorator } from 'cc'
import IslandMgr from '../IslandMgr'
import { terrainItemIdx } from '../misc/Utils'
const { ccclass, property } = _decorator

import { Game, Terrain } from '../model'
import TerrainAssetMgr, { PhyEnvGroup } from '../TerrainAssetMgr'
import TerrainItemMgr from '../TerrainItemMgr'


@ccclass('LeverMgr')
export default class LeverMgr extends TerrainItemMgr {

  private handle: Node

  private leverMeshRenderer: MeshRenderer
  private handleMeshRenderer: MeshRenderer

  private q_roatation = quat()

  onLoad() {

    this.handle = this.node.getChildByName('handle')

    this.leverMeshRenderer = this.node.getChildByName('lever').getComponent(MeshRenderer)
    this.handleMeshRenderer = this.handle.getComponent(MeshRenderer)

    this.q_roatation.set(this.handle.rotation)

    let angle = 90
    Quat.rotateX(this.q_roatation, this.q_roatation, Math.PI / 180 * angle)

    tween(this.handle).to(0.5, { rotation: this.q_roatation }, {
      easing: 'linear', onComplete: () => {
        angle = -angle
        Quat.rotateX(this.q_roatation, this.q_roatation, Math.PI / 180 * angle)
      }
    }).repeatForever().start()

  }

  translucent(did: boolean) {
    if (this.isTranslucent == did) return

    for (let i = 0; i < this.leverMeshRenderer.materials.length; ++i) {
      let name = this.leverMeshRenderer.materials[i].parent.name.split('-translucent')[0]
      name = !this.isTranslucent && did ? `${name}-translucent` : name
      this.leverMeshRenderer.setMaterial(TerrainAssetMgr.getMaterial(name), i)
    }

    for (let i = 0; i < this.handleMeshRenderer.materials.length; ++i) {
      let name = this.handleMeshRenderer.materials[i].parent.name.split('-translucent')[0]
      name = !this.isTranslucent && did ? `${name}-translucent` : name
      this.handleMeshRenderer.setMaterial(TerrainAssetMgr.getMaterial(name), i)
    }

    this.isTranslucent = did
  }
}