import { _decorator } from 'cc'
import CannonMgr from './CannonMgr'

const { ccclass, property } = _decorator

@ccclass('CannonLargeMgr')
export default class CannonLargeMgr extends CannonMgr {

  onLoad() {
    super.onLoad()
    this.barrel = this.node.getChildByName('barrelLarge')
    this.capacity = 3
    this.impulse = 16
    this.ballPosition.set(0, 0 , -0.61)
  }


  preview() { }
}

CannonLargeMgr.ItemName = 'cannonLarge'