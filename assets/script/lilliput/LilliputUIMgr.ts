import {
  Button, Component, Director, EditBox, Event, EventHandler,
  Label, Node, Prefab, Sprite, SpriteAtlas, Toggle, ToggleContainer,
  UITransform, Widget, _decorator, director, instantiate, size, tween, v3, view
} from 'cc'
import RockerMgr, { RockerTarget } from '../common/RockerMgr'
import { Terrain } from '../common/Terrain'
import ToggleMgr from '../common/ToggleMgr'
import LocalPrefs from '../misc/LocalPrefs'
import { Game, Island } from '../model'
import ActionsMgr from './ActionsMgr'
import BattleService from './BattleService'
import { Lilliput } from './LilliputEvents'
import LilliputLoginMgr from './LilliputLoginMgr'
import TerrainItemBarMgr from './TerrainItemBarMgr'


const { ccclass, property } = _decorator

const TryEnterEvent = new Lilliput.PlayerEvent(Lilliput.PlayerEvent.Type.TryEnter)
const IslandEditChangedEvent = new Lilliput.IslandEvent(Lilliput.IslandEvent.Type.OnEditChanged)
const IslandActionChangedEvent = new Lilliput.IslandEvent(Lilliput.IslandEvent.Type.OnActionChanged)
const IslandLayerChangedEvent = new Lilliput.IslandEvent(Lilliput.IslandEvent.Type.OnLayerChanged)
const IslandRotateEvent = new Lilliput.IslandEvent(Lilliput.IslandEvent.Type.OnRotate)
const IslandSkinChangedEvent = new Lilliput.IslandEvent(Lilliput.IslandEvent.Type.OnSkinChanged)

const PlayerActionEvent = new Lilliput.PlayerEvent(Lilliput.PlayerEvent.Type.OnAction)

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
  private inputRoomId: EditBox

  @property(SpriteAtlas)
  private uiAtlas: SpriteAtlas

  @property(Prefab)
  private iconTogglePrefab: Prefab

  private networkSprite: Sprite
  private networkLabel: Label
  private frameCount: number = 0
  private frameTime: number = Date.now()

  private actionsMgr: ActionsMgr

  private _curToolItem = 'Select'

  private loginMgr: LilliputLoginMgr

  private _isEdit: boolean = false

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
      IslandRotateEvent.customData = { degree: -90 }
      this.node.dispatchEvent(IslandRotateEvent)
    }, this)

    this.roateRight.on(Button.EventType.CLICK, () => {
      IslandRotateEvent.customData = { degree: 90 }
      this.node.dispatchEvent(IslandRotateEvent)
    }, this)

    this.loginPanel.active = LocalPrefs.myself == null

    this.node.getChildByName('UserInfo').getChildByName('EnterButton').on(Button.EventType.CLICK, this.onEnter, this)

    this.initSkinMenu()
  }

  canEdit(canEdit: boolean, isEdit: boolean) {
    this.terrainEditBtn.active = canEdit
    this._isEdit = isEdit
    this.updateEditMode()
  }

  private initSkinMenu() {
    let p = v3()
    let s = size(100, 100)
    for (let i = 0; i < 3; ++i) {
      p.set(140 * (i - 1), -25)
      let toggle = instantiate(this.iconTogglePrefab)
      toggle.position = p
      toggle.getComponent(UITransform).contentSize = s
      let mgr = toggle.addComponent(ToggleMgr)
      mgr.customData = i as Island.MapItemSkin
      let iconNode = toggle.getChildByName('Icon')
      let sprite = iconNode.getComponent(Sprite)

      let name = 'dirt'
      switch (i) {
        case Island.MapItemSkin.Dirt:
          name = 'blockDirt'
          break
        case Island.MapItemSkin.Grass:
          name = 'block'
          break
        case Island.MapItemSkin.Snow:
          name = 'blockSnow'
          break
      }
      sprite.spriteFrame = this.uiAtlas.getSpriteFrame(`snap/${name}`)
      s.set(80, 80)
      sprite.getComponent(UITransform).contentSize = s
      this.skinMenu.addChild(toggle)
    }

    let skinMenuHandler = new EventHandler()
    skinMenuHandler.target = this.node
    skinMenuHandler.component = 'LilliputUIMgr'
    skinMenuHandler.handler = 'onEnvItemSkinChanged'
    this.skinMenu.getComponent(ToggleContainer).checkEvents.push(skinMenuHandler)

    this.skinMenu.getChildByName('CloseBtn').on(Button.EventType.CLICK, this.onCloseSkinMenu, this)
    this.skinMenu.active = false
  }

  protected onEdit() {
    this.node.dispatchEvent(IslandEditChangedEvent)
    this._isEdit = !this._isEdit
    this.updateEditMode()
  }

  protected onBind(event: Event) {
    // this.node.dispatchEvent(new LilliputUIEvent(LilliputUIEvent.Type.UserInfoBind, this.inputToken))
  }

  protected onEnter(event: Event) {
    TryEnterEvent.customData = { islandId: this.inputRoomId.string }
    this.node.dispatchEvent(TryEnterEvent)
  }

  protected onAction(event: Event, data: string) {
    PlayerActionEvent.action = Number.parseInt(data) as Game.CharacterState
    this.node.dispatchEvent(PlayerActionEvent)
  }

  protected onProfile() {
    director.loadScene('profile')
    BattleService.instance.stop()
  }

  protected onEnvEditToolbarChanged(event: Toggle) {
    if (this._curToolItem == event.node.name) return
    this._curToolItem = event.node.name
    let type = Terrain.ActionType.None
    this.layerMenu.active = false
    this.rotateMenu.active = false
    switch (event.node.name) {
      case 'Layers':
        this.showSubMenu(this.layerMenu)
        type = Terrain.ActionType.Selected
        break
      case 'Rotate':
        this.showSubMenu(this.rotateMenu)
        type = Terrain.ActionType.Selected
        break
      case 'Select':
        type = Terrain.ActionType.Selected
        break
      case 'Paint':
        type = Terrain.ActionType.Add
        break
      case 'Erase':
        type = Terrain.ActionType.Erase
        break
    }

    IslandActionChangedEvent.customData = { action: type }
    this.node.dispatchEvent(IslandActionChangedEvent)
  }

  protected onEnvLayerChanged(event: Toggle) {
    let layer = Number.parseInt(event.node.name.split('Layer')[1])

    // layer = this.layerMenu.getComponent(ToggleContainer).toggleItems.findIndex(it => it == event)

    IslandLayerChangedEvent.customData = { layer }
    this.node.dispatchEvent(IslandLayerChangedEvent)
  }

  protected onEnvItemRotated(event: Event, data: string) {
    let degree = Number.parseInt(data)
    IslandRotateEvent.customData = { degree }
    this.node.dispatchEvent(IslandRotateEvent)
  }

  protected onEnvItemSkinChanged(toggle: Toggle) {
    let mgr = toggle.node.getComponent(ToggleMgr)
    IslandSkinChangedEvent.customData = { skin: mgr.customData }
    this.node.dispatchEvent(IslandSkinChangedEvent)
  }

  protected onCloseSkinMenu() {
    this.skinMenu.active = false
  }

  protected updateEditMode() {
    this.terrainEditBtn.getComponent(Button)

    this.profileBtn.active = !this._isEdit
    this.actions.active = !this._isEdit
    this.selectedTerrainItem.active = this._isEdit
    this.terrainEditToolbar.active = this._isEdit

    let tc = this.terrainEditToolbar.getComponent(ToggleContainer)
    tc.toggleItems[0].isChecked = true
    // tc.notifyToggleCheck(tc.toggleItems[0])

    tc = this.layerMenu.getComponent(ToggleContainer)
    tc.toggleItems[0].isChecked = true
    // tc.notifyToggleCheck(tc.toggleItems[0])

    this.terrainItemBar.getComponent(TerrainItemBarMgr).show(this._isEdit)
    this.rocker.getComponent(RockerMgr).show(!this._isEdit)
    // this._editHandler?.onEditModeChanged()
  }

  updateLoading(show: boolean, content?: string) {

    this.overlay.active = show
    this.assetLoadIndicator.active = show
    if (show) {
      this.assetLoadIndicator.getComponentInChildren(Label).string = content
    }
  }

  updateActions(event: Lilliput.PropEvent) {

    this.actionsMgr.updateActions(event.interactions)
  }

  showSkinMenu(event: Lilliput.IslandEvent) {
    this.skinMenu.active = event.customData.show

    if (event.customData.show) {
      let container = this.skinMenu.getComponent(ToggleContainer)
      container.toggleItems[event.customData.skin ? event.customData.skin : 0].isChecked = true
    }
  }

  private showSubMenu(node: Node) {
    node.scale = v3(0, 1, 1)
    node.active = true
    tween(node).to(0.3, { scale: v3(1, 1, 1) }, { easing: 'bounceOut' }).start()
  }

}