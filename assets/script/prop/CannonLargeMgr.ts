import { instantiate, RigidBody, _decorator } from 'cc'
import IslandAssetMgr from '../IslandAssetMgr'
import { Game } from '../model'
import CannonBallMgr from './CannonBallMgr'
const { ccclass, property } = _decorator

import CannonMgr from './CannonMgr'

@ccclass('CannonLargeMgr')
export default class CannonLargeMgr extends CannonMgr {

  onLoad() {
    super.onLoad()

    this.capacity = 3
    this.impulse = 16
    this.ballPosition.set(0, 0 , -0.61)
  }


  preview() { }
}

CannonLargeMgr.ItemName = 'cannonLarge'