import { _decorator } from 'cc'
import TerrainItemMgr from '../TerrainItemMgr'

const { ccclass, property } = _decorator

@ccclass('RocksMgr')
export default class RocksMgr extends TerrainItemMgr {

  
}

RocksMgr.ItemName = 'rocks'