import {
  Component, EventHandler, Node, Prefab, ScrollView, Sprite,
  SpriteAtlas, Toggle, ToggleContainer, UITransform, Vec3, _decorator, instantiate, screen, size, tween, v3
} from 'cc'
import { Terrain } from '../common/Terrain'
import ToggleMgr from '../common/ToggleMgr'
import LilliputAssetMgr from './LilliputAssetMgr'
import { Lilliput } from './LilliputEvents'


const { ccclass, property } = _decorator


const IslandItemChangedEvent = new Lilliput.IslandEvent(Lilliput.IslandEvent.Type.OnItemChanged)

@ccclass('TerrainItemBarMgr')
export default class TerrainItemBarMgr extends Component {

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

  private dstPos: Vec3
  private scrollView: ScrollView
  private selectedPropSnap: Sprite
  private modelType: Terrain.ModelGroup = Terrain.ModelGroup.Ground

  onLoad() {
    this.scrollView = this.getComponent(ScrollView)
    this.selectedPropSnap = this.selectedProp.getComponentInChildren(Sprite)
    this.dstPos = v3(this.node.position)
    this.dstPos.x = screen.windowSize.width / 2 - 30

    let groupSelectHandler = new EventHandler()
    groupSelectHandler.target = this.node
    groupSelectHandler.component = 'TerrainItemBarMgr'
    groupSelectHandler.handler = 'onTerrainGroupChanged'
    this.itemGroup.checkEvents.push(groupSelectHandler)

    let itemSelectHandler = new EventHandler()
    itemSelectHandler.target = this.node
    itemSelectHandler.component = 'TerrainItemBarMgr'
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
    tween(this.node).to(0.5, { position: this.dstPos }, {
      easing: 'bounceOut', onComplete: () => {
        if (show) {
          this.loadTrrainGroupItems()
          this.scrollView.scrollToLeft(0.2)
          this.onTerrainItemSelected(this.itemsContainer.toggleItems[0])
        } else {
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
    // let atlas = LilliputAssetMgr.getTexture('TerrainItemSnaps') as SpriteAtlas
    this.selectedPropSnap.spriteFrame = this.uiAtlas.getSpriteFrame(`snap/${event.target.name}`)
    let contentSize = this.selectedPropSnap.getComponent(UITransform).contentSize
    let scaleX = 80 / contentSize.width
    let scaleY = 80 / contentSize.height
    let scale = scaleX > scaleY ? scaleY : scaleX
    this.selectedPropSnap.node.scale = v3(scale, scale)

    IslandItemChangedEvent.customData = { prefab: event.target.name }
    this.node.dispatchEvent(IslandItemChangedEvent)
  }

  private loadTrrainGroupItems() {
    let configs = LilliputAssetMgr.getModelCongfigs(this.modelType)
    let s = size(configs.length * 115 - 15, 140)
    this.scrollView.content.getComponent(UITransform).setContentSize(s)
    this.itemsContainer.node.getComponent(UITransform).setContentSize(s)
    this.itemsContainer.node.removeAllChildren()
    s = size(100, 130)
    let p = v3()
    for (let i = 0; i < configs.length; ++i) {
      const node = instantiate(this.togglePrefab)
      node.getComponent(UITransform).contentSize = s
      p.set(115 * i + 50, 70, 0)
      node.position = p
      node.name = configs[i].name
      let iconNode = node.getChildByName('Icon')
      let sprite = iconNode.getComponent(Sprite)
      sprite.spriteFrame = this.uiAtlas.getSpriteFrame(`snap/${configs[i].name}`)
      let contentSize = sprite.getComponent(UITransform).contentSize
      let scaleX = 80 / contentSize.width
      let scaleY = 80 / contentSize.height
      let scale = scaleX > scaleY ? scaleY : scaleX
      iconNode.scale = v3(scale, scale)
      this.itemsContainer.node.addChild(node)
    }
  }

}