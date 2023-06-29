import { Component, EventTouch, Node, Size, Tween, Vec2, Vec3, _decorator, math, tween, v2, v3, view } from 'cc'

const { ccclass, property } = _decorator


export interface RockerTarget {
  onDirectionChanged(dir: Vec2): void
}

@ccclass('RockerMgr')
export default class RockerMgr extends Component {

  @property(Node)
  rockerDian: Node
  @property(Node)
  rockerDir: Node

  target: RockerTarget

  private lstPos: Vec2 = v2()
  private moveDir: Vec2 = v2()

  private _isTouchStart: boolean = false

  private v2_dir = v2()
  private v3_pos = v3()
  private tarMove = v2(0, 0)

  private scale = v3(1.1, 1.1, 1.1)
  private dstPos: Vec3 = v3()

  private tweenScale: Tween<Node>

  onLoad() {
    this.rockerDir.active = false

    this.rockerDian.on(Node.EventType.TOUCH_START, this.onTouchStart, this)
    this.rockerDian.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
    this.rockerDian.on(Node.EventType.TOUCH_END, this.onTouchEnd, this)
    this.rockerDian.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)
    this.dstPos.set(this.node.position)

    this.tweenScale = tween(this.node)
  }

  update(dt: number) {
    this.updateMove()
  }

  show(show: boolean) {
    this.dstPos.x = show ? 140 : -140
    tween(this.node).to(0.5, { position: this.dstPos }, { easing: 'elasticOut' }).start()
  }

  private onTouchStart(ev: EventTouch) {
    this.lstPos.set(ev.getUILocation())
    this.tarMove.set(Vec2.ZERO)
    this.target?.onDirectionChanged(Vec2.ZERO)

    // this.tweenScale.stop()
    // this.tweenScale.to(0.1, { scale: this.scale }).start()

    this._isTouchStart = true
    ev.propagationStopped = true
  }

  private onTouchMove(ev: EventTouch) {
    if (!this._isTouchStart) return
    this.tarMove.set(ev.getUILocation())
    ev.propagationStopped = true
  }

  private onTouchEnd(ev: EventTouch) {
    this.tweenScale.stop()
    this.rockerDian.position = Vec3.ZERO
    this.rockerDir.active = false

    this.target?.onDirectionChanged(Vec2.ZERO)
    // this.tweenScale.to(0.1, { scale: Vec3.ONE }).start()
    this._isTouchStart = false
    ev.propagationStopped = true
  }

  private updateMove() {
    if (!this._isTouchStart || Vec2.ZERO.equals(this.tarMove)) return

    Vec2.subtract(this.v2_dir, this.tarMove, this.lstPos)
    if (Vec2.ZERO.equals(this.v2_dir)) return

    this.v2_dir.normalize()
    this.moveDir.set(-this.v2_dir.x, this.v2_dir.y)

    let len = Vec2.distance(this.tarMove, this.lstPos)
    len = len > 60 ? 60 : len
    this.v2_dir.multiplyScalar(len)
    this.v3_pos.set(this.v2_dir.x, this.v2_dir.y, 0)
    this.rockerDian.position = this.v3_pos
    this.rockerDir.angle = -math.toDegree(this.v2_dir.signAngle(Vec2.UNIT_Y))

    if (len > 20) {
      this.rockerDir.active = true
      this.target?.onDirectionChanged(this.moveDir)
    } else {
      this.rockerDir.active = false
    }
  }
}