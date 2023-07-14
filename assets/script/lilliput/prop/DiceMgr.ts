import { BoxCollider, Vec3, _decorator, tween, v3 } from 'cc'
import { Game } from '../../model'
import CommonPropMgr, { PreviewScale } from './CommonPropMgr'

const { ccclass, property } = _decorator


@ccclass('DiceMgr')
export default class DiceMgr extends CommonPropMgr {

  private _pos = v3()

  private _shaking = false

  protected initPhysical(): void {
    super.initPhysical()

    // this.rigidBody.useCCD = true
    this.rigidBody.mass = 2

    let collider = this.node.addComponent(BoxCollider)
    collider.isTrigger = true
    collider.size = v3(1.5, 1.5, 1.5)

    this._pos.set(this.node.position)
  }

  preview(preview: boolean) {
    if (this._animating) return

    super.preview(preview)

    if (preview) {
      this._pos.set(this.node.position)
      CommonPropMgr.v3_pos.set(this._info[1], this._info[2], this._info[3])
      this.node.position = CommonPropMgr.v3_pos
      this.rigidBody.sleep()
      this.rigidBody.useGravity = false
    } else {
      this.node.position = this._pos
      this._selected = false
      this.rigidBody.useGravity = true
    }

  }

  interact(action: Game.CharacterState) {
    switch (action) {
      case Game.CharacterState.Kick:
        setTimeout(() => {
          this.rigidBody?.applyImpulse(v3(0, 14, 0))
          this.rigidBody?.applyTorque(v3(88, 70, 100))
        }, 400)
        break
    }
  }
}

DiceMgr.ItemName = 'dice'