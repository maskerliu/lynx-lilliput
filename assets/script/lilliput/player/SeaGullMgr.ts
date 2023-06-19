import { Component, Quat, Vec3, _decorator, quat, v3 } from 'cc'

const { ccclass } = _decorator


@ccclass('SeaGullMgr')
export default class SeaGullMgr extends Component {

  private q_rotation = quat()
  private v3_dir = v3()
  private v3_pos = v3()
  private dstPos: Vec3 = v3(Math.random() * 5, Math.random() * 5 + 1, Math.random() * 5)
  private speed = 2

  protected update(dt: number): void {
    this.runTo(dt)
  }

  runTo(dt: number) {
    if (this.dstPos.equals(this.node.position, 0.2)) {
      this.dstPos.set(Math.random() * 5, Math.random() * 3 + 3, Math.random() * 5)
    }

    Vec3.subtract(this.v3_dir, this.dstPos, this.node.position)
    Quat.fromViewUp(this.q_rotation, this.v3_dir.normalize())
    this.node.rotation = this.node.rotation.slerp(this.q_rotation, 0.1)
    Vec3.multiplyScalar(this.v3_pos, this.node.forward.negative(), this.speed * dt)
    this.node.position = this.v3_pos.add(this.node.position)
  }
}