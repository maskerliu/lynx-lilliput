import { BoxCollider, Component, Mesh, MeshRenderer, RigidBody, Widget, _decorator, renderer, v3, view } from "cc"
import { PhyEnvGroup } from "../common/Misc"
import MafiaPropMgr from "./MafiaPropMgr"
const { ccclass, property } = _decorator

@ccclass('MafiaDiceMgr')
export default class MafiaDiceMgr extends MafiaPropMgr {

  onLoad() {
    this.node.getComponent(MeshRenderer).model.worldBounds
    this.model = this.node.getComponent(MeshRenderer).model

    this.node.addComponent(RigidBody)

    this.rigidBody = this.node.getComponent(RigidBody)
    this.rigidBody.type = RigidBody.Type.DYNAMIC
    this.rigidBody.group = PhyEnvGroup.Prop
    this.rigidBody.setMask(PhyEnvGroup.Prop | PhyEnvGroup.Player | PhyEnvGroup.Vehicle | PhyEnvGroup.Terrain)

    this.node.addComponent(BoxCollider)
    let collider = this.node.getComponent(BoxCollider)
    collider.center = this.model.modelBounds.center
    console.log(this.model.modelBounds.center)
    collider.size = v3(1, 1, 1)
  }

  protected start(): void {

  }


}

MafiaDiceMgr.PropName = 'dice'