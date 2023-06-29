import {
  Component, EventHandler, Node, Prefab, ScrollView, Sprite,
  SpriteAtlas, Toggle, ToggleContainer, UITransform, Vec3, _decorator, instantiate, screen, size, tween, v3
} from 'cc'
import { BigWorld } from '../common/BigWorld'
import ToggleMgr from '../common/ToggleMgr'
import LilliputAssetMgr from './LilliputAssetMgr'

const { ccclass, property } = _decorator

const IslandItemChangedEvent = new BigWorld.IslandEvent(BigWorld.IslandEvent.Type.OnItemChanged)


@ccclass('LilliputPropStoreMgr')
export default class LilliputPropStoreMgr extends Component {

  @property(Node)
  private selectedProp: Node

  @property(ToggleContainer)
  private itemGroup: ToggleContainer

  @property(ToggleContainer)
  private itemsContainer: ToggleContainer

  @property(Prefab)
  private togglePrefab: Prefab

  @property(SpriteAtlas)
  private uiAtlas: SpriteAtlas

  private dstPos: Vec3 = v3()
  private scrollView: ScrollView
  private selectedPropSnap: Sprite
  private modelType: BigWorld.ModelGroup = BigWorld.ModelGroup.Ground

  onLoad() {
    this.scrollView = this.getComponent(ScrollView)
    this.selectedPropSnap = this.selectedProp.getComponentInChildren(Sprite)
    this.dstPos.set(this.node.position)
    this.dstPos.x = screen.windowSize.width / 2 - 10

    let groupSelectHandler = new EventHandler()
    groupSelectHandler.target = this.node
    groupSelectHandler.component = 'LilliputPropStoreMgr'
    groupSelectHandler.handler = 'onTerrainGroupChanged'
    this.itemGroup.checkEvents.push(groupSelectHandler)

    let itemSelectHandler = new EventHandler()
    itemSelectHandler.target = this.node
    itemSelectHandler.component = 'LilliputPropStoreMgr'
    itemSelectHandler.handler = 'onTerrainItemSelected'
    this.itemsContainer.checkEvents.push(itemSelectHandler)
  }

  protected start(): void {
    this.initTerrainGroup()
    this.loadTrrainGroupItems()
  }

  private initTerrainGroup() {
    let p = v3()
    let s = size(80, 80)
    for (let i = 0; i < 3; ++i) {
      p.set(20 * (i + 1) + s.width * (i + 0.5), 50)
      let toggle = instantiate(this.togglePrefab)
      toggle.position = p
      toggle.getComponent(UITransform).contentSize = s
      let mgr = toggle.addComponent(ToggleMgr)
      mgr.customData = i
      let iconNode = toggle.getChildByName('Icon')
      let sprite = iconNode.getComponent(Sprite)
      sprite.spriteFrame = this.uiAtlas.getSpriteFrame('box')
      // let contentSize = sprite.getComponent(UITransform).contentSize
      this.itemGroup.node.addChild(toggle)
    }
  }

  show(show: boolean) {
    this.dstPos.y = show ? 280 : -160
    if (show) this.node.active = show
    tween(this.node).to(0.5, { position: this.dstPos }, {
      easing: 'bounceOut', onComplete: () => {
        if (show) {
          this.loadTrrainGroupItems()
          this.scrollView.scrollToLeft(0.2)
          this.onTerrainItemSelected(this.itemsContainer.toggleItems[0])
        } else {
          this.node.active = false
          this.itemsContainer.node.removeAllChildren()
        }
      }
    }).start()
  }

  onTerrainGroupChanged(event: Toggle) {
    let mgr = event.node.getComponent(ToggleMgr)
    this.modelType = mgr.customData
    this.loadTrrainGroupItems()
    this.scrollView.scrollToLeft(0.2)
    this.onTerrainItemSelected(this.itemsContainer.toggleItems[0])
  }

  onTerrainItemSelected(event: Toggle) {
    let contentSize = this.selectedPropSnap.getComponent(UITransform).contentSize
    let scaleX = 80 / contentSize.width
    let scaleY = 80 / contentSize.height
    let scale = scaleX > scaleY ? scaleY : scaleX
    this.selectedPropSnap.node.scale = v3(scale, scale)

    let mgr = event.node.getComponent(ToggleMgr)
    IslandItemChangedEvent.customData = { prefab: mgr.customData }
    this.node.dispatchEvent(IslandItemChangedEvent)

    let config = LilliputAssetMgr.instance.getModelConfig(mgr.customData)
    this.selectedPropSnap.spriteFrame = this.uiAtlas.getSpriteFrame(`snap/${config.name}`)
  }

  private loadTrrainGroupItems() {
    let configs = LilliputAssetMgr.instance.getModelConfigs(this.modelType)
    let s = size(configs.length * 115 - 15, 140)
    this.scrollView.content.getComponent(UITransform).setContentSize(s)
    this.itemsContainer.node.getComponent(UITransform).setContentSize(s)
    this.itemsContainer.node.removeAllChildren()
    s = size(100, 130)
    let p = v3()
    for (let i = 0; i < configs.length; ++i) {
      const toggle = instantiate(this.togglePrefab)
      let mgr = toggle.addComponent(ToggleMgr)
      mgr.customData = configs[i].id
      toggle.getComponent(UITransform).contentSize = s
      p.set(115 * i + 50, 70, 0)
      toggle.position = p
      let iconNode = toggle.getChildByName('Icon')
      let sprite = iconNode.getComponent(Sprite)
      sprite.spriteFrame = this.uiAtlas.getSpriteFrame(`snap/${configs[i].name}`)
      let contentSize = sprite.getComponent(UITransform).contentSize
      let scaleX = 80 / contentSize.width
      let scaleY = 80 / contentSize.height
      let scale = scaleX > scaleY ? scaleY : scaleX
      iconNode.scale = v3(scale, scale)
      this.itemsContainer.node.addChild(toggle)
    }
  }

}