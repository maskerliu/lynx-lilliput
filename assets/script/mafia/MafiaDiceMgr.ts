import { BoxCollider, MeshRenderer, RigidBody, _decorator, v3 } from "cc"
import { Terrain } from "../common/Terrain"
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
    this.rigidBody.group = Terrain.PhyEnvGroup.Prop
    this.rigidBody.setMask(Terrain.PropMask)

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