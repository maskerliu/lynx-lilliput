import {
  Button, Component, Event, EventHandler,
  Node, Prefab, Sprite, SpriteAtlas,
  _decorator,
  instantiate,
  v3
} from 'cc'
import { PlayerEvent } from '../common/PlayerMgr'
import { Game, Terrain } from '../model'


const { ccclass, property } = _decorator


@ccclass('ActionsMgr')
export default class ActionsMgr extends Component {


  @property(Node)
  private interactionNode: Node

  @property(SpriteAtlas)
  private atlas: SpriteAtlas

  @property(Prefab)
  private actionBtnPrefab: Prefab

  private clickHanlder: EventHandler


  onLoad() {
    this.clickHanlder = new EventHandler()
    this.clickHanlder.target = this.node
    this.clickHanlder.component = 'ActionsMgr'
    this.clickHanlder.handler = 'onInteract'
  }

  updateActions(interactions: Array<Terrain.ModelInteraction>) {
    this.interactionNode.removeAllChildren()
    if (interactions == null) return
    for (let i = 0; i < interactions.length; ++i) {
      this.generateActionBtn(interactions[i], i)
    }
  }

  onInteract(event: Event, data: string) {
    let interaction = Number.parseInt(data) as Terrain.ModelInteraction
    let action: Game.CharacterState = Game.CharacterState.None
    switch (interaction) {
      case Terrain.ModelInteraction.Lift:
        action = Game.CharacterState.Lift
        break
      case Terrain.ModelInteraction.Push:
        action = Game.CharacterState.Push
        break
      case Terrain.ModelInteraction.Shake:
        action = Game.CharacterState.Kick
        break
      case Terrain.ModelInteraction.Grab:
        action = Game.CharacterState.Grab
        break
      case Terrain.ModelInteraction.Climb:
        action = Game.CharacterState.Climb
        break
      case Terrain.ModelInteraction.Fire:
        action = Game.CharacterState.Attack
        break
    }
    if (action != Game.CharacterState.None)
      this.node.dispatchEvent(new PlayerEvent(PlayerEvent.Type.OnAction, action))
  }

  private generateActionBtn(interaction: Terrain.ModelInteraction, index: number) {
    let icon: string = null
    switch (interaction) {
      case Terrain.ModelInteraction.Lift:
        icon = 'ic_lift'
        break
      case Terrain.ModelInteraction.Push:
        icon = 'ic_grab'
        break
      case Terrain.ModelInteraction.Grab:
        icon = 'ic_grab'
        break
      case Terrain.ModelInteraction.Shake:
        icon = 'ic_kick'
        break
      case Terrain.ModelInteraction.Throw:
        icon = 'ic_throw'
        break
      case Terrain.ModelInteraction.Climb:
        icon = 'ic_handup'
        break
      case Terrain.ModelInteraction.Sit:
        icon = 'ic_props'
        break
      case Terrain.ModelInteraction.Fire:
        icon = 'ic_throw'
        break
      default:
        icon = null
        break
    }
    if (icon == null) return
    let btnNode = instantiate(this.actionBtnPrefab)
    let iconSprite = btnNode.getComponentInChildren(Sprite)
    iconSprite.spriteFrame = this.atlas.getSpriteFrame(icon)
    let angle = (index * 60 + 80) * Math.PI / 180
    btnNode.position = v3(Math.cos(angle) * 200, Math.sin(angle) * 200, 0)
    let clickHanlder = new EventHandler()
    clickHanlder.target = this.node
    clickHanlder.component = 'ActionsMgr'
    clickHanlder.handler = 'onInteract'
    clickHanlder.customEventData = interaction + ''
    btnNode.getComponent(Button).clickEvents.push(clickHanlder)
    this.interactionNode.addChild(btnNode)
  }
}