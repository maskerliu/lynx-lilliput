import { Component, tween, v3, Vec3, _decorator } from 'cc'

const { ccclass, property } = _decorator


@ccclass('BalloonMgr')
export default class BalloonMgr extends Component {

  private floatPos: Vec3 = v3()
  private float: boolean = false

  start() {
    // this.float()
  }

  update(deltaTime: number) {

    if (this.float) {
      if (this.node.position.y < 4) {
        this.floatPos.set(this.node.position)
        this.floatPos.y += 0.01
        this.node.position = this.floatPos
      } else {
        this.float = false
      }
    } else {
      if (this.node.position.y < 2.8) {
        this.float = true
      } else {
        this.floatPos.set(this.node.position)
        this.floatPos.y -= 0.01
        this.node.position = this.floatPos
      }
    }
  }

  float1() {
    let dstY = this.node.position.y + 0.01
    let originY = this.node.position.y - 0.01
    let pos = v3(this.node.position)
    tween(this.node).to(0.8, { position: pos }, {
      easing: 'smooth', onComplete: () => {
        pos.y = this.node.position.y == dstY ? originY : dstY
      }
    }).repeatForever().start()
  }
}