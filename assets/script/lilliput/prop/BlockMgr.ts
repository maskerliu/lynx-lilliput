import { BoxCollider, MeshRenderer, Node, Quat, RigidBody, Vec3, _decorator, instantiate, tween, v3 } from 'cc'
import { BigWorld } from '../../common/BigWorld'
import { terrainItemIdx } from '../../misc/Utils'
import { Island } from '../../model'
import LilliputAssetMgr from '../LilliputAssetMgr'
import CommonPropMgr, { PreviewScale } from './CommonPropMgr'

const { ccclass, property } = _decorator

const Prefix_GTC = 'groundTileCenter'
const Prefix_GTS = 'groundTileSide'
const Suffix_Dirt = 'Dirt'
const Suffix_Grass = 'Grass'
const Suffix_Snow = 'Snow'

const CubeMatchs = [BigWorld.Cube_Left, BigWorld.Cube_Behind, BigWorld.Cube_Right, BigWorld.Cube_Forward]

@ccclass('BlockMgr')
export default class BlockMgr extends CommonPropMgr {

  private _matrix: number = 0b00000
  private bSides: Array<Node> = []
  private gCenter: Node
  private gSides: Array<Node> = []

  init(info: number[], preview?: boolean) {
    this._info = info
    this._index = terrainItemIdx(this.info[1], this.info[2], this.info[3])

    CommonPropMgr.v3_pos.set(this._info[1], this._info[2], this._info[3])
    this.node.position = CommonPropMgr.v3_pos

    let btsPrefab = LilliputAssetMgr.instance.getTerrainPrefab('blockTileSide')
    for (let i = 0; i < 4; ++i) {
      let tile = instantiate(btsPrefab)
      tile.rotation = Quat.rotateY(tile.rotation, tile.rotation, Math.PI * 90 * i / 180)
      this.node.addChild(tile)
      this.bSides.push(tile)
    }

    this.initGround()

    this.initPhysical()

    this.preview(preview)

    this._loaded = true
  }

  initGround() {
    let gtcPrefab = LilliputAssetMgr.instance.getTerrainPrefab('groundTileCenter')
    let gtsPrefab = LilliputAssetMgr.instance.getTerrainPrefab('groundTileSide')

    for (let i = 0; i < 4; ++i) {
      let tile = instantiate(gtsPrefab)
      tile.rotation = Quat.rotateY(tile.rotation, tile.rotation, Math.PI * 90 * i / 180)
      this.node.addChild(tile)
      this.gSides.push(tile)
    }

    this.gCenter = instantiate(gtcPrefab)
    this.node.addChild(this.gCenter)

    let skin = this._info[5] == null ? Island.MapItemSkin.Grass : this._info[5]
    this._info[5] = -1
    this.updateSkin(skin)
  }

  updateSkin(skin?: Island.MapItemSkin): void {
    if (this._info[5] == skin) return
    this._info[5] = skin

    let offset = [0.0, 0.0]
    switch (this.info[5]) {
      case Island.MapItemSkin.Dirt:
        offset[0] = 0.0625 * 7
        offset[1] = 0.05
        break
      case Island.MapItemSkin.Snow:
        offset[0] = 0.0625 * 14
        offset[1] = 0.1
      default:
        break
    }
    
    this.gCenter.getComponentInChildren(MeshRenderer).setInstancedAttribute('a_offset', offset)
    this.gSides.forEach(it => { it.getComponentInChildren(MeshRenderer).setInstancedAttribute('a_offset', offset) })
  }

  preview(preview: boolean): void {
    if (this._animating) return
    this._animating = true

    if (preview) {
      this.gCenter.active = true
      this.node.addChild(this.gCenter)
      this.gSides.forEach(it => {
        it.active = true
        this.node.addChild(it)
      })
      this.bSides.forEach(it => {
        it.active = true
        this.node.addChild(it)
      })
    }

    if (!preview && this._selected) {
      CommonPropMgr.v3_pos.set(this._info[1], this._info[2], this._info[3])
      this.node.position = CommonPropMgr.v3_pos
      this._selected = false
    }

    tween(this.node).to(0.5, { scale: preview ? PreviewScale : Vec3.ONE }, {
      easing: preview ? 'sineIn' : 'sineIn',
      onComplete: () => {
        this._animating = false
        this._preview = preview
        if (!preview) this.matrix = this._matrix
      }
    }).start()
  }

  set matrix(data: number) {
    this._matrix = data

    if (this._preview) {
      this.gCenter.active = true
      this.node.addChild(this.gCenter)
      this.gSides.forEach(it => {
        it.active = true
        this.node.addChild(it)
      })
      this.bSides.forEach(it => {
        it.active = true
        this.node.addChild(it)
      })

      return
    }

    for (let i = 0; i < CubeMatchs.length; ++i) {
      if (this._matrix & CubeMatchs[i]) {
        this.gSides[i].removeFromParent()
        this.bSides[i].removeFromParent()
        this.gSides[i].active = this.bSides[i].active = false
      } else {
        this.node.addChild(this.gSides[i])
        this.node.addChild(this.bSides[i])
        this.bSides[i].active = this.gSides[i].active = true
      }
    }

    if (this._matrix & BigWorld.Cube_Up) {
      this.gCenter.active = false
      this.gCenter.removeFromParent()
      this.gSides?.forEach(it => {
        it.removeFromParent()
        it.active = false
      })
    } else {
      this.gCenter.active = true
      this.node.addChild(this.gCenter)
    }
  }

  protected initPhysical(): void {
    this.rigidBody = this.node.addComponent(RigidBody)
    this.rigidBody.type = RigidBody.Type.STATIC
    this.rigidBody.group = BigWorld.PhyEnvGroup.Terrain
    this.rigidBody.setMask(BigWorld.GroundMask)

    this.modelCollider = this.node.addComponent(BoxCollider)
    this.modelCollider.center = v3(0, 0.5, 0)
    { (this.modelCollider as BoxCollider).size = Vec3.ONE }
    this.modelCollider.material = this.phyMtl()

    this.enablePhysic(false)
  }
}

BlockMgr.ItemName = 'block'