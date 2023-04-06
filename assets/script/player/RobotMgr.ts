import { lerp, Quat, Vec3, _decorator } from 'cc'
import BattleService from '../BattleService'
import { Game } from '../model'
import PlayerMgr, { Climb_Speed, Move_Speed } from './PlayerMgr'
const { ccclass, property } = _decorator

@ccclass('OtherMgr')
export default class OtherMgr extends PlayerMgr {

  onLoad() {
    super.onLoad()
  }

  start() {
    super.start()
  }

  update(dt: number) {
    super.update(dt)
  }
}