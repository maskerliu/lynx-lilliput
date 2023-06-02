import {
  Camera, Component, EventTouch, Node, Quat,
  RenderTexture, Sprite, Vec2, Vec3, Widget, _decorator, director, quat, view
} from "cc"


const { ccclass, property } = _decorator

@ccclass('ProfileMgr')
export default class ProfileMgr extends Component {
  private _qRotation = quat()
  private _moveDis = 0
  private _radius = 10
  private _lastTouchDis = 0
  private _rotation: Quat = quat()
  private _targetRotation: Quat = quat()

  @property(Sprite)
  public preview: Sprite = null!

  @property(Camera)
  public camera: Camera = null!

  @property(Node)
  character: Node = null!

  protected _renderTex: RenderTexture | null = null

  onLoad() {
    let wid = this.node.getComponent(Widget)
    wid.top = -view.getViewportRect().y
    wid.bottom = -view.getViewportRect().y
    wid.left = -view.getViewportRect().x
    wid.right = -view.getViewportRect().x

    this.preview.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this)
    this.preview.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
    this.preview.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this)
    this.preview.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)

    this._rotation.set(this.character.rotation)
  }

  start() {
    // const spriteFrame = this.preview.spriteFrame!
    // const sp = new SpriteFrame()
    // sp.reset({
    //   originalSize: spriteFrame.originalSize,
    //   rect: spriteFrame.rect,
    //   offset: spriteFrame.offset,
    //   isRotate: spriteFrame.rotated,
    //   borderTop: spriteFrame.insetTop,
    //   borderLeft: spriteFrame.insetLeft,
    //   borderBottom: spriteFrame.insetBottom,
    //   borderRight: spriteFrame.insetRight,
    // })

    // const renderTex = this._renderTex = new RenderTexture()
    // renderTex.reset({
    //   width: 128,
    //   height: 128,
    // })
    // this.camera.targetTexture = renderTex
    // sp.texture = renderTex
    // this.preview.spriteFrame = sp
    // // this.preview.updateMaterial()
    // this.scheduleOnce(() => {
    //   renderTex.resize(512, 512)
    // }, 2)
  }

  onDestroy() {
    if (this._renderTex) {
      this._renderTex.destroy()
      this._renderTex = null
    }
  }

  onBack() {
    director.loadScene('lilliput')
  }

  onSave() {

  }


  protected update(dt: number): void {
    if (this._rotation.equals(this._targetRotation, 0.01)) return
    Quat.slerp(this._rotation, this._rotation, this._targetRotation, dt * 7)
    this.character.rotation = this._rotation
  }

  onTouchStart(event: EventTouch) {
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

  onTouchMove(event: EventTouch) {
    let touchs = event.getAllTouches()
    if (touchs.length >= 2) {
      // let dis = Vec2.distance(touchs[0].getUILocation(), touchs[1].getUILocation())
      // this._targetRadius += this.radiusScaleSpeed * -Math.sign(dis - this._lastTouchDis)
      // this._targetRadius -= (dis - this._lastTouchDis) * 10 / 750
      // this._targetRadius = Math.min(10, Math.max(5, this._targetRadius))
      // this._lastTouchDis = dis
    } else {
      let delta = event!.getDelta()
      // Quat.fromEuler(this._qRotation, this._targetRotation.x, this._targetRotation.y, this._targetRotation.z)
      // Quat.rotateX(this._qRotation, this._qRotation, -delta.y * DeltaFactor)
      Quat.rotateAroundLocal(this._targetRotation, this._rotation, Vec3.UP, delta.x / 20)
      // Quat.toEuler(this._targetRotation, tempQuat)
      // this.limitRotation()
    }
  }

  onTouchEnd(event: EventTouch) {

  }
}