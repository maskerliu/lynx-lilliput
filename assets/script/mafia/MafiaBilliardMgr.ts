import { Camera, Component, Mesh, MeshCollider, MeshRenderer, RigidBody, _decorator, renderer, v3 } from "cc"
import MafiaPropMgr from "./MafiaPropMgr"
import { PhyEnvGroup } from "../common/Misc"
const { ccclass, property } = _decorator

@ccclass('MafiaBilliardMgr')
export default class MafiaBilliardMgr extends Component {

  private _camera: Camera
  set camera(camera: Camera) { this._camera = camera }

  private tableModel: renderer.scene.Model

  private tableMeshRenderer: MeshRenderer

  onLoad() {
    let rigidBody = this.node.addComponent(RigidBody)
    rigidBody.type = RigidBody.Type.STATIC
    rigidBody.group = PhyEnvGroup.Prop
    rigidBody.addMask(PhyEnvGroup.Player | PhyEnvGroup.Terrain)

    this.tableMeshRenderer = this.node.getComponent(MeshRenderer)
  }

  protected start(): void {
    this.tableModel = this.tableMeshRenderer.model
    let minPos = v3(), maxPos = v3()
    this.tableMeshRenderer.model.modelBounds.getBoundary(minPos, maxPos)


    let meshCollider = this.node.addComponent(MeshCollider)
    meshCollider.mesh = this.tableMeshRenderer.mesh

  }


}
