import { _decorator } from 'cc'
import { Game } from '../../model'
import CommonPropMgr from './CommonPropMgr'

const { ccclass, property } = _decorator

@ccclass('MushroomMgr')
export default class MushroomMgr extends CommonPropMgr {


  interact(action: Game.CharacterState) {
    switch (action) {
      case Game.CharacterState.Grab:
        // tween(this.node).to(0.5, { scale: v3(0.5, 0.5, 0.5) }, { easing: 'backInOut' }).start()
        break
    }
  }
}

MushroomMgr.ItemName = 'mushrooms'