import { BoxCollider, Vec3, _decorator, tween, v3 } from 'cc'
import { Game } from '../../model'
import CommonPropMgr, { PreviewScale } from './CommonPropMgr'

const { ccclass, property } = _decorator


@ccclass('TreeTrunkMgr')
export default class TreeTrunkMgr extends CommonPropMgr {

  private _pos = v3()

  protected initPhysical(): void {
    super.initPhysical()

    let collider = this.node.addComponent(BoxCollider)
    collider.isTrigger = true
    collider.size = v3(1.5, 1.5, 1.5)

    this._pos.set(this.node.position)
  }

  interact(action: Game.CharacterState) {
    switch (action) {
      case Game.CharacterState.Sit:
        setTimeout(() => {
          this.rigidBody?.applyImpulse(v3(0, 14, 0))
          this.rigidBody?.applyTorque(v3(88, 70, 100))
        }, 400)
        break
    }
  }
}

TreeTrunkMgr.ItemName = 'treeTrunkLarge'