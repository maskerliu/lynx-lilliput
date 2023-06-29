import { BoxCollider, Prefab, Quat, UITransform, _decorator, math, tween, v3 } from 'cc'
import CommonPropMgr from './CommonPropMgr'

const { ccclass, property } = _decorator


@ccclass('LadderMgr')
export default class LadderMgr extends CommonPropMgr {

  private _modelPos = v3()
  get modelPos() { return this._modelPos }
  private updateModelPos() {
    this._modelPos.set(this.node.position)
    let radius = math.toRadian(this.info[4])
    this._modelPos.x -= Math.sin(radius) * 0.28
    this._modelPos.z -= Math.cos(radius) * 0.28
    this._modelPos.z += 0.05
  }

  protected addSubModel(prefab: Prefab): void {
    super.addSubModel(prefab)
    this.updateModelPos()
  }

  rotate(angle: number): void {
    if (this._animating) return

    this._animating = true
    Quat.rotateY(CommonPropMgr.q_rotation, this.node.rotation, math.toRadian(angle))
    tween(this.node).to(0.3, { rotation: CommonPropMgr.q_rotation }, {
      easing: 'linear',
      onComplete: () => {
        this._animating = false
        this._info[4] = this.angle(this._info[4] + angle)
        this.updateModelPos()
      }
    }).start()
  }

  protected initPhysical(): void {
    super.initPhysical()
    let collider = this.node.addComponent(BoxCollider)
    collider.center = this.meshRenderer.model.modelBounds.center
    collider.center.z = -0.2
    collider.size = v3(this.modelBoundary.x + 0.2, this.modelBoundary.y, 0.5 - this.modelBoundary.z)
    collider.isTrigger = true

    collider.enabled = false
  }
}

LadderMgr.ItemName = 'ladder'