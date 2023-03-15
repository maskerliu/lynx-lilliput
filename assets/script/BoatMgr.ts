import { Component, tween, v3, Vec3, _decorator } from 'cc'
const { ccclass, property } = _decorator

@ccclass('BoatMgr')
export default class BoatMgr extends Component {

  private floatPos: Vec3 = v3()

  start() {
    // this.float()
  }

  update(deltaTime: number) {

  }

  float() {
    let dstY = this.node.position.y + 0.05
    let originY = this.node.position.y - 0.05
    let pos = v3(this.node.position)
    tween(this.node).to(0.5, { position: pos }, {
      easing: 'smooth', onComplete: () => {
        pos.y = this.node.position.y == dstY ? originY : dstY
      }
    }).repeatForever().start()
  }
}