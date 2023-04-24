import { Component, _decorator, v3 } from "cc"
const { ccclass, property } = _decorator

@ccclass('BilliardMgr')
export default class BilliardMgr extends Component {
  

  onLoad() {
   

    this.node.getChildByName('ball').position = v3(0, 10, 0)
  }

  
}