import {
  Button, Color, Component,
  Director,
  EditBox, Event, EventHandler, Label, Node, Sprite, Toggle,
  ToggleContainer,
  Widget, _decorator, director,
  tween, v3, view
} from 'cc'
import { PlayerEvent } from '../common/PlayerMgr'
import RockerMgr, { RockerTarget } from '../common/RockerMgr'
import { Game, Terrain } from '../model'
import ActionsMgr from './ActionsMgr'
import BattleService from './BattleService'
import { TerrainEditActionType, TerrainEditHandler } from './EnvEditHandler'
import TerrainItemBarMgr from './TerrainItemBarMgr'
import LilliputLoginMgr from './LilliputLoginMgr'
import LocalPrefs from '../misc/LocalPrefs'


const { ccclass, property } = _decorator

export class LilliputUIEvent extends Event {

  static Name = 'UIEvent'

  static Type = {
    TerrainEdit: 'OnTerrainEdit',
    UserInfoBind: 'OnUserInfoBind',
    EnterIsland: 'OnEnterIsland'
  }
  static UserInfoBind = 'OnUserInfoBind'
  static EnterIsland = 'OnEnterIsland'

  customData: any

  constructor(type: string, data?: any) {
    super(LilliputUIEvent.Name, true)
    this.type = type
    this.customData = data
  }
}

@ccclass('LilliputUIMgr')
export default class LilliputUIMgr extends Component {

  @property(Node)
  private rocker: Node

  @property(Node)
  private actions: Node

  @property(Node)
  private profileBtn: Node

  @property(Node)
  private terrainEditBtn: Node

  @property(Node)
  private terrainItemBar: Node

  @property(Node)
  reactArea: Node

  set rockerTarget(target: RockerTarget) {
    this.rocker.getComponent(RockerMgr).target = target
  }

  @property(Node)
  private selectedTerrainItem: Node

  @property(Node)
  private terrainEditToolbar: Node

  @property(Node)
  private layerMenu: Node

  @property(Node)
  private rotateMenu: Node

  private roateLeft: Node
  private roateRight: Node

  @property(Node)
  private skinMenu: Node

  @property(Node)
  private overlay: Node

  @property(Node)
  private network: Node

  @property(Label)
  private fpsLabel: Label

  @property(Node)
  private assetLoadIndicator: Node

  @property(Node)
  private loginPanel: Node

  @property(EditBox)
  inputRoomId: EditBox

  private networkSprite: Sprite
  private networkLabel: Label
  private frameCount: number = 0
  private frameTime: number = Date.now()

  private actionsMgr: ActionsMgr
  private _editHandler: TerrainEditHandler

  set editHandler(handler: TerrainEditHandler) {
    this._editHandler = handler
    this.getComponentInChildren(TerrainItemBarMgr).editHandler = handler
  }

  private _curToolItem = 'Select'

  private loginMgr: LilliputLoginMgr

  onLoad() {
    // TODO not work 
    this.frameTime = Date.now()
    this.node.on(Director.EVENT_AFTER_DRAW, () => {
      if (Date.now() - this.frameTime >= 1000) {
        this.fpsLabel.string = `FPS:\t ${this.frameCount}`
        this.frameTime = Date.now()
        this.frameCount = 0
      } else {
        this.frameCount++
      }
    }, this)

    this.actionsMgr = this.actions.getComponent(ActionsMgr)

    this.loginMgr = this.loginPanel.getComponent(LilliputLoginMgr)

    this.networkSprite = this.network.getComponent(Sprite)
    this.networkLabel = this.network.getComponentInChildren(Label)

    let wid = this.node.getComponent(Widget)
    wid.top = -view.getViewportRect().y
    wid.bottom = -view.getViewportRect().y
    wid.left = -view.getViewportRect().x
    wid.right = -view.getViewportRect().x

    // screen.requestFullScreen()
    let envEditMenuHandler = new EventHandler()
    envEditMenuHandler.target = this.node
    envEditMenuHandler.component = 'LilliputUIMgr'
    envEditMenuHandler.handler = 'onEnvEditToolbarChanged'
    this.terrainEditToolbar.getComponent(ToggleContainer).checkEvents.push(envEditMenuHandler)

    let layerMenuHandler = new EventHandler()
    layerMenuHandler.target = this.node
    layerMenuHandler.component = 'LilliputUIMgr'
    layerMenuHandler.handler = 'onEnvLayerChanged'
    this.layerMenu.getComponent(ToggleContainer).checkEvents.push(layerMenuHandler)

    this.roateLeft = this.rotateMenu.getChildByName('RotateLeft')
    this.roateRight = this.rotateMenu.getChildByName('RotateRight')

    this.roateLeft.on(Button.EventType.CLICK, () => {
      this._editHandler.onRotate(-90)
    }, this)

    this.roateRight.on(Button.EventType.CLICK, () => {
      this._editHandler.onRotate(90)
    }, this)

    this.loginPanel.active = LocalPrefs.myself == null

    this.node.getChildByName('UserInfo').getChildByName('EnterButton').on(Button.EventType.CLICK, this.onEnter, this)
  }

  update(dt: number) {
    if (BattleService.delay < 50) {
      this.networkSprite.color = this.networkLabel.color = Color.GREEN
    } else if (BattleService.delay < 70) {
      this.networkSprite.color = this.networkLabel.color = Color.YELLOW
    } else {
      this.networkSprite.color = this.networkLabel.color = Color.RED
    }
    this.networkLabel.string = `${BattleService.delay}ms`

    // this.fpsLabel.string = `FPS: ${Math.round(1 / game.deltaTime)}`
  }

  onEdit() {
    this.node.dispatchEvent(new LilliputUIEvent(LilliputUIEvent.Type.TerrainEdit))
  }

  onBind(event: Event) {
    // this.node.dispatchEvent(new LilliputUIEvent(LilliputUIEvent.Type.UserInfoBind, this.inputToken))
  }

  onEnter(event: Event) {
    this.node.dispatchEvent(new LilliputUIEvent(LilliputUIEvent.Type.EnterIsland, this.inputRoomId.string))
  }

  onAction(event: Event, data: string) {
    let action = Number.parseInt(data) as Game.CharacterState
    this.node.dispatchEvent(new PlayerEvent(PlayerEvent.Type.OnAction, action))
  }

  onProfile() {
    director.loadScene('profile')

    BattleService.leave()
    BattleService.removeAllIsland()
  }

  canEdit(edit: boolean) {
    this.terrainEditBtn.active = edit
  }

  onEnvEditToolbarChanged(event: Toggle) {
    if (this._curToolItem == event.node.name) return
    this._curToolItem = event.node.name
    let type = TerrainEditActionType.None
    this.layerMenu.active = false
    this.rotateMenu.active = false
    switch (event.node.name) {
      case 'Layers':
        this.showSubMenu(this.layerMenu)
        type = TerrainEditActionType.Selected
        break
      case 'Rotate':
        this.showSubMenu(this.rotateMenu)
        type = TerrainEditActionType.Selected
        break
      case 'Select':
        type = TerrainEditActionType.Selected
        break
      case 'Paint':
        type = TerrainEditActionType.Add_Preview
        break
      case 'Erase':
        type = TerrainEditActionType.Erase
        break
    }

    this._editHandler.onEditActionChanged(type)
  }

  onEnvLayerChanged(event: Toggle) {
    let layer = Number.parseInt(event.node.name.split('Layer')[1])
    this._editHandler.onEditLayerChanged(layer)
  }

  onEnvItemRotated(event: Event, data: string) {
    let angle = Number.parseInt(data)
    this._editHandler.onRotate(angle)
  }

  onEnvItemSkinChanged(toggle: Toggle) {
    this._editHandler.onSkinChanged(toggle.node.name)
  }

  onCloseSkinMenu() {
    this.skinMenu.active = false
  }

  updateEditMode(isEdit: boolean) {
    this.terrainEditBtn.getComponent(Button)

    this.profileBtn.active = !isEdit
    this.actions.active = !isEdit
    this.selectedTerrainItem.active = isEdit
    this.terrainEditToolbar.active = isEdit

    let tc = this.terrainEditToolbar.getComponent(ToggleContainer)
    tc.toggleItems[0].isChecked = true
    tc.notifyToggleCheck(tc.toggleItems[0])

    tc = this.layerMenu.getComponent(ToggleContainer)
    tc.toggleItems[0].isChecked = true
    tc.notifyToggleCheck(tc.toggleItems[0])

    this.terrainItemBar.getComponent(TerrainItemBarMgr).show(isEdit)
    this.rocker.getComponent(RockerMgr).show(!isEdit)
    this._editHandler?.onEditModeChanged()
  }

  updateLoading(show: boolean, content?: string) {
    this.overlay.active = show
    this.assetLoadIndicator.active = show
    if (show) {
      this.assetLoadIndicator.getComponentInChildren(Label).string = content
    }
  }

  updateActions(interactions: Array<Terrain.ModelInteraction>) {
    this.actionsMgr.updateActions(interactions)
  }

  showSkinMenu(show: boolean) {
    this.skinMenu.active = show
  }

  private showSubMenu(node: Node) {
    node.scale = v3(0, 1, 1)
    node.active = true
    tween(node).to(0.3, { scale: v3(1, 1, 1) }, { easing: 'bounceOut' }).start()
  }

}