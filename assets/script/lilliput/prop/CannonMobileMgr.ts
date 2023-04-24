import { _decorator } from 'cc'
import CannonMgr from './CannonMgr'

const { ccclass, property } = _decorator

@ccclass('CannonMobileMgr')
export default class CannonMobileMgr extends CannonMgr {

  onLoad() {
    super.onLoad()
    this.barrel = this.node.getChildByName('barrelMobile')

    this.impulse = 12
    this.capacity = 3
  }

  preview() {

  }
}

CannonMobileMgr.ItemName = 'cannonMobile'