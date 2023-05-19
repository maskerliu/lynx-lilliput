import { Component, Event, MeshCollider, MeshRenderer, PhysicMaterial, RigidBody, Vec3, _decorator, tween, v3 } from 'cc'
import { isDebug, terrainItemIdx } from '../misc/Utils'
import { Game, Terrain } from '../model'
import IslandAssetMgr from './IslandAssetMgr'
import { PhyEnvGroup, TerrainPhyMtl } from '../common/Misc'

const { ccclass, property } = _decorator

const DROP_Height = 0.4
const DropPos: Vec3 = v3()
const PreviewScale = v3(0.8, 1, 0.8)

export class PropEvent extends Event {
  static Name = 'PropEvent'
  static Type = {
    ShowInteraction: 'ShowInteraction'
  }

  canAction: boolean = false
  propIndex: number = -1
  interactions: Array<Terrain.ModelInteraction>

  constructor(type: string, canAction: boolean, interactions?: Array<Terrain.ModelInteraction>, propIndex: number = -1) {
    super(PropEvent.Name, true)
    this.type = type
    this.canAction = canAction
    this.interactions = interactions
    this.propIndex = propIndex
  }
}

@ccclass('TerrainItemMgr')
export default class TerrainItemMgr extends Component {
  static ItemName: string

  protected _isSleep: boolean = false
  private isDroping: boolean = false
  private _isSelected = false
  private _index: number = -1
  private boundary: Vec3 = v3()


  protected _info: Game.MapItem
  protected isTranslucent: boolean = false
  protected meshRenderer: MeshRenderer
  protected rigidBody: RigidBody

  private mtls: string[] = []

  get config() { return IslandAssetMgr.getModelConfig(this._info.prefab) }
  get info() { return this._info }
  get isSelected(): boolean { return this._isSelected }
  get index() { return this._index }

  get skinnable() {
    return this.config.skin != null
  }

  onLoad() {

  }

  init(info: Game.MapItem): TerrainItemMgr {
    this._info = info
    this._index = terrainItemIdx(this.info.x, this.info.y, this.info.z)

    this.meshRenderer = this.node.getComponent(MeshRenderer)

    this.meshRenderer.materials.forEach(it => {
      IslandAssetMgr.addMaterial(it.parent.uuid, it.parent)
    })

    this.mtls = this.meshRenderer.materials.map(it => { return it.parent.uuid })

    for (let i = 0; i < this.mtls.length; ++i) {
      this.meshRenderer.setMaterial(IslandAssetMgr.getMaterial(this.mtls[i]), i)
    }

    let minPos = v3(), maxPos = v3()
    this.meshRenderer.model.modelBounds.getBoundary(minPos, maxPos)
    Vec3.subtract(this.boundary, maxPos, minPos)

    let debugNode = this.node.getChildByName('Debug')
    if (debugNode) debugNode.active = isDebug

    switch (this.config.type) {
      case Terrain.ModelType.BlockGrass:
      case Terrain.ModelType.BlockSnow:
      case Terrain.ModelType.BlockDirt:
        this.node.position = v3(info.x, info.y + 1 - this.boundary.y, info.z)

        if (this.rigidBody == null) {
          this.rigidBody = this.addComponent(RigidBody)
          this.rigidBody.type = RigidBody.Type.STATIC
          this.rigidBody.group = PhyEnvGroup.Terrain
          this.rigidBody.setMask(PhyEnvGroup.Prop | PhyEnvGroup.Player | PhyEnvGroup.Vehicle)

          let collider = this.node.addComponent(MeshCollider)
          collider.convex = true
          collider.mesh = this.meshRenderer.mesh
          collider.material = TerrainPhyMtl
        }

        break
      case Terrain.ModelType.Skinnable:
      case Terrain.ModelType.Prop: {
        this.node.position = v3(info.x, info.y, info.z)
        break
      }
    }

    return this
  }

  updatePosition(pos: Vec3) {
    this.node.active = true
    this.info.x = pos.x
    this.info.y = pos.y
    this.info.z = pos.z
    let tmp = v3(pos)
    this.node.active = true
    if (this.config.type != Terrain.ModelType.Prop && this.config.type != Terrain.ModelType.Skinnable) {
      tmp.y = tmp.y + 1 - this.boundary.y
    }
    tmp.y += DROP_Height
    this.node.position = tmp

    this.node.scale = v3(0.8, 1, 0.8)
    this._isSelected = true
    this.onSelected(false)
  }

  onSelected(selected: boolean) {
    if (this.isSelected == selected) return
    if (this.isDroping) return

    this.isDroping = true
    DropPos.set(this.node.position)

    if (!selected && this.isSelected) {
      DropPos.y -= DROP_Height
    }

    if (selected && !this.isSelected) {
      DropPos.y += DROP_Height
    }

    tween(this.node).to(0.5, { position: DropPos }, {
      easing: 'bounceOut', onComplete: () => {
        this._isSelected = selected
        this.isDroping = false
      }
    }).start()
  }

  preview(translucent: boolean) {
    this._isSleep = true

    this.translucent(translucent)
    tween(this.node).to(0.5, { scale: PreviewScale }, { easing: 'bounceOut' }).start()
  }

  translucent(did: boolean) {
    if (this.isTranslucent == did) return

    for (let i = 0; i < this.mtls.length; ++i) {
      let name = !this.isTranslucent && did ? 'translucent' : this.mtls[i]
      this.meshRenderer.setMaterial(IslandAssetMgr.getMaterial(name), i)
    }

    this.isTranslucent = did
  }

  apply() {
    tween(this.node).to(0.5, { scale: Vec3.ONE }, {
      easing: 'bounceIn', onComplete: () => {
        this._isSleep = false
        this.onSelected(false)
        this.translucent(false)
      }
    }).start()
  }

  interact(action: Game.CharacterState) {
    // default do nothing, u can implement this func to apply interact 
    // console.log(action)
  }
}