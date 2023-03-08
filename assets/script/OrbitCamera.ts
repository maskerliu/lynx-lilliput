import { Component, director, EventMouse, EventTouch, lerp, Node, quat, Quat, v2, v3, Vec2, Vec3, _decorator } from 'cc'
const { ccclass, property, type } = _decorator

let tempVec3 = v3()
let tempVec3_2 = v3()
let tempQuat = quat()
const DeltaFactor = 1 / 200

@ccclass('OrbitCamera')
export default class OrbitCamera extends Component {
  @property
  enableTouch = true
  @property
  enableScaleRadius = false
  @property
  autoRotate = false
  @property
  autoRotateSpeed = 90
  @property
  rotateSpeed = 1
  @property
  followSpeed = 1
  @property
  xRotationRange = v2(5, 70)
  @property
  yRotationRange = v2(5, 70)

  @property
  get radius() {
    return this._targetRadius
  }
  set radius(v) {
    this._targetRadius = v
  }
  @property
  radiusScaleSpeed = 1
  @property
  minRadius = 5
  @property
  maxRadius = 10
  @property
  targetRotation = v3(0, 0, 0)
  @property
  followTargetRotationY = true
  @property
  private _targetRadius = 10


  private _startRotation = v3()
  private _center = v3()
  private _targetCenter = v3()
  private _targetRotation = v3()
  private _rotation = quat()
  private _radius = 10
  private _lastTouchDis = 0
  private _moveDis = 0

  private _reactArea: Node = null
  private _target: Node = null

  get target() {
    return this._target
  }
  set target(node: Node) {
    this._target = node
    this._targetRotation.set(this._startRotation)
    this._targetCenter.set(node!.worldPosition)
  }

  start() {
    // this.updateReactArea(this.reactArea)
    this.targetRotation = v3(30, -145, 0)
    this._targetRotation.set(this.targetRotation)
    this._startRotation.set(this.targetRotation)
    this.resetTargetRotation()
    Quat.fromEuler(this._rotation, this._targetRotation.x, this._targetRotation.y, this._targetRotation.z)

    if (this.target) {
      this._targetCenter.set(this.target.worldPosition)
      this._center.set(this._targetCenter)
    }

    this._radius = this.radius
    this.limitRotation()
  }

  update(dt: number) {
    dt = 1 / 30
    let targetRotation = this._targetRotation
    if (this.autoRotate) {
      targetRotation.y += this.autoRotateSpeed * dt
    }

    if (this.target) {
      this._targetCenter.set(this.target.worldPosition)

      if (this.followTargetRotationY) {
        targetRotation = tempVec3_2.set(targetRotation)
        Quat.toEuler(tempVec3, this.target.worldRotation)
        targetRotation.y += tempVec3.y
      }
    }

    Quat.fromEuler(tempQuat, targetRotation.x, targetRotation.y, targetRotation.z)

    Quat.slerp(this._rotation, this._rotation, tempQuat, dt * 7 * this.rotateSpeed)
    Vec3.lerp(this._center, this._center, this._targetCenter, dt * 5 * this.followSpeed)

    this._radius = lerp(this._radius, this._targetRadius, dt * 15)

    Vec3.transformQuat(tempVec3, Vec3.FORWARD, this._rotation)
    Vec3.multiplyScalar(tempVec3, tempVec3, this._radius)
    tempVec3.add(this._center)

    this.node.position = tempVec3
    this.node.lookAt(this._center)
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

  updateTargetRotation(rot: Vec3) {
    this.targetRotation.set(rot)
    this._targetRotation.set(rot)
    this._startRotation.set(rot)
    this.resetTargetRotation()
    Quat.fromEuler(this._rotation, this._targetRotation.x, this._targetRotation.y, this._targetRotation.z)
  }

  private resetTargetRotation() {
    let targetRotation = this._targetRotation.set(this._startRotation)
    if (this.followTargetRotationY) {
      targetRotation = tempVec3_2.set(targetRotation)
      Quat.toEuler(tempVec3, this.target!.worldRotation)
      targetRotation.y += tempVec3.y
    }
  }

  private onTouchStart(event: EventTouch) {
    let touchs = event.getAllTouches()
    if (touchs.length >= 2) {
      let p1 = touchs[0].getUIStartLocation()
      let p2 = touchs[1].getUIStartLocation()
      this._lastTouchDis = Vec2.distance(p1, p2)
    }
    else {
      this._moveDis = 0
    }
  }

  private onTouchMove(event: EventTouch) {
    let touchs = event.getAllTouches()
    if (touchs.length >= 2) {
      let p1 = touchs[0].getUILocation()
      let p2 = touchs[1].getUILocation()
      let dis = Vec2.distance(p1, p2)

      // this._targetRadius += this.radiusScaleSpeed * -Math.sign(dis - this._lastTouchDis)
      let m = this.maxRadius / 750
      this._targetRadius -= (dis - this._lastTouchDis) * m
      this._targetRadius = Math.min(this.maxRadius, Math.max(this.minRadius, this._targetRadius))

      this._lastTouchDis = dis
    } else {
      let delta = event!.getDelta()
      Quat.fromEuler(tempQuat, this._targetRotation.x, this._targetRotation.y, this._targetRotation.z)

      Quat.rotateX(tempQuat, tempQuat, -delta.y * DeltaFactor)
      Quat.rotateAround(tempQuat, tempQuat, Vec3.UP, -delta.x * DeltaFactor)

      Quat.toEuler(this._targetRotation, tempQuat)

      this.limitRotation()

      this._moveDis += (Math.abs(delta.x) + Math.abs(delta.y))
    }
  }

  private onTouchEnd(event: EventTouch) {
    // if (this._moveDis < 30)
    // Msgs.emit(Notify.UI.TOUCH_END, event)
  }

  private onMouseWhee(event: EventMouse) {
    let scrollY = event.getScrollY()
    this._targetRadius += this.radiusScaleSpeed * -Math.sign(scrollY)
    this._targetRadius = Math.min(this.maxRadius, Math.max(this.minRadius, this._targetRadius))
    if (director.getScene()!.globals.shadows.enabled) {
      let r = this._targetRadius + 6
      // director.getScene()!.globals.shadows.shadowDistance = r
      // director.getScene()!.globals.shadows.orthoSize = r
    }
  }

  private limitRotation() {
    let rotation = this._targetRotation

    if (rotation.x < this.xRotationRange.x) {
      rotation.x = this.xRotationRange.x
    }
    else if (rotation.x > this.xRotationRange.y) {
      rotation.x = this.xRotationRange.y
    }

    if (rotation.y < this.yRotationRange.x) {
      rotation.y = this.yRotationRange.x
    }
    else if (rotation.y > this.yRotationRange.y) {
      rotation.y = this.yRotationRange.y
    }

    rotation.z = 0
  }


}
