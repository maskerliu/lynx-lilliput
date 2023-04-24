import { Component, MeshRenderer, Widget, _decorator, v3, view } from "cc"
const { ccclass, property } = _decorator

@ccclass('MachineGunMgr')
export default class MachineGunMgr extends Component {
  

  onLoad() {
    this.node.getComponent(MeshRenderer)
  }

  
}