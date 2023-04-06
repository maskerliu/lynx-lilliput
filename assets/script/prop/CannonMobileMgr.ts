import { instantiate, ITriggerEvent, Quat, RigidBody, _decorator } from 'cc'
import IslandAssetMgr from '../IslandAssetMgr'
import { Game } from '../model'
import CannonBallMgr from './CannonBallMgr'
const { ccclass, property } = _decorator

import CannonMgr from './CannonMgr'

@ccclass('CannonMobileMgr')
export default class CannonMobileMgr extends CannonMgr {

  onLoad() {
    super.onLoad()

    this.impulse = 12
    this.capacity = 3
  }

  preview() {

  }
}

CannonMobileMgr.ItemName = 'cannonMobile'