import { BigWorld } from '../../common/BigWorld'
import BlockMgr from './BlockMgr'
import CannonMgr from './CannonMgr'
import CommonPropMgr from './CommonPropMgr'
import CrateMgr from './CrateMgr'
import DiceMgr from './DiceMgr'
import LadderMgr from './LadderMgr'
import LeverMgr from './LeverMgr'
import MushroomMgr from './MushroomMgr'
import RocksMgr from './RocksMgr'
import SpikesMgr from './SpikesMgr'

export function registerProps() {
  BigWorld.setPropMgr(CrateMgr.ItemName, CrateMgr)
  BigWorld.setPropMgr(DiceMgr.ItemName, DiceMgr)
  BigWorld.setPropMgr(LadderMgr.ItemName, LadderMgr)
  BigWorld.setPropMgr(LeverMgr.ItemName, LeverMgr)
  BigWorld.setPropMgr(MushroomMgr.ItemName, MushroomMgr)
  BigWorld.setPropMgr(SpikesMgr.ItemName, SpikesMgr)
  BigWorld.setPropMgr(RocksMgr.ItemName, RocksMgr)
  BigWorld.setPropMgr(CannonMgr.ItemName, CannonMgr)
  BigWorld.setPropMgr(BlockMgr.ItemName, BlockMgr)
  BigWorld.setPropMgr(CommonPropMgr.ItemName, CommonPropMgr)
}