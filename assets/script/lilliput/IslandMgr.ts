import {
  Camera, Component, EventTouch,
  MeshRenderer, Node, PhysicsSystem, Prefab, Quat, Touch, UITransform, Vec2, Vec3,
  _decorator, geometry, instantiate, quat, resources, tween, v3
} from 'cc'
import OrbitCamera from '../common/OrbitCamera'
import { Terrain } from '../common/Terrain'
import { terrainItemIdx } from '../misc/Utils'
import { Game, Island, IslandApi } from '../model'
import LilliputAssetMgr from './LilliputAssetMgr'
import { Lilliput } from './LilliputEvents'
import SkinnedTerrainItemMgr from './SkinnableTerrainItemMgr'
import TerrainItemMgr from './TerrainItemMgr'
import UserService from './UserService'
import { PropMgrs } from './prop/Props'


const { ccclass, property } = _decorator


const MIN_FRAME_TIME = 0.033

@ccclass('IslandMgr')
export default class IslandMgr extends Component {

  @property(Node)
  private checkLayer: Node

  @property(Node)
  private hitNode: Node

  @property(Node)
  private hitPoint: Node

  @property(Node)
  private anchorNode: Node

  get curAnchorNode() {
    return this._isEdit ? this.anchorNode : this.myself
  }

  @property(Node)
  private skinBtn: Node

  @property(Node)
  private airWall: Node

  private _isMove = false

  camera: Camera

  private _reactArea: Node
  set reactArea(node: Node) { this._reactArea = node }

  private hitMeshRenderer: MeshRenderer

  private skinBtnPos = v3(0, -2, 0)
  private _mapInfo: Map<number, TerrainItemMgr> = new Map()
  mapInfo(idx: number) { return this._mapInfo.get(idx) }

  private _senceInfo: Island.Island = null
  get senceInfo() { return this._senceInfo }

  private orginPlayerPos = v3()
  private v3_0 = v3()
  private v3_1 = v3()
  private v3_2 = v3()
  private q_skinBtn = quat()
  private q_rotation = quat()
  private occlusionPos = v3()
  private worldPos = v3()

  // for map sence edit
  private _isEdit: boolean = false
  get isEdit() { return this._isEdit }

  private _ray: geometry.Ray = new geometry.Ray()
  private curAction: Terrain.ActionType = Terrain.ActionType.None
  private curLayer: number = 0
  private curPropName: string
  private selectedItem: number
  private lstOcclusions: Array<number> = []
  private curOcclusions: Array<number> = []

  private static IslandEvent: Lilliput.IslandEvent = new Lilliput.IslandEvent(Lilliput.IslandEvent.Type.SkinMenu)

  private loadCost = 0
  private loadCount = 0
  private frequency = 0
  private mergeGround = false
  private myself: Node

  onLoad() {
    this.hitMeshRenderer = this.hitNode.getComponentInChildren(MeshRenderer)

    this.q_skinBtn.set(this.skinBtn.rotation)
  }

  protected onDestroy(): void {
    this._mapInfo.clear()
    this._senceInfo = null
  }

  update(dt: number) {
    // if (this.loadCount < this._senceInfo?.map.length) {
    //   if (dt > MIN_FRAME_TIME) return
    //   this.addTerrainItem(this._senceInfo?.map[this.loadCount], false)
    //   this.loadCount++
    // } else {
    //   if (!this.mergeGround) {
    //     this.mergeGround = true

    //     // TODO 合并静态地形
    //     // BatchingUtility.batchStaticModel(this.terrainGroundStatic, this.terrainGroundMerged)
    //     // let mesh = new Mesh()
    //     // mesh.merge
    //   }
    // }

    if (this.myself == null) return

    this.v3_0.set(this.myself.position)
    this.v3_0.x = Math.round(this.v3_0.x)
    this.v3_0.y = Math.round(this.v3_0.y - 1)
    this.v3_0.z = Math.round(this.v3_0.z)

    if (!this.v3_0.equals(this.airWall.position)) {
      this.updateAirWall(this.v3_0)
    }

    // if (!this._isEdit) {
    //   if (this.frequency < 4) {
    //     this.frequency++
    //   } else {
    //     this.frequency = 0
    //     this.occlusion()
    //   }
    // }
  }

  async init(camera: Camera, id?: string, uid?: string) {
    this.camera = camera
    try {
      this._senceInfo = await IslandApi.getIsland(id, uid)

      if (this._senceInfo.map == null || this.senceInfo.map.length == 0) {
        throw 'map is error'
      }

      for (let item of this._mapInfo.values()) {
        item.node.destroy()
      }

      this._senceInfo.map.forEach(it => {
        this.addTerrainItem(it, false)
      })

      this._mapInfo.clear()

      this._isEdit = false
      this.initIsland()
      return this.senceInfo.id
    } catch (err) {
      console.log(err)
      // await this.genOriginTerrain()
    }
  }

  async updateMap(info: Island.MapItem) {
    let idx = terrainItemIdx(info.x, info.y, info.z)
    if (info.prefab == null)
      this._mapInfo.delete(idx)
    else if (info.prefab != this._mapInfo.get(idx).info.prefab) {
      this._mapInfo.get(idx).node.removeFromParent()
      this.addTerrainItem(info)
    }

    // await GameApi.saveIsland(this.convert2RemoteData())
  }

  private updateAirWall(pos: Vec3) {
    this.airWall.position = pos
    this.airWall.children.forEach(it => {
      Vec3.add(this.v3_1, pos, it.position)
      let idx = terrainItemIdx(this.v3_1.x, this.v3_1.y - 1, this.v3_1.z)
      it.active = !this._mapInfo.has(idx)
    })
  }

  handleInteract(index: number, action: Game.CharacterState) {
    let item = this._mapInfo.get(index)
    if (item == null) return
    item.interact(action)
  }

  canEdit(uid: string) {
    return uid == this._senceInfo.owner
  }

  private initIsland() {
    PhysicsSystem.instance.enable = !this._isEdit


    this.airWall.active = !this._isEdit
    this.hitNode.active = this._isEdit
    this.hitPoint.active = this._isEdit
    this.anchorNode.active = this._isEdit
    this.checkLayer.active = this._isEdit
    this.skinBtn.active = this._isEdit
    this.curLayer = 0

    this.hitNode.position.set(0, -2, 0)
    this.skinBtn.position.set(0, -2, 0)
    this.hitPoint.position.set(0, -2, 0)
    this.curPropName = null
    if (this._isEdit) {
      this.curLayer = 0
      this.curAction = Terrain.ActionType.Selected
      this.checkLayer.position = v3(0, this.curLayer + 1, 0)
      for (let mgr of this._mapInfo.values()) {
        mgr.preview(mgr.info.y > this.curLayer)
      }
      this.registerEvent()
    } else {
      for (let mgr of this._mapInfo.values()) { mgr.apply() }
      this.unRegisterEvent()
    }
  }

  async onEditModeChanged() {
    this._isEdit = !this._isEdit
    this.initIsland()

    this.myself = this.node.getChildByName('myself')
    if (this.myself) {
      this.myself.active = !this._isEdit
      this.orginPlayerPos.set(this.myself.position)
      this.anchorNode.position = this.myself.position
      this.camera.node.getComponent(OrbitCamera).target = this.curAnchorNode
    }

    if (!this._isEdit) {
      let owner = await UserService.profile()
      await IslandApi.saveIsland(owner.id, this.convert2RemoteData())

    }
  }

  onEditItemChanged(event: Lilliput.IslandEvent): void {
    this.curPropName = event.customData.prefab
  }

  onEditActionChanged(event: Lilliput.IslandEvent): void {
    this.curAction = event.customData.action
  }

  onEditLayerChanged(event: Lilliput.IslandEvent): void {
    this.curLayer = event.customData.layer
    let pos = v3(0, this.curLayer, 0)
    pos.y = this.curLayer + 0.1
    // tween(this.waterLayer).to(0.5, { position: pos }, { easing: 'linear' }).start()

    pos.set(this.orginPlayerPos)
    pos.y = this.curLayer + 1.5
    tween(this.anchorNode).to(0.5, { position: pos }, { easing: 'linear' }).start()

    this.checkLayer.position = v3(0, this.curLayer + 1 + 0.2, 0)

    for (let mgr of this._mapInfo.values()) {
      mgr.translucent(mgr.info.y > this.curLayer)
    }
  }

  onRotate(event: Lilliput.IslandEvent): void {
    this.updateMapInfo({
      pos: this.hitNode.position,
      type: Terrain.ActionType.Rotate,
      angle: event.customData.degree
    })
  }

  onSkinChanged(event: Lilliput.IslandEvent) {
    for (let mgr of this._mapInfo.values()) {
      if (!mgr.isSelected) { continue }
      (mgr as SkinnedTerrainItemMgr).updateSkin(event.customData.skin)
    }
  }

  private registerEvent() {
    this._reactArea.on(Node.EventType.TOUCH_START, this.onTouchStart, this)
    this._reactArea.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
    this._reactArea.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)
    this._reactArea.on(Node.EventType.TOUCH_END, this.onTouchEnd, this)
    this._reactArea.on(Node.EventType.MOUSE_MOVE, this.onTouchMove, this)
  }

  private unRegisterEvent() {
    this._reactArea?.off(Node.EventType.TOUCH_START, this.onTouchStart, this)
    this._reactArea?.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
    this._reactArea?.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)
    this._reactArea?.off(Node.EventType.TOUCH_END, this.onTouchEnd, this)
    this._reactArea?.off(Node.EventType.MOUSE_MOVE, this.onTouchMove, this)
  }

  private onTouchStart(event: EventTouch) {
    if (!this.isEdit) return
    this._isMove = false
  }

  private onTouchMove(event: EventTouch) {
    if (!this.isEdit) return
    this._isMove = !Vec2.ZERO.equals(event.getDelta(), 0.542)
    // if (this._isMove) console.log(event.getDelta())
  }

  private onTouchEnd(event: EventTouch) {
    if (!this.isEdit || this._isMove) return
    let action = this.selectGirdItem(event.touch)
    if (action == Terrain.ActionType.None) return
    this.updateMapInfo({ pos: this.hitNode.position, type: action, angle: 0 })
  }

  private selectGirdItem(touch: Touch): Terrain.ActionType {
    this.camera.screenPointToRay(touch.getLocationX(), touch.getLocationY(), this._ray)

    if (!PhysicsSystem.instance.raycast(this._ray, 0xffffffff, 500)) {
      console.warn('no hit')
      return Terrain.ActionType.None
    }

    let skinIdx = PhysicsSystem.instance.raycastResults.findIndex((it) => it.collider.node.name == 'SkinBtn')
    let checkIdx = PhysicsSystem.instance.raycastResults.findIndex((it) => it.collider.node.name == 'CheckLayer')

    if (skinIdx != -1) {
      IslandMgr.IslandEvent.customData = { show: true, skin: this._mapInfo.get(this.selectedItem).info.skin }
      this.node.dispatchEvent(IslandMgr.IslandEvent)
      return Terrain.ActionType.None
    }

    if (checkIdx != -1) {
      this.v3_1.set(this.node.getComponent(UITransform).convertToNodeSpaceAR(PhysicsSystem.instance.raycastResults[checkIdx].hitPoint))
      this.hitPoint.position = this.v3_1
      this.v3_1.set(Math.floor(this.v3_1.x + 0.5), this.curLayer, Math.floor(this.v3_1.z + 0.5))

      let action = this.curAction
      if (this.curAction == Terrain.ActionType.Add) {
        if (this.hitNode.position.equals(this.v3_1)) { action = this.curAction }
        else { action = Terrain.ActionType.Selected }
      }

      this.hitNode.position = this.v3_1
      if (Math.abs(this.hitNode.position.x) > 9 || Math.abs(this.hitNode.position.z) > 9) {
        this.hitMeshRenderer.setMaterial(LilliputAssetMgr.getMaterial('heart'), 0)
        action = Terrain.ActionType.Selected
      } else {
        this.hitMeshRenderer.setMaterial(LilliputAssetMgr.getMaterial('green'), 0)
      }
      return action
    }
    return Terrain.ActionType.None
  }

  private updateMapInfo(action: Terrain.EditAction) {
    let idx = terrainItemIdx(action.pos.x, action.pos.y, action.pos.z)
    switch (action.type) {
      case Terrain.ActionType.Add: {
        let info: Island.MapItem = {
          x: action.pos.x,
          y: action.pos.y,
          z: action.pos.z,
          prefab: this.curPropName,
          angle: 0
        }
        this.addTerrainItem(info)
        break
      }
      case Terrain.ActionType.Erase:
        if (this._mapInfo.has(idx)) {
          this._mapInfo.get(idx)!.node.active = false
          this._mapInfo.get(idx)!.node.destroy()
          this._mapInfo.delete(idx)
        }
        break
      case Terrain.ActionType.Rotate: {
        if (this._mapInfo.has(idx)) {
          let node = this._mapInfo.get(idx)!.node
          Quat.rotateY(this.q_rotation, node.rotation, Math.PI / 180 * action.angle)
          tween(node).to(0.3, { rotation: this.q_rotation }, {
            easing: 'linear',
            onComplete: () => {
              this._mapInfo.get(idx)!.info.angle += action.angle
            }
          }).start()
        }
        break
      }
      case Terrain.ActionType.Selected: {
        this._mapInfo.get(this.selectedItem)?.onSelected(false)
        this.selectedItem = idx
        this._mapInfo.get(this.selectedItem)?.onSelected(true)

        if (this._mapInfo.get(idx)?.skinnable) {
          this.skinBtnPos.set(action.pos)
          this.skinBtnPos.y += 3
          this.skinBtn.position = this.skinBtnPos
          this.skinBtn.active = true
          this.skinBtn.rotation = this.camera.node.rotation
        } else {
          IslandMgr.IslandEvent.customData = { show: false }
          this.node.dispatchEvent(IslandMgr.IslandEvent)

          this.skinBtn.active = false
          this.skinBtn.position = this.skinBtnPos
        }
        break
      }
    }
  }

  private addTerrainItem(info: Island.MapItem, preview: boolean = true) {
    this.loadCost = Date.now()
    if (info == null) return

    let idx = terrainItemIdx(info.x, info.y, info.z)
    let mgr = this._mapInfo.get(idx)

    if (mgr != null) {
      if (mgr.info.prefab == info.prefab) return

      mgr.node.active = false
      mgr.node.destroy()
      this._mapInfo.delete(idx)
    }

    let prefab = LilliputAssetMgr.getTerrainPrefab(info.prefab)

    if (prefab == null) {
      resources.load(`prefab/terrain/env/${info.prefab}`, Prefab, (err, data) => {
        try {
          LilliputAssetMgr.addTerrainPrefab(info.prefab, data)
          this.initTerrainItem(info, data, preview)
        } catch (err) {
          console.error(err, info.prefab)
        }
      })
    } else {
      this.initTerrainItem(info, prefab, preview)
    }
  }

  initTerrainItem(info: Island.MapItem, prefab: Prefab, preview: boolean = true) {
    let config = LilliputAssetMgr.getModelConfig(info.prefab)
    if (config == null) {
      return
    }

    let node = instantiate(prefab)
    node.getChildByName(info.prefab).position = Vec3.ZERO
    this.node.addChild(node)

    // if (config.group == Terrain.ModelGroup.Ground) {

    // } else {
    //   this.node.addChild(node)
    // }

    let mgr: TerrainItemMgr
    if (PropMgrs.has(config.name)) {
      let clazz = PropMgrs.get(config.name)
      mgr = node.addComponent(clazz)
    } else {
      if (config.skinnable) {
        mgr = node.addComponent(SkinnedTerrainItemMgr)
      } else {
        mgr = node.addComponent(TerrainItemMgr)
      }
    }
    mgr.init(info)
    if (!preview) mgr.apply()
    this.loadCost = (Date.now() - this.loadCost) / 1000
    this._mapInfo.set(mgr.index, mgr)
  }

  private convert2RemoteData() {
    let arr: Array<Island.MapItem> = []
    for (let item of this._mapInfo.values()) {
      if (item.info == null) continue
      arr.push(item.info)
    }

    arr.sort((a, b) => { return terrainItemIdx(a.x, a.y, a.z) - terrainItemIdx(b.x, b.y, b.z) })
    return arr
  }

  private async genOriginTerrain() {
    let infos: Array<Island.MapItem> = []
    for (let x = -1; x < 2; ++x) {
      for (let z = -1; z < 2; ++z) {
        let info: Island.MapItem = {
          x, y: 0, z, prefab: 'block', angle: 0
        }
        infos.push(info)
      }
    }
    let info: Island.MapItem = { x: 0, y: 1, z: 0, prefab: 'tree', angle: 0 }
    infos.push(info)
    let owner = await UserService.profile()
    this._senceInfo = await IslandApi.saveIsland(owner.id, infos)
  }

  private occlusion() {
    this.occlusionPos.set(this.myself.position)
    this.occlusionPos.y += 0.66
    this.node.getComponent(UITransform).convertToWorldSpaceAR(this.occlusionPos, this.worldPos)
    geometry.Ray.fromPoints(this._ray, this.camera.node.position, this.worldPos)
    // let distance = Vec3.distance(this.worldPos, this.camera.node.position)

    if (!PhysicsSystem.instance.raycast(this._ray)) return false

    this.curOcclusions = []
    let results = PhysicsSystem.instance.raycastResults
    results.sort((a, b) => { return a.distance - b.distance })
    for (let i = 0; i < results.length; ++i) {
      let item = results[i]
      if (item.collider.node.name == 'myself') break
      let clazz = PropMgrs.has(item.collider.node.name) ? PropMgrs.get(item.collider.node.name) : TerrainItemMgr
      let mgr: TerrainItemMgr = item.collider.node.getComponent(clazz)
      if (mgr) this.curOcclusions.push(mgr.index)
    }


    let tmp = this.lstOcclusions.filter((it) => {
      return !this.curOcclusions.includes(it)
    })

    tmp.forEach(it => { this._mapInfo.get(it)?.translucent(false) })

    for (let i = 0; i < this.curOcclusions.length; ++i) {
      // this.mapInfo.get(this.curOcclusions[i])?.translucent(true)
      // if (i == 0) {
      //   this.mapInfo.get(this.curOcclusions[i])?.translucent(true)
      // } else {
      //   this.mapInfo.get(this.curOcclusions[i])?.transparent()
      // }
    }

    this.lstOcclusions = this.curOcclusions
  }

}