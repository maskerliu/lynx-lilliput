import { _decorator } from 'cc'
import PlayerMgr from '../../common/PlayerMgr'
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