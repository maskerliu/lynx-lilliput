import { lerp, Quat, Vec3, _decorator } from 'cc'
import BattleService from '../BattleService'
import { Game } from '../model'
import PlayerMgr, { Climb_Speed, Move_Speed } from './PlayerMgr'
const { ccclass, property } = _decorator

@ccclass('KilliFishMgr')
export default class KilliFishMgr extends PlayerMgr {

  onLoad() {
    super.onLoad()
  }

  update(dt: number) {
    
  }

  
}