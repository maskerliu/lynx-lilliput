import { Component, _decorator, v3 } from "cc"
const { ccclass, property } = _decorator

@ccclass('DartsMgr')
export default class DartsMgr extends Component {
  
  


  onLoad() {
    

    let dart0 = this.node.getChildByName('dart0')

    console.log(dart0)

    dart0.position = v3(0, 0, 0)
  }

  
}