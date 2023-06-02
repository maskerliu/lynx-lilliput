import { Camera, Component, MeshCollider, MeshRenderer, RigidBody, _decorator, renderer, v3 } from "cc"
import { Terrain } from "../common/Terrain"
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
    rigidBody.group = Terrain.PhyEnvGroup.Prop
    rigidBody.addMask(Terrain.PropMask)

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
