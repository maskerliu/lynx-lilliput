import { BoxCollider, Collider, Component, Mesh, MeshCollider, MeshRenderer, RigidBody, Widget, _decorator, renderer, v3, view } from "cc"
import { DynamicPropMtl, PhyEnvGroup } from "../common/Misc"
const { ccclass, property } = _decorator

@ccclass('MafiaPropMgr')
export default class MafiaPropMgr extends Component {

  private rigidBody: RigidBody
  private triggerCollider: BoxCollider
  private model: renderer.scene.Model

  onLoad() {
    this.node.getComponent(MeshRenderer).model.worldBounds
    this.model = this.node.getComponent(MeshRenderer).model

    this.node.addComponent(RigidBody)

    this.rigidBody = this.node.getComponent(RigidBody)
    this.rigidBody.type = RigidBody.Type.DYNAMIC
    this.rigidBody.group = PhyEnvGroup.Prop
    this.rigidBody.setMask(PhyEnvGroup.Prop | PhyEnvGroup.Player | PhyEnvGroup.Vehicle | PhyEnvGroup.Terrain)

    this.node.addComponent(BoxCollider)
    this.triggerCollider = this.node.getComponent(BoxCollider)
    this.triggerCollider.center = this.model.modelBounds.center
    console.log(this.model.modelBounds.center)
    this.triggerCollider.size = v3(1, 1, 1)
    this.triggerCollider.isTrigger = true

    this.node.addComponent(MeshRenderer)
    let collider = this.node.getComponent(MeshCollider)
    collider.material = DynamicPropMtl
  }

  protected start(): void {

  }


}