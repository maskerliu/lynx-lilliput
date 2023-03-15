import { Component, instantiate, Node, Prefab, ScrollView, size, Sprite, SpriteAtlas, Toggle, ToggleContainer, tween, UITransform, v3, Vec3, view, _decorator } from 'cc'
const { ccclass, property } = _decorator

import { TerrainEditHandler } from '../EnvEditHandler'
import { Terrain } from '../model'

import IslandAssetMgr from '../IslandAssetMgr'

@ccclass('TerrainItemBarMgr')
export default class TerrainItemBarMgr extends Component {

  @property(Node)
  private selectedProp: Node

  @property(ToggleContainer)
  private itemsContainer: ToggleContainer

  @property(Prefab)
  private prefab: Prefab

  @property(SpriteAtlas)
  private atlas: SpriteAtlas

  private dstPos: Vec3
  private scrollView: ScrollView
  private selectedPropSnap: Sprite
  private modelType: Terrain.ModelType = Terrain.ModelType.Ground

  editHandler: TerrainEditHandler


  // TODO UI在浏览器尺寸下有拉伸适配问题

  onLoad() {
    this.scrollView = this.getComponent(ScrollView)
    this.selectedPropSnap = this.selectedProp.getComponentInChildren(Sprite)
    this.dstPos = v3(this.node.position)
  }

  show(show: boolean) {
    this.dstPos.y = show ? 160 : -160
    tween(this.node).to(0.5, { position: this.dstPos }, {
      easing: 'bounceOut', onComplete: () => {
        if (show) {
          this.loadTrrainScrollBarItems()
          this.scrollView.scrollToLeft(0.2)
          this.onTerrainItemSelected(this.itemsContainer.toggleItems[0])
        } else {
          this.itemsContainer.node.removeAllChildren()
        }
      }
    }).start()
  }

  onTerrainGroupChanged(event: Toggle) {
    if (event.node.name == 'Terrain') {
      this.modelType = Terrain.ModelType.Ground
    } else if (event.node.name == 'Props') {
      this.modelType = Terrain.ModelType.Prop
    }

    this.loadTrrainScrollBarItems()
    this.scrollView.scrollToLeft(0.2)
    this.onTerrainItemSelected(this.itemsContainer.toggleItems[0])
  }

  onTerrainItemSelected(event: Toggle) {
    // let atlas = IslandAssetMgr.getTexture('TerrainItemSnaps') as SpriteAtlas
    this.selectedPropSnap.spriteFrame = this.atlas.getSpriteFrame(event.target.name)
    let contentSize = this.selectedPropSnap.getComponent(UITransform).contentSize
    let scaleX = 80 / contentSize.width
    let scaleY = 80 / contentSize.height
    let scale = scaleX > scaleY ? scaleY : scaleX
    this.selectedPropSnap.node.scale = v3(scale, scale)
    this.editHandler?.onEditItemChanged(event.target.name)
  }

  private loadTrrainScrollBarItems() {
    let configs = IslandAssetMgr.getModelCongfigs(this.modelType)
    // let atlas = IslandAssetMgr.getTexture('TerrainItemSnaps') as SpriteAtlas
    let s = size(configs.length * 115 - 15, 140)
    this.scrollView.content.getComponent(UITransform).setContentSize(s)
    this.itemsContainer.node.getComponent(UITransform).setContentSize(s)
    this.itemsContainer.node.removeAllChildren()
    s = size(100, 130)
    for (let i = 0; i < configs.length; ++i) {
      const node = instantiate(this.prefab)
      node.getComponent(UITransform).contentSize = s
      node.position = v3(115 * i + 50, 70, 0)
      node.name = configs[i].name
      let iconNode = node.getChildByName('Snap')
      let sprite = iconNode.getComponent(Sprite)
      sprite.spriteFrame = this.atlas.getSpriteFrame(configs[i].name)
      let contentSize = sprite.getComponent(UITransform).contentSize
      let scaleX = 80 / contentSize.width
      let scaleY = 80 / contentSize.height
      let scale = scaleX > scaleY ? scaleY : scaleX
      iconNode.scale = v3(scale, scale)
      this.itemsContainer.node.addChild(node)
    }
  }

}