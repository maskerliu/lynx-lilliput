import { Node, Prefab, Quat, Vec3, _decorator, math, v3 } from 'cc'
import CommonPropMgr from './CommonPropMgr'


const { ccclass, property } = _decorator

@ccclass('DoorLargeMgr')
export default class DoorLargeMgr extends CommonPropMgr {

  private door: Node

  private _pos = v3()
  private _closed = true

  protected addSubModel(prefab: Prefab): void {
    super.addSubModel(prefab)
    this.door = this.node.children[0].getChildByName('doorLargeClosed')

    this._pos.set(this.door.position)

    CommonPropMgr.q_rotation.set(this.door.rotation)

    let angle = 90
    Quat.rotateY(CommonPropMgr.q_rotation, CommonPropMgr.q_rotation, math.toRadian(angle))
  }

  preview(preview: boolean): void {
    super.preview(preview)

    if (preview) {
      this.door.position = Vec3.ZERO
      this._closed = true
      this.unschedule(this.autoDoor)
    } else {
      this.schedule(this.autoDoor, 0.05)
    }
  }

  private autoDoor() {
    if (this._closed) {
      if (this._pos.y > -0.8) {
        this._pos.y -= 0.05
      } else {
        this._closed = false
      }
    } else {
      if (this._pos.y < 0) {
        this._pos.y += 0.05
      } else {
        this._closed = true
      }
    }

    this.door.position = this._pos
  }
}

DoorLargeMgr.ItemName = 'doorLarge'