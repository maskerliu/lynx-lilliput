import { BoxCollider, _decorator, v3 } from 'cc'
import { Game } from '../../model'
import CommonPropMgr from './CommonPropMgr'

const { ccclass, property } = _decorator

@ccclass('CrateMgr')
export default class CrateMgr extends CommonPropMgr {

  protected initPhysical(): void {
    super.initPhysical()
    let collider = this.node.addComponent(BoxCollider)
    collider.size = v3(1.5, 1.5, 1.5)
    collider.isTrigger = true
  }

  interact(action: Game.CharacterState) {
    switch (action) {
      case Game.CharacterState.Lift:

        break
    }
  }
}

CrateMgr.ItemName = 'crate'