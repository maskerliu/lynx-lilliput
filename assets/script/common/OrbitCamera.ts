import { Component, EventMouse, EventTouch, Node, Quat, Vec2, Vec3, _decorator, director, lerp, quat, v2, v3 } from 'cc'
const { ccclass, property, type } = _decorator

const DeltaFactor = 1 / 200

@ccclass('OrbitCamera')
export default class OrbitCamera extends Component {
  @property
  enableTouch = true
  @property
  enableScaleRadius = true
  @property
  rotateSpeed = 1
  @property
  followSpeed = 1
  @property
  xRotationRange = v2(5, 70)
  @property
  yRotationRange = v2(-180, 180)

  @property
  radiusRange = v2(5, 10)
  private _targetRadius = 15

  @property
  get radius() { return this._targetRadius }
  set radius(r) { this._targetRadius = r }

  @property
  radiusScaleSpeed = 1

  @property
  followTargetRotationY = true

  private _v3Pos = v3()
  private _q_tmp = quat()

  private _center = v3()
  private _targetCenter = v3()
  private _targetDir = v3()
  private _startDir = v3()
  private _targetRotation = quat()
  private _needUpdate = false

  private _rotation = quat()
  private _radius = 10
  private _lastTouchDis = 0
  private _moveDis = 0

  private _reactArea: Node = null
  private _target: Node = null

  get target() { return this._target }

  set target(node: Node) {
    this._target = node
    this._targetCenter.set(node!.worldPosition)
  }

  start() {
    this._targetDir.set(45, -145, 0)
    this._startDir.set(this._targetDir)
    this._radius = this.radius
    this.limitRotation()
  }

  update(dt: number) {
    if (this.target == null) return

    this._targetCenter.set(this.target.worldPosition)

    this._needUpdate = false

    Quat.fromEuler(this._targetRotation, this._targetDir.x, this._targetDir.y, this._targetDir.z)

    if (!this._rotation.equals(this._targetRotation, 0.01)) {
      Quat.slerp(this._rotation, this._rotation, this._targetRotation, dt * 7 * this.rotateSpeed)
      this._needUpdate = true
    }

    if (!this._center.equals(this._targetCenter, 0.01)) {
      Vec3.lerp(this._center, this._center, this._targetCenter, dt * 5 * this.followSpeed)
      this._needUpdate = true
    }

    if (Math.abs(this._radius - this._targetRadius) > 0.01) {
      this._radius = lerp(this._radius, this._targetRadius, dt * 15)
      this._needUpdate = true
    }

    if (this._needUpdate) {
      Vec3.transformQuat(this._v3Pos, Vec3.FORWARD, this._rotation)
      Vec3.multiplyScalar(this._v3Pos, this._v3Pos, this._radius)
      this._v3Pos.add(this._center)

      this.node.position = this._v3Pos
      this.node.lookAt(this._center)
    }
  }

  set reactArea(node: Node) {
    if (this.enableTouch && this._reactArea) {
      this._reactArea.off(Node.EventType.TOUCH_START, this.onTouchStart, this)
      this._reactArea.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
      this._reactArea.off(Node.EventType.TOUCH_END, this.onTouchEnd, this)
      this._reactArea.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)
      this._reactArea.off(Node.EventType.MOUSE_WHEEL, this.onMouseWhee, this)
    }

    this._reactArea = node

    if (this.enableTouch && this._reactArea) {
      this._reactArea.on(Node.EventType.TOUCH_START, this.onTouchStart, this)
      this._reactArea.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
      this._reactArea.on(Node.EventType.TOUCH_END, this.onTouchEnd, this)
      this._reactArea.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)
    }

    if (this.enableScaleRadius && this._reactArea) {
      this._reactArea.on(Node.EventType.MOUSE_WHEEL, this.onMouseWhee, this)
    }
  }

  private onTouchStart(event: EventTouch) {
    let touchs = event.getAllTouches()
    if (touchs.length >= 2) {
      this._lastTouchDis = Vec2.distance(touchs[0].getUIStartLocation(), touchs[1].getUIStartLocation())
    }
    else {
      this._moveDis = 0
    }
  }

  private onTouchMove(event: EventTouch) {
    let touchs = event.getAllTouches()
    if (touchs.length >= 2) {
      let dis = Vec2.distance(touchs[0].getUILocation(), touchs[1].getUILocation())
      console.log(dis, this._lastTouchDis)
      this._targetRadius -= (dis - this._lastTouchDis) * this.radiusRange.y / 750
      // console.log(this._targetRadius)
      this._targetRadius = Math.min(this.radiusRange.y, Math.max(this.radiusRange.x, this._targetRadius))
      this._lastTouchDis = dis
    } else {
      Quat.fromEuler(this._q_tmp, this._targetDir.x, this._targetDir.y, this._targetDir.z)
      Quat.rotateX(this._q_tmp, this._q_tmp, -event!.getDelta().y * DeltaFactor)
      Quat.rotateAround(this._q_tmp, this._q_tmp, Vec3.UP, -event!.getDelta().x * DeltaFactor)
      Quat.toEuler(this._targetDir, this._q_tmp)
      this.limitRotation()
      this._moveDis += (Math.abs(event!.getDelta().x) + Math.abs(event!.getDelta().y))
    }
  }

  private onTouchEnd(event: EventTouch) {
    // if (this._moveDis < 30)
    // Msgs.emit(Notify.UI.TOUCH_END, event)
  }

  private onMouseWhee(event: EventMouse) {
    let scrollY = event.getScrollY()
    this._targetRadius += this.radiusScaleSpeed * -Math.sign(scrollY)
    this._targetRadius = Math.min(this.radiusRange.y, Math.max(this.radiusRange.x, this._targetRadius))
    if (director.getScene()!.globals.shadows.enabled) {
      let r = this._targetRadius + 6
      // director.getScene()!.globals.shadows.shadowDistance = r
      // director.getScene()!.globals.shadows.orthoSize = r
    }
  }

  private limitRotation() {
    this._targetDir.x = Math.max(this.xRotationRange.x, this._targetDir.x)
    this._targetDir.x = Math.min(this.xRotationRange.y, this._targetDir.x)

    this._targetDir.y = Math.max(this.yRotationRange.x, this._targetDir.y)
    this._targetDir.y = Math.min(this.yRotationRange.y, this._targetDir.y)

    this._targetDir.z = 0
  }


}
