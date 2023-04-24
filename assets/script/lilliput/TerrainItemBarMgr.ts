import {
  Component, Node, Prefab, ScrollView, Sprite,
  SpriteAtlas, Toggle, ToggleContainer, UITransform, Vec3, _decorator, instantiate, screen, size, tween, v3
} from 'cc'
import { Terrain } from '../model'
import { TerrainEditHandler } from './EnvEditHandler'
import IslandAssetMgr from './IslandAssetMgr'


const { ccclass, property } = _decorator

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
  private modelType: Terrain.ModelType = Terrain.ModelType.BlockGrass

  editHandler: TerrainEditHandler


  // TODO UI在浏览器尺寸下有拉伸适配问题

  onLoad() {
    this.scrollView = this.getComponent(ScrollView)
    this.selectedPropSnap = this.selectedProp.getComponentInChildren(Sprite)
    this.dstPos = v3(this.node.position)
    this.dstPos.x = screen.windowSize.width / 2 - 30
  }

  show(show: boolean) {
    this.dstPos.y = show ? 280 : -160
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

    switch (event.node.name) {
      case 'Default':
        this.modelType = Terrain.ModelType.BlockGrass
        break
      case 'Snow':
        this.modelType = Terrain.ModelType.BlockSnow
        break
      case 'Dirt':
        this.modelType = Terrain.ModelType.BlockDirt
        break
      case 'Skinnable':
        this.modelType = Terrain.ModelType.Skinnable
        break
      case 'Props':
        this.modelType = Terrain.ModelType.Prop
        break
      case 'Weapon':
        this.modelType = Terrain.ModelType.Weapon
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