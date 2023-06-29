import { BoxCollider, Collider, Mesh, MeshCollider, MeshRenderer, Node, Prefab, Quat, RigidBody, Tween, Vec3, _decorator, instantiate, math, quat, resources, tween, v3 } from 'cc'
import { BigWorld } from '../../common/BigWorld'
import { terrainItemIdx } from '../../misc/Utils'
import LilliputAssetMgr from '../LilliputAssetMgr'

const { ccclass, property } = _decorator

const DROP_Height = 0.4
export const PreviewScale = v3(0.7, 0.7, 0.7)


@ccclass('CommonPropMgr')
export default class CommonPropMgr extends BigWorld.MapItemMgr {
  protected static q_rotation = quat()
  protected static v3_pos = v3()

  protected _index: number = -1
  protected _info: Array<number>
  protected _selected = false
  protected _preview: boolean = false
  protected _animating: boolean = false
  protected _loaded: boolean = false
  get loaded() { return this._loaded }

  protected meshRenderer: MeshRenderer
  protected modelMesh: Mesh
  protected modelCenter: Vec3 = v3()
  protected modelBoundary: Vec3 = v3()
  protected rigidBody: RigidBody
  protected modelCollider: Collider

  get config() { return LilliputAssetMgr.instance.getModelConfig(this._info[0]) }
  get info() { return this._info }
  get selected(): boolean { return this._selected }
  get index() { return this._index }
  get skinnable() { return this.config.skinnable != null && this.config.skinnable }

  init(info: Array<number>, preview: boolean = false) {
    this._info = Object.assign([], info)
    this._index = terrainItemIdx(this.info[1], this.info[2], this.info[3])
    this._preview = preview

    this.initModel()
  }

  protected initModel() {
    let prefab = LilliputAssetMgr.instance.getTerrainPrefab(this.config.name)

    if (prefab) {
      this.addSubModel(prefab)
      return
    }

    let folder: string
    switch (this.config.group) {
      case BigWorld.ModelGroup.Decorator:
        folder = 'decorator'
        break
      case BigWorld.ModelGroup.Ground:
        folder = 'ground'
        break
      case BigWorld.ModelGroup.Prop:
        folder = 'prop'
        break
      case BigWorld.ModelGroup.Weapon:
        folder = 'weapon'
        break
    }

    resources.load(`prefab/terrain/${folder}/${this.config.name}`, Prefab, (err, data) => {
      try {
        LilliputAssetMgr.instance.addTerrainPrefab(this.config.name, data)
        this.addSubModel(data)
      } catch (err) { console.error(this._info, this.config) }
    })
  }

  protected addSubModel(prefab: Prefab) {
    let model = instantiate(prefab).getChildByName(this.config.name)
    model.position = Vec3.ZERO
    this.node.addChild(model)

    this.meshRenderer = model.getComponent(MeshRenderer)

    if (this.config.group == BigWorld.ModelGroup.Prop) {
      this.meshRenderer.shadowCastingMode = 1
    }

    let minPos = v3(), maxPos = v3()
    this.meshRenderer.model.modelBounds.getBoundary(minPos, maxPos)
    Vec3.subtract(this.modelBoundary, maxPos, minPos)
    this.modelCenter.set(this.meshRenderer.model.modelBounds.center)
    this.modelMesh = this.meshRenderer.mesh

    this._selected = false
    CommonPropMgr.v3_pos.set(this._info[1], this._info[2], this._info[3])
    this.node.position = CommonPropMgr.v3_pos
    this.node.rotation = Quat.rotateY(this.node.rotation, this.node.rotation, math.toRadian(this._info[4]))

    this.initPhysical()

    this.preview(this._preview)

    this._loaded = true
  }

  protected initPhysical() {
    if (this.config.physical == null) return

    this.rigidBody = this.node.addComponent(RigidBody)
    this.rigidBody.type = this.config.physical.type as RigidBody.Type
    this.rigidBody.group = this.config.physical.group
    this.rigidBody.mass = this.config.physical.mass ? this.config.physical.mass : 1

    switch (this.config.physical.collider) {
      case BigWorld.ColliderType.Mesh: {
        let collider = this.node.addComponent(MeshCollider)
        collider.mesh = this.modelMesh
        collider.material = this.phyMtl()

        this.modelCollider = collider
        break
      }
      case BigWorld.ColliderType.Box: {
        let collider = this.node.addComponent(BoxCollider)
        collider.size = this.modelBoundary
        collider.center = this.modelCenter
        collider.material = this.phyMtl()
        this.modelCollider = collider

        // let debug = instantiate(LilliputAssetMgr.instance.getTerrainPrefab('debug'))
        // debug.scale = this.boundary
        // debug.position = this.meshRenderer.model.modelBounds.center
        // this.node.addChild(debug)
        break
      }
      case BigWorld.ColliderType.Cylinder:
        break
      case BigWorld.ColliderType.Sphere:
        break
    }

    switch (this.config.physical.group) {
      case BigWorld.PhyEnvGroup.Terrain:
        this.rigidBody.setMask(BigWorld.GroundMask)
        break
      case BigWorld.PhyEnvGroup.Prop: {
        this.rigidBody.setMask(BigWorld.PropMask)
        break
      }
    }

    this.enablePhysic(false)
  }

  set selected(isSelected: boolean) {
    if (this._selected == isSelected || this._animating) return

    this._animating = true
    CommonPropMgr.v3_pos.set(this.node.position)

    if (!isSelected && this._selected) {
      CommonPropMgr.v3_pos.y -= DROP_Height
    }

    if (isSelected && !this._selected) {
      CommonPropMgr.v3_pos.y += DROP_Height
    }

    tween(this.node).to(0.5, { position: CommonPropMgr.v3_pos }, {
      easing: 'bounceOut', onComplete: () => {
        this._selected = isSelected
        this._animating = false
      }
    }).start()
  }

  preview(preview: boolean) {
    if (this._animating || this._preview == preview) return

    this._animating = true
    if (!preview && this._selected) {
      CommonPropMgr.v3_pos.set(this._info[1], this._info[2], this._info[3])
      this.node.position = CommonPropMgr.v3_pos
      this._selected = false
    }

    tween(this.node).to(0.5, { scale: preview ? PreviewScale : Vec3.ONE }, {
      easing: 'bounceOut',
      onComplete: () => {
        this._animating = false
        this._preview = preview
      }
    }).start()
  }

  hide() {
    this.node.children.forEach(it => it.destroy())
  }

  rotate(angle: number) {
    if (this._animating) return

    this._animating = true
    Quat.rotateY(CommonPropMgr.q_rotation, this.node.rotation, math.toRadian(angle))
    tween(this.node).to(0.3, { rotation: CommonPropMgr.q_rotation }, {
      easing: 'linear',
      onComplete: () => {
        this._animating = false
        this._info[4] = this.angle(this._info[4] + angle)
      }
    }).start()
  }

  angle(oldAngle: number) {
    let a = 0
    let sin = Math.sin(math.toRadian(oldAngle))
    if (sin == 0) { a = 0 }
    else if (sin == 1) { a = 90 }
    else if (sin == -1) { a = -90 }
    else { a = 180 }
    return a
  }

  enablePhysic(active: boolean) {
    if (this.config.physical) {
      this.node.components.forEach(it => {
        if (it instanceof BigWorld.getPropMgr(this.config.name)) return
        else it.enabled = active
      })
    } else {
      this.node.getChildByName(this.config.name).components.forEach(it => {
        if (it instanceof MeshRenderer) return
        it.enabled = active
      })
    }
  }

  protected phyMtl() {
    let name: string
    switch (this.config.group) {
      case BigWorld.ModelGroup.Ground:
        name = 'terrain'
      case BigWorld.ModelGroup.Prop:
        if (this.config.physical.type == RigidBody.Type.STATIC) name = 'propStatic'
        else name = 'propDynamic'
      default:
        name = 'terrain'
    }

    return LilliputAssetMgr.instance.getPhyMtl(name)
  }
}

CommonPropMgr.ItemName = 'common'