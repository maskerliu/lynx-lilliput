import { __private } from 'cc'
import TerrainItemMgr from '../TerrainItemMgr'
import CannonMgr from './CannonMgr'
import CannonMobileMgr from './CannonMobileMgr'
import CrateMgr from './CrateMgr'
import DiceMgr from './DiceMgr'
import FishPondMgr from './FishPondMgr'
import LadderMgr from './LadderMgr'
import LeverMgr from './LeverMgr'
import MushroomMgr from './MushroomMgr'
import RocksMgr from './RocksMgr'
import SpikesMgr from './SpikesMgr'

export const PropMgrs: Map<string, __private._types_globals__Constructor<TerrainItemMgr>> = new Map()
PropMgrs.set(CrateMgr.ItemName, CrateMgr)
PropMgrs.set(DiceMgr.ItemName, DiceMgr)
PropMgrs.set(LadderMgr.ItemName, LadderMgr)
PropMgrs.set(LeverMgr.ItemName, LeverMgr)
PropMgrs.set(MushroomMgr.ItemName, MushroomMgr)
PropMgrs.set(SpikesMgr.ItemName, SpikesMgr)
PropMgrs.set(RocksMgr.ItemName, RocksMgr)
PropMgrs.set(CannonMgr.ItemName, CannonMgr)
PropMgrs.set(CannonMobileMgr.ItemName, CannonMobileMgr)
PropMgrs.set(FishPondMgr.ItemName, FishPondMgr)