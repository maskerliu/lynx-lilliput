import { BoxCollider, ICollisionEvent, ITriggerEvent, MeshCollider, MeshRenderer, Node, RigidBody, _decorator, v3 } from 'cc'
import { Game, Terrain } from '../../model'
import TerrainItemMgr, { PropEvent } from '../TerrainItemMgr'
import { PhyEnvGroup, StaticPropPhyMtl } from '../../common/Misc'

const { ccclass, property } = _decorator


@ccclass('LadderMgr')
export default class LadderMgr extends TerrainItemMgr {
  private static ShowInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, true, [Terrain.ModelInteraction.Climb])
  private static HideInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, false)

  private static v3_rotation = v3()
  private point: Node

  onLoad() {
    // super.onLoad()

    this.point = this.node.getChildByName('Sphere')
  }

  init(info: Game.MapItem) {
    super.init(info)

    this.meshRenderer = this.node.getComponent(MeshRenderer)

    this.node.addComponent(RigidBody)
    this.rigidBody = this.node.getComponent(RigidBody)
    this.rigidBody.type = RigidBody.Type.STATIC
    this.rigidBody.group = PhyEnvGroup.Prop
    this.rigidBody.setMask(PhyEnvGroup.Prop | PhyEnvGroup.Player | PhyEnvGroup.Vehicle | PhyEnvGroup.Terrain)

    this.node.addComponent(MeshCollider)

    let meshCollider = this.node.getComponent(MeshCollider)
    meshCollider.mesh = this.node.getComponent(MeshRenderer).mesh
    meshCollider.material = StaticPropPhyMtl

    let minPos = v3(), maxPos = v3()
    this.node.getComponent(MeshRenderer).model.modelBounds.getBoundary(minPos, maxPos)
    maxPos.subtract(minPos)

    this.node.addComponent(BoxCollider)
    let collider = this.node.getComponent(BoxCollider)
    collider.center = v3(0, maxPos.y / 2, (maxPos.z - 0.5) / 2)
    collider.size = v3(maxPos.x + 0.2, maxPos.y, 0.5 - maxPos.z)
    collider.isTrigger = true

    collider.on('onTriggerEnter', this.onTriggerEnter, this)
    collider.on('onTriggerExit', this.onTriggerExit, this)

    return this
  }

  get ladderPos() {
    let pos = v3(this.node.position)
    let radius = this.info.angle * Math.PI / 180
    pos.x += -Math.sin(radius) * 0.3
    pos.z += -Math.cos(radius) * 0.3
    return pos
  }


  private onTriggerEnter(event: ITriggerEvent) {
    if (event.otherCollider.node.name == 'myself') {
      this.node.dispatchEvent(LadderMgr.ShowInteractEvent)
    }
  }

  private onTriggerExit(event: ICollisionEvent) {
    if (event.otherCollider.node.name == 'myself') {
      this.node.dispatchEvent(LadderMgr.HideInteractEvent)
    }
  }
}

LadderMgr.ItemName = 'ladder'