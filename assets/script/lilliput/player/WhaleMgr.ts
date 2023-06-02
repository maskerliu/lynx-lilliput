import { Component, quat, Quat, Vec3, _decorator } from 'cc'
const { ccclass, property } = _decorator

@ccclass('WhaleMgr')
export default class WhaleMgr extends Component {

  private q_dir = quat()

  private angle = 0

  onLoad() {
    Quat.fromAxisAngle(this.q_dir, Vec3.UNIT_Y, Math.PI)
    // this.node.rotation = this.q_dir
  }

  update(dt: number) {

    if (this.angle == 360) {
      this.angle = 0
    } else {
      this.angle += 0.2
    }

    this.node.rotation = Quat.fromAxisAngle(this.node.rotation, Vec3.UNIT_Y, Math.PI * this.angle / 180)
    this.node.position = this.node.position.add(this.node.forward.negative().multiplyScalar(dt))
  }


}