import { MeshRenderer, Node, Prefab, Quat, _decorator, math } from 'cc'
import CommonPropMgr from './CommonPropMgr'


const { ccclass, property } = _decorator

@ccclass('LeverMgr')
export default class LeverMgr extends CommonPropMgr {

  private handle: Node

  private leverMeshRenderer: MeshRenderer
  private handleMeshRenderer: MeshRenderer

  protected addSubModel(prefab: Prefab): void {
    super.addSubModel(prefab)
    this.handle = this.node.getChildByName('handle')
    this.handleMeshRenderer = this.handle.getComponent(MeshRenderer)
    this.leverMeshRenderer = this.node.getChildByName('lever').getComponent(MeshRenderer)

    CommonPropMgr.q_rotation.set(this.handle.rotation)

    let angle = 90
    Quat.rotateX(CommonPropMgr.q_rotation, CommonPropMgr.q_rotation, math.toRadian(angle))
  }
}

LeverMgr.ItemName = 'lever'