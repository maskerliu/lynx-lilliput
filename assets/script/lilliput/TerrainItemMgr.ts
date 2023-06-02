import { BoxCollider, Component, MeshCollider, MeshRenderer, Quat, RigidBody, Vec3, _decorator, tween, v3 } from 'cc'
import { Terrain } from '../common/Terrain'
import { isDebug, terrainItemIdx } from '../misc/Utils'
import { Game, Island } from '../model'
import LilliputAssetMgr from './LilliputAssetMgr'
import { Lilliput } from './LilliputEvents'

const { ccclass, property } = _decorator

const DROP_Height = 0.4
const DropPos: Vec3 = v3()
const PreviewScale = v3(0.8, 0.8, 0.8)

export const InteractEvent: Lilliput.PropEvent = new Lilliput.PropEvent(Lilliput.PropEvent.Type.ShowInteractMenu)


@ccclass('TerrainItemMgr')
export default class TerrainItemMgr extends Component {
  static ItemName: string

  protected _isSleep: boolean = false
  private isDroping: boolean = false
  private _isSelected = false
  private _index: number = -1

  protected _info: Island.MapItem
  protected isTranslucent: boolean = false
  protected meshRenderer: MeshRenderer
  protected rigidBody: RigidBody
  protected boundary: Vec3 = v3()
  protected mtls: string[] = []

  get config() { return LilliputAssetMgr.getModelConfig(this._info.prefab) }
  get info() { return this._info }
  get isSelected(): boolean { return this._isSelected }
  get index() { return this._index }

  get skinnable() {
    return this.config.skinnable != null && this.config.skinnable
  }

  init(info: Island.MapItem): TerrainItemMgr {
    this._info = info
    this._index = terrainItemIdx(this.info.x, this.info.y, this.info.z)

    Quat.rotateY(this.node.rotation, this.node.rotation, Math.PI / 180 * info.angle)

    let debugNode = this.node.getChildByName('Debug')
    if (debugNode) debugNode.active = isDebug

    this.meshRenderer = this.node.getChildByName(this.info.prefab).getComponent(MeshRenderer)

    this.meshRenderer.materials.forEach(it => {
      LilliputAssetMgr.addMaterial(it.parent.uuid, it.parent)
    })

    this.mtls = this.meshRenderer.materials.map(it => { return it.parent.uuid })
    if (this.mtls != null) {
      for (let i = 0; i < this.mtls.length; ++i) {
        this.meshRenderer.setMaterial(LilliputAssetMgr.getMaterial(this.mtls[i]), i)
      }
    }

    if (this.config.group == Terrain.ModelGroup.Prop) {
      this.meshRenderer.shadowCastingMode = 1
    }

    let minPos = v3(), maxPos = v3()
    this.meshRenderer.model.modelBounds.getBoundary(minPos, maxPos)
    Vec3.subtract(this.boundary, maxPos, minPos)

    this.updatePosition()
    this.physicalInit()

    return this
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
      this.meshRenderer.setMaterial(LilliputAssetMgr.getMaterial(name), i)
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

  private updatePosition() {
    let tmp = v3(this._info.x, this._info.y, this._info.z)
    this.node.active = true
    if (this.config.group != Terrain.ModelGroup.Prop) {
      tmp.y = tmp.y + 1 - this.boundary.y
    }
    tmp.y += DROP_Height
    this.node.position = tmp
    this.node.scale = PreviewScale
    this._isSelected = true
    this.onSelected(false)
  }

  private physicalInit() {
    if (this.config.physical == null) { return }

    this.rigidBody = this.node.addComponent(RigidBody)
    this.rigidBody.type = this.config.physical.type
    this.rigidBody.group = this.config.physical.group

    switch (this.config.physical.collider) {
      case Terrain.ColliderType.Box: {
        let collider = this.node.addComponent(BoxCollider)
        collider.center = this.meshRenderer.model.modelBounds.center
        collider.size = this.boundary
        collider.material = this.phyMtl()
        break
      }
      case Terrain.ColliderType.Mesh: {
        let collider = this.node.addComponent(MeshCollider)
        collider.mesh = this.meshRenderer.mesh
        collider.material = this.phyMtl()
        break
      }
      case Terrain.ColliderType.Cylinder:
        break
      case Terrain.ColliderType.Sphere:
        break
    }

    switch (this.config.physical.group) {
      case Terrain.PhyEnvGroup.Terrain:
        this.rigidBody.setMask(Terrain.TerrainMask)
        break
      case Terrain.PhyEnvGroup.Prop: {
        this.rigidBody.setMask(Terrain.PropMask)
        break
      }
    }
  }

  private phyMtl() {
    switch (this.config.group) {
      case Terrain.ModelGroup.Ground:
        if (this.config.physical?.type == RigidBody.Type.STATIC) return LilliputAssetMgr.getPhyMtl('terrain')
      case Terrain.ModelGroup.Prop:
        if (this.config.physical.type == RigidBody.Type.STATIC) return LilliputAssetMgr.getPhyMtl('propStatic')
        else return LilliputAssetMgr.getPhyMtl('propDynamic')
      default:
        return LilliputAssetMgr.getPhyMtl('terrain')
    }
  }
}