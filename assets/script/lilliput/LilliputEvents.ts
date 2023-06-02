import { Event } from 'cc'
import { Terrain } from '../common/Terrain'
import { Game, Island } from '../model'

export namespace Lilliput {

  export class UIEvent extends Event {

    static Name = 'UIEvent'

    static Type = {
      UserInfoBind: 'OnUserInfoBind',
    }

    customData: any

    constructor(type: string, data?: any) {
      super(UIEvent.Name, true)
      this.type = type
      this.customData = data
    }
  }

  export class IslandEvent extends Event {
    customData: {
      prefab?: string
      action?: Terrain.ActionType
      layer?: number
      degree?: number
      skin?: Island.MapItemSkin
      show?: boolean // show skin menu
      msg?: any
    }

    static Type = {
      OnEditChanged: 'OnEditChanged',
      OnItemChanged: 'OnEditItemChanged',
      OnActionChanged: 'OnEditActionChanged',
      OnLayerChanged: 'OnEditLayerChanged',
      OnRotate: 'OnRotate',
      OnSkinChanged: 'OnSkinChanged',
      SkinMenu: 'SkinMenu',
      OnMsgArrived: 'OnMsgArrived'
    }

    constructor(type: string, data?: any) {
      super(type, true)

      this.customData = data
    }
  }


  export class PropEvent extends Event {
    static Name = 'PropEvent'
    static Type = {
      ShowInteractMenu: 'ShowInteractMenu'
    }

    interactions: Array<Terrain.InteractType>

    constructor(type: string, interactions?: Array<Terrain.InteractType>) {
      super(PropEvent.Name, true)
      this.type = type
      this.interactions = interactions
    }
  }


  export class PlayerEvent extends Event {

    action: Game.CharacterState
    interactProp: number
    customData?: any

    static Type = {
      TryEnter: 'TryEnter',
      DidEnter: 'DidEnter',
      OnLeave: 'OnLeave',
      OnAction: 'OnAction',
    }

    constructor(type: string, action: Game.CharacterState = Game.CharacterState.None, interactProp: number = -1) {
      super(type, true)
      this.action = action
      this.interactProp = interactProp
    }
  }


}