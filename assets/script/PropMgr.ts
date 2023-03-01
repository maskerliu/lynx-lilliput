import { Component, MeshRenderer, Vec3, _decorator } from 'cc'
const { ccclass, property } = _decorator

@ccclass('PropMgr')
export default class PropMgr extends Component {

  private meshRenderer: MeshRenderer

  onLoad() {
    this.meshRenderer = this.getComponentInChildren(MeshRenderer)
  }
}