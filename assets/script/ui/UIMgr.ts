import {
  Button, Color, Component, EditBox, Event, Label, Node, Sprite, Toggle, ToggleContainer, tween, v3, view, Widget, _decorator, director, profiler, game, Director
} from 'cc'
import BattleService from '../BattleService'
import { TerrainEditActionType, TerrainEditHandler } from '../EnvEditHandler'
import { Game, Terrain } from '../model'
import { PlayerEvent } from '../player/PlayerMgr'
import ActionsMgr from './ActionsMgr'
import RockerMgr from './RockerMgr'
import TerrainItemBarMgr from './TerrainItemBarMgr'
const { ccclass, property } = _decorator



export class UIEvent extends Event {

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
    super(UIEvent.Name, true)
    this.type = type
    this.customData = data
  }
}

@ccclass('UIMgr')
export default class UIMgr extends Component {
  @property(Node)
  userInfoPanel: Node

  @property(Node)
  editBtn: Node

  @property(Node)
  rocker: Node

  @property(Node)
  actions: Node

  @property(Node)
  profileBtn: Node

  @property(Node)
  terrainEditBtn: Node

  @property(Node)
  terrainItemBar: Node

  @property(Node)
  cameraReactArea: Node

  @property(Node)
  editReactArea: Node

  @property(Node)
  editCameraReactArea: Node

  @property(Node)
  selectedTerrainItem: Node

  @property(Node)
  terrainEditToolbar: Node

  @property(Node)
  layerMenu: Node

  @property(Node)
  rotateMenu: Node

  @property(Node)
  skinMenu: Node

  @property(Node)
  loading: Node

  @property(Node)
  network: Node

  @property(Label)
  fpsLabel: Label

  private networkSprite: Sprite
  private networkLabel: Label
  private frameCount: number = 0
  private frameTime: number = new Date().getTime()

  private actionsMgr: ActionsMgr
  private _editHandler: TerrainEditHandler

  set editHandler(handler: TerrainEditHandler) {
    this._editHandler = handler
    this.getComponentInChildren(TerrainItemBarMgr).editHandler = handler
  }

  private _curToolItem = 'Select'

  private get inputToken() {
    return this.userInfoPanel.getChildByName('UserToken').getComponent(EditBox).string
  }

  private get inputRoomId() {
    return this.userInfoPanel.getChildByName('RoomId').getComponent(EditBox).string
  }

  onLoad() {
    // TODO not work 
    this.frameTime = new Date().getTime()
    this.node.on(Director.EVENT_AFTER_DRAW, () => {
      if (new Date().getTime() - this.frameTime >= 1000) {
        this.fpsLabel.string = `FPS:\t ${this.frameCount}`
        this.frameTime = new Date().getTime()
        this.frameCount = 0
      } else {
        this.frameCount++
      }
    }, this)

    this.actionsMgr = this.actions.getComponent(ActionsMgr)

    this.networkSprite = this.network.getComponent(Sprite)
    this.networkLabel = this.network.getComponentInChildren(Label)

    let wid = this.node.getComponent(Widget)
    wid.top = -view.getViewportRect().y
    wid.bottom = -view.getViewportRect().y
    wid.left = -view.getViewportRect().x
    wid.right = -view.getViewportRect().x

    // screen.requestFullScreen()
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
    this.node.dispatchEvent(new UIEvent(UIEvent.Type.TerrainEdit))
  }

  onBind(event: Event) {
    this.node.dispatchEvent(new UIEvent(UIEvent.Type.UserInfoBind, this.inputToken))
  }

  onEnter(event: Event) {
    this.node.dispatchEvent(new UIEvent(UIEvent.Type.EnterIsland, this.inputRoomId))
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
    this.userInfoPanel.active = !isEdit
    this.actions.active = !isEdit
    this.cameraReactArea.active = !isEdit

    this.editReactArea.active = isEdit
    this.editCameraReactArea.active = isEdit
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
    this._editHandler?.onEditModeChanged(isEdit)
  }

  updateLoading(show: boolean, content?: string) {
    this.loading.active = show
    if (show) {
      this.loading.getChildByName('Content').getComponentInChildren(Label).string = content
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