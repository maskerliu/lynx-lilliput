import { Component, math, Node, Size, tween, v2, v3, Vec2, Vec3, view, _decorator } from 'cc'
const { ccclass, property } = _decorator


export interface RockerTarget {
  onDirectionChanged(dir: Vec2): void
}

@ccclass('RockerMgr')
export default class RockerMgr extends Component {

  @property(Node)
  rockerDianNode: Node
  @property(Node)
  rockerDirNode: Node

  target: RockerTarget

  private winSize: Size = new Size()
  private rockerDianPos: Vec2 = v2()
  private lastPos: Vec2 = v2()
  private moveDir: Vec2 = v2()

  private _isTouchStart: boolean = false
  private _vec201 = v2(0, 1)
  private _lastang = 100
  private _tmpVec2: Vec2 = v2()
  private _tmpVec3: Vec3 = v3()

  private curMove = v2(0, 0)
  private tarMove = v2(0, 0)

  private scale = v3(1.1, 1.1, 1.1)
  private dstPos: Vec3

  onLoad() {
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this)
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this)
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)
    this.dstPos = v3(this.node.position)
  }

  start() {
    this.winSize = view.getVisibleSize()
    this.rockerDianPos = v2(this.rockerDianNode.position.x, this.rockerDianNode.position.y)
  }

  update(dt: number) {
    this.updateMove()
  }

  show(show: boolean) {
    this.dstPos.x = show ? 120 : -120
    tween(this.node).to(0.8, { position: this.dstPos }, { easing: 'elasticOut' }).start()
  }

  private onTouchStart(ev: any) {
    let p = ev.getUILocation()
    p.x -= this.winSize.width / 2
    p.y -= this.winSize.height / 2
    this.lastPos = p

    this.target?.onDirectionChanged(Vec2.ZERO)

    tween(this.node).to(0.1, { scale: this.scale }).start()

    this._isTouchStart = true
    this._lastang = -this._lastang

    ev.propagationStopped = true
  }

  private onTouchMove(ev: any) {
    if (!this._isTouchStart) {
      return
    }

    this.tarMove = ev.getUILocation()
    ev.propagationStopped = true
  }

  private onTouchEnd(ev: any) {
    this.rockerDianNode.position = v3(this.rockerDianPos.x, this.rockerDianPos.y, 0)
    this.rockerDirNode.active = false

    this.target?.onDirectionChanged(Vec2.ZERO)
    tween(this.node).to(0.1, { scale: Vec3.ONE }).start()
    this._isTouchStart = false
    ev.propagationStopped = true
  }

  private updateMove() {
    if (!this._isTouchStart || this.curMove.equals(this.tarMove)) return

    this.curMove = this.tarMove
    this.curMove.x -= this.winSize.width / 2
    this.curMove.y -= this.winSize.height / 2

    Vec2.subtract(this._tmpVec2, this.curMove, this.lastPos)
    this._tmpVec2.normalize()
    this.moveDir.x = -this._tmpVec2.x
    this.moveDir.y = this._tmpVec2.y

    let len = Vec2.distance(this.curMove, this.lastPos)
    len = len > 60 ? 60 : len
    this._tmpVec2.multiplyScalar(len).add(this.rockerDianPos)
    this._tmpVec3.set(this._tmpVec2.x, this._tmpVec2.y, 0)
    this.rockerDianNode.position = this._tmpVec3


    if (this._tmpVec2.equals(Vec2.ZERO)) return

    this.rockerDirNode.angle = -math.toDegree(this._tmpVec2.signAngle(this._vec201))
    if (len > 20) {
      this.rockerDirNode.active = true
      this.target?.onDirectionChanged(this.moveDir)
    } else {
      this.rockerDirNode.active = false
    }
  }
}