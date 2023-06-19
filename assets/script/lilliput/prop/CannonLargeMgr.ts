import { Prefab, _decorator } from 'cc'
import CannonMgr from './CannonMgr'

const { ccclass, property } = _decorator

@ccclass('CannonLargeMgr')
export default class CannonLargeMgr extends CannonMgr {

  protected addSubModel(prefab: Prefab): void {
    super.addSubModel(prefab)

    this.barrel = this.node.getChildByName(this.config.name).getChildByName('barrelLarge')
    this.capacity = 3
    this.impulse = 16
    this.ballPosition.set(0, 0 , -0.61)
  }
}

CannonLargeMgr.ItemName = 'cannonLarge'