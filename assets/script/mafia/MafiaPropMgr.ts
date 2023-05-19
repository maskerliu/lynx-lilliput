import { BoxCollider, Collider, Component, Mesh, MeshCollider, MeshRenderer, RigidBody, Widget, _decorator, color, renderer, v3, view } from "cc"
import { DynamicPropPhyMtl, PhyEnvGroup } from "../common/Misc"
const { ccclass, property } = _decorator

@ccclass('MafiaPropMgr')
export default class MafiaPropMgr extends Component {

  static PropName: string

  protected rigidBody: RigidBody
  protected triggerCollider: BoxCollider
  protected model: renderer.scene.Model

  onLoad() {

  }

  init(type: RigidBody.Type, group: PhyEnvGroup) {
    this.model = this.node.getComponent(MeshRenderer).model

    this.node.addComponent(RigidBody)

    this.rigidBody = this.node.getComponent(RigidBody)
    this.rigidBody.type = type
    this.rigidBody.group = group
    this.rigidBody.setMask(PhyEnvGroup.Prop | PhyEnvGroup.Player | PhyEnvGroup.Vehicle | PhyEnvGroup.Terrain)

    this.node.addComponent(BoxCollider)
    this.triggerCollider = this.node.getComponent(BoxCollider)
    this.triggerCollider.center = this.model.modelBounds.center
    // console.log(this.model.modelBounds.center)
    this.triggerCollider.size = v3(1, 1, 1)
    this.triggerCollider.isTrigger = true

    this.node.addComponent(MeshCollider)
    let collider = this.node.getComponent(MeshCollider)
    collider.mesh = this.node.getComponent(MeshRenderer).mesh
    collider.material = DynamicPropPhyMtl
  }
}