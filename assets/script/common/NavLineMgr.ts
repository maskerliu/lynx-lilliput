import { Color, Component, MeshRenderer, Vec3, _decorator, renderer, v2, v3 } from 'cc'

const { ccclass, property } = _decorator

@ccclass('NavLineMgr')
export default class NavLineMgr extends Component {

  private meshRenderer: MeshRenderer
  protected mtl: renderer.MaterialInstance /* 材质instance */

  private dtFrame = 4
  private moveSpeed = 2
  private density = 1
  private xEuler = true

  private inited = false/* 导航线是否启动 */
  private dstLen: number = 0
  private dt: number = 0
  private angle: number = 0

  private tilingOffset = v2(1, 1)
  private dstPos = v3()
  private _v3_0 = v3()
  private _scale = v3(Vec3.ONE)

  onLoad() {
    this.meshRenderer = this.getComponent(MeshRenderer)
    this.mtl = this.meshRenderer.material
    this.stop()
  }

  start() {

    this.mtl.setProperty('textureMoveSpeed', v2(0, this.moveSpeed))
  }

  update() {
    if (this.inited) {
      this.dt++;
      if (this.dt >= this.dtFrame) {
        this.setDistance()
        this.dt = 0
      }
    }
  }

  stop() {
    this.inited = false
    this.mtl.setProperty('mainColor', Color.TRANSPARENT)
  }

  init(pos: Vec3) {
    this.dt = 0
    this.inited = true
    this.mtl.setProperty('mainColor', Color.RED)

    this.dstPos.set(pos)
    this.setDistance()
  }

  private setDistance() {
    this.dstLen = Vec3.distance(this.dstPos, this.node.worldPosition)
    this._scale.z = this.dstLen
    this.node.scale = this._scale
    this.tilingOffset.y = this.dstLen * this.density
    this.mtl.setProperty("tilingOffset", this.tilingOffset)
    if (this.xEuler) this.rotate(this.node.worldPosition, this.dstPos)
  }

  private rotate(start: Vec3, end: Vec3) {
    this.angle = Math.asin(Math.sin(Math.abs(end.y - start.y) / this.dstLen)) * (180 / Math.PI) % 360
    this._v3_0.x = (end.y - start.y) > 0 ? -this.angle : this.angle
    this.node.setRotationFromEuler(this._v3_0)
  }

}