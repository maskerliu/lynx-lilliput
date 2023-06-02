import { BoxCollider, MeshCollider, MeshRenderer, Node, RigidBody, _decorator, v3 } from 'cc'
import { Terrain } from '../../common/Terrain'
import { Game } from '../../model'
import TerrainItemMgr from '../TerrainItemMgr'
import { Lilliput } from '../LilliputEvents'
import LilliputAssetMgr from '../LilliputAssetMgr'

const { ccclass, property } = _decorator


@ccclass('LadderMgr')
export default class LadderMgr extends TerrainItemMgr {
  private point: Node

  onLoad() {
    // super.onLoad()

    this.point = this.node.getChildByName('Sphere')
  }

  init(info: Game.MapItem) {
    super.init(info)

    this.meshRenderer = this.node.getChildByName(this.info.prefab).getComponent(MeshRenderer)

    this.rigidBody = this.node.addComponent(RigidBody)
    this.rigidBody.type = RigidBody.Type.STATIC
    this.rigidBody.group = Terrain.PhyEnvGroup.Prop
    this.rigidBody.setMask(Terrain.PhyEnvGroup.Prop |
      Terrain.PhyEnvGroup.Player |
      Terrain.PhyEnvGroup.Vehicle |
      Terrain.PhyEnvGroup.Terrain)

    let meshCollider = this.node.addComponent(MeshCollider)
    meshCollider.mesh = this.meshRenderer.mesh
    meshCollider.material = LilliputAssetMgr.getPhyMtl('propStatic')

    let minPos = v3(), maxPos = v3()
    this.meshRenderer.model.modelBounds.getBoundary(minPos, maxPos)
    maxPos.subtract(minPos)

    let collider = this.node.addComponent(BoxCollider)
    collider.center = v3(0, this.boundary.y / 2, (this.boundary.z - 0.5) / 2)
    collider.size = v3(this.boundary.x + 0.2, this.boundary.y, 0.5 - this.boundary.z)
    collider.isTrigger = true

    return this
  }

  get ladderPos() {
    let pos = v3(this.node.position)
    let radius = this.info.angle * Math.PI / 180
    pos.x += -Math.sin(radius) * 0.3
    pos.z += -Math.cos(radius) * 0.3
    return pos
  }
}

LadderMgr.ItemName = 'ladder'