import { BoxCollider, _decorator, v3 } from 'cc'
import { Game } from '../../model'
import CommonPropMgr from './CommonPropMgr'

const { ccclass, property } = _decorator


@ccclass('DiceMgr')
export default class DiceMgr extends CommonPropMgr {

  protected initPhysical(): void {
    super.initPhysical()

    // this.rigidBody.useCCD = true
    this.rigidBody.mass = 2

    let collider = this.node.addComponent(BoxCollider)
    collider.isTrigger = true
    collider.size = v3(1.5, 1.5, 1.5)
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