import { BoxCollider, Prefab, _decorator, v3 } from 'cc'
import CommonPropMgr from './CommonPropMgr'

const { ccclass, property } = _decorator


@ccclass('LadderMgr')
export default class LadderMgr extends CommonPropMgr {
  
  private _modelPos = v3()
  get modelPos() { return this._modelPos }

  protected addSubModel(prefab: Prefab): void {
    super.addSubModel(prefab)

    this._modelPos.set(this.node.position)
    let radius = this.info[4] * Math.PI / 180
    this._modelPos.x -= Math.sin(radius) * 0.3
    this._modelPos.z -= Math.cos(radius) * 0.3
    this._modelPos.z += 0.05
  }

  protected initPhysical(): void {
    super.initPhysical()
    let collider = this.node.addComponent(BoxCollider)
    collider.center = v3(0, this.modelBoundary.y / 2, (this.modelBoundary.z - 0.5) / 2)
    collider.size = v3(this.modelBoundary.x + 0.2, this.modelBoundary.y, 0.5 - this.modelBoundary.z)
    collider.isTrigger = true

    collider.enabled = false
  }
}

LadderMgr.ItemName = 'ladder'