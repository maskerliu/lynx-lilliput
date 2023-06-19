import { Button, Component, Event, EventHandler, Node, Prefab, Sprite, SpriteAtlas, _decorator, instantiate, v3 } from 'cc'
import { BigWorld } from '../common/BigWorld'
import { Game } from '../model'

const { ccclass, property } = _decorator

const PlayerActionEvent = new BigWorld.PlayerEvent(BigWorld.PlayerEvent.Type.OnAction)


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

  updateActions(interactions: Array<BigWorld.InteractType>) {
    this.interactionNode.removeAllChildren()
    if (interactions == null) return
    for (let i = 0; i < interactions.length; ++i) {
      this.generateActionBtn(interactions[i], i)
    }
  }

  onInteract(event: Event, data: string) {
    let interaction = Number.parseInt(data) as BigWorld.InteractType
    let action: Game.CharacterState = Game.CharacterState.None
    switch (interaction) {
      case BigWorld.InteractType.Lift:
        action = Game.CharacterState.Lift
        break
      case BigWorld.InteractType.Shake:
        action = Game.CharacterState.Kick
        break
      case BigWorld.InteractType.Grab:
        action = Game.CharacterState.Grab
        break
      case BigWorld.InteractType.Climb:
        action = Game.CharacterState.Climb
        break
      case BigWorld.InteractType.Fire:
        action = Game.CharacterState.Attack
        break
    }

    if (action != Game.CharacterState.None) {
      PlayerActionEvent.action = action
      this.node.dispatchEvent(PlayerActionEvent)
    }
  }

  private generateActionBtn(interaction: BigWorld.InteractType, index: number) {
    let icon: string = null
    switch (interaction) {
      case BigWorld.InteractType.Lift:
        icon = 'ic_lift'
        break
      case BigWorld.InteractType.Push:
        icon = 'ic_grab'
        break
      case BigWorld.InteractType.Grab:
        icon = 'ic_grab'
        break
      case BigWorld.InteractType.Shake:
        icon = 'ic_kick'
        break
      case BigWorld.InteractType.Throw:
        icon = 'ic_throw'
        break
      case BigWorld.InteractType.Climb:
        icon = 'ic_handup'
        break
      case BigWorld.InteractType.Sit:
        icon = 'ic_props'
        break
      case BigWorld.InteractType.Fire:
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