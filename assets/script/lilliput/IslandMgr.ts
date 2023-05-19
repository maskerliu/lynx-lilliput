import {
  Camera, Component, Event, EventTouch, MeshRenderer, Node, PhysicsSystem, Quat, Touch, UITransform, Vec3,
  __private, _decorator, geometry, instantiate, quat, tween, v3
} from 'cc'
import { terrainItemIdx } from '../misc/Utils'
import { Game, GameApi } from '../model'
import BattleService from './BattleService'
import { TerrainEditAction, TerrainEditActionType, TerrainEditHandler } from './EnvEditHandler'
import IslandAssetMgr from './IslandAssetMgr'
import SkinnedTerrainItemMgr from './SkinnedTerrainItemMgr'
import TerrainItemMgr from './TerrainItemMgr'
import UserService from './UserService'
import CannonMgr from './prop/CannonMgr'
import CannonMobileMgr from './prop/CannonMobileMgr'
import CrateMgr from './prop/CrateMgr'
import DiceMgr from './prop/DiceMgr'
import FishPondMgr from './prop/FishPondMgr'
import LadderMgr from './prop/LadderMgr'
import LeverMgr from './prop/LeverMgr'
import MushroomMgr from './prop/MushroomMgr'
import RocksMgr from './prop/RocksMgr'
import SpikesMgr from './prop/SpikesMgr'


const { ccclass, property } = _decorator

export class IslandEvent extends Event {
  customData: boolean

  static Type = {
    SkinMenu: 'SkinMenu'
  }

  constructor(type: string, data: any) {
    super(type, true)

    this.customData = data
  }
}

export const PropMgrs: Map<string, __private._types_globals__Constructor<TerrainItemMgr>> = new Map()
const MIN_FRAME_TIME = 0.02

PropMgrs.set(CrateMgr.ItemName, CrateMgr)
PropMgrs.set(DiceMgr.ItemName, DiceMgr)
PropMgrs.set(LadderMgr.ItemName, LadderMgr)
PropMgrs.set(LeverMgr.ItemName, LeverMgr)
PropMgrs.set(MushroomMgr.ItemName, MushroomMgr)
PropMgrs.set(SpikesMgr.ItemName, SpikesMgr)
PropMgrs.set(RocksMgr.ItemName, RocksMgr)
PropMgrs.set(CannonMgr.ItemName, CannonMgr)
PropMgrs.set(CannonMobileMgr.ItemName, CannonMobileMgr)
PropMgrs.set(FishPondMgr.ItemName, FishPondMgr)

@ccclass('IslandMgr')
export default class IslandMgr extends Component implements TerrainEditHandler {

  @property(Node)
  private waterLayer: Node

  @property(Node)
  hitNode: Node

  @property(Node)
  private hitPoint: Node

  @property(Node)
  private skinBtn: Node

  @property(Node)
  private airWall: Node

  camera: Camera

  private _reactArea: Node
  set reactArea(node: Node) {
    if (this._reactArea && node != this._reactArea) {
      this.unRegisterEvent()
    }
    this._reactArea = node
  }

  private hitMeshRenderer: MeshRenderer

  private skinBtnPos = v3(0, -2, 0)
  private mapInfo: Map<number, TerrainItemMgr> = new Map()
  private _senceInfo: Game.Island = null
  get senceInfo() { return this._senceInfo }

  private orginPlayerPos = v3()
  private v3_0 = v3()
  private v3_1 = v3()
  private v3_2 = v3()
  private q_rotation = quat()
  private occlusionPos = v3()
  private worldPos = v3()

  // for map sence edit
  private _isEdit: boolean = false
  get isEdit() { return this._isEdit }
  set isEdit(val: boolean) {
    this._isEdit = val
  }

  private _ray: geometry.Ray = new geometry.Ray()
  private curAction: TerrainEditActionType = TerrainEditActionType.None
  private curLayer: number = 0
  private curPropName: string
  private curTerrainItemMgr: TerrainItemMgr = null
  private lstOcclusions: Array<number> = []
  private curOcclusions: Array<number> = []

  private static SkinMenuEvent: IslandEvent = new IslandEvent(IslandEvent.Type.SkinMenu, true)

  private loadCost = 0
  private loadCount = 0
  private frequency = 0

  onLoad() {
    this.hitMeshRenderer = this.hitNode.getComponentInChildren(MeshRenderer)
  }

  update(dt: number) {

    PhysicsSystem.instance.enable = !this.isEdit

    if (this.loadCount < this._senceInfo?.map.length) {
      if (dt > MIN_FRAME_TIME) return
      this.addTerrainItem(this._senceInfo?.map[this.loadCount])
      this.loadCount++

      // let rest = MIN_FRAME_TIME - this.loadCost
      // while (rest > 0.01) {
      //   this.addTerrainItem(this._senceInfo?.map[this.loadCount])
      //   this.loadCount++
      //   rest = rest - this.loadCost
      // }
    }

    if (BattleService.curIsland == null ||
      this._senceInfo == null ||
      BattleService.curIsland?.id != this._senceInfo?.id)
      return

    this.v3_0.set(BattleService.player().node.position)
    this.v3_0.x = Math.round(this.v3_0.x)
    this.v3_0.y = Math.round(this.v3_0.y - 1)
    this.v3_0.z = Math.round(this.v3_0.z)

    if (BattleService.player() != null && !this.v3_0.equals(this.airWall.position)) {
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

  async init(id?: string, uid?: string) {
    try {
      this._senceInfo = await GameApi.getIsland(id, uid)

      if (this._senceInfo.map == null || this.senceInfo.map.length == 0) {
        throw 'map is error'
      }
    } catch (err) {
      await this.genOriginTerrain()
    }

    for (let item of this.mapInfo.values()) {
      item.node.destroy()
    }
    this.mapInfo.clear()
    return this.senceInfo.id
  }

  async updateMap(info: Game.MapItem) {
    let idx = terrainItemIdx(info.x, info.y, info.z)
    if (info.prefab == null)
      this.mapInfo.delete(idx)
    else if (info.prefab != this.mapInfo.get(idx).info.prefab) {
      this.mapInfo.get(idx).node.removeFromParent()
      this.addTerrainItem(info)
    }

    // await GameApi.saveIsland(this.convert2RemoteData())
  }

  private updateAirWall(pos: Vec3) {
    this.airWall.position = pos
    this.airWall.children.forEach(it => {
      Vec3.add(this.v3_1, pos, it.position)
      let idx = terrainItemIdx(this.v3_1.x, this.v3_1.y - 1, this.v3_1.z)
      it.active = !this.mapInfo.has(idx)
    })
  }

  handleInteract(index: number, action: Game.CharacterState) {
    let item = this.mapInfo.get(index)
    if (item == null) return
    item.interact(action)
  }

  canEdit(uid: string) {
    return uid == this._senceInfo.owner
  }

  async onEditModeChanged() {
    this.airWall.active = !this._isEdit
    this.hitNode.active = this._isEdit
    this.hitPoint.active = this._isEdit
    this.waterLayer.active = this._isEdit
    this.skinBtn.active = this._isEdit
    this.curLayer = 0

    let world: any = PhysicsSystem.instance.physicsWorld
    this.hitNode.position.set(0, -2, 0)
    this.skinBtn.position.set(0, -2, 0)
    this.hitPoint.position.set(0, -2, 0)
    this.curTerrainItemMgr?.node?.destroy()
    this.curPropName = null
    this.curTerrainItemMgr = null
    if (this._isEdit) {
      this.curLayer = 0
      this.curAction = TerrainEditActionType.Selected
      this.orginPlayerPos.set(BattleService.player().node.position)
      this.waterLayer.position.set(0, this.curLayer + 0.5, 0)

      BattleService.player().onEditModel(this._isEdit, this.orginPlayerPos.x, this.curLayer + 1.5, this.orginPlayerPos.z)
      for (let mgr of this.mapInfo.values()) {
        mgr.preview(mgr.info.y > this.curLayer)
      }
      this.registerEvent()
    } else {

      BattleService.player().onEditModel(this._isEdit, this.orginPlayerPos.x, this.orginPlayerPos.y, this.orginPlayerPos.z)

      for (let mgr of this.mapInfo.values()) { mgr.apply() }

      let owner = await UserService.profile()
      await GameApi.saveIsland(owner.id, this.convert2RemoteData())

      this.unRegisterEvent()
    }
  }

  onEditItemChanged(name: string): void {
    if (this.curPropName == name) return


    try {

      if (this.curTerrainItemMgr) {
        if (this.curTerrainItemMgr.node == null) {
          this.curTerrainItemMgr = null
        } else {
          this.curTerrainItemMgr.node.destroy()
          this.curTerrainItemMgr = null
        }
      }

      this.curPropName = name
      let info: Game.MapItem = { x: 0, y: -2, z: 0, prefab: name, angle: 0 }
      this.curTerrainItemMgr = this.addTerrainItem(info)
    } catch (err) {
      console.error(err)
      console.error(name)
    }

  }

  onEditActionChanged(type: TerrainEditActionType): void {
    this.curAction = type
  }

  onEditLayerChanged(layer: number): void {
    this.curLayer = layer
    let pos = v3(0, layer, 0)
    pos.y = this.curLayer + 0.1
    tween(this.waterLayer).to(0.5, { position: pos }, { easing: 'linear' }).start()

    pos.set(this.orginPlayerPos)
    pos.y = layer + 1
    tween(BattleService.player().node).to(0.5, { position: pos }, { easing: 'linear' }).start()

    for (let mgr of this.mapInfo.values()) {
      mgr.translucent(mgr.info.y > layer)
    }
  }

  onRotate(angle: number): void {
    let action: TerrainEditAction = {
      pos: this.hitNode.position,
      type: TerrainEditActionType.Rotate,
      angle
    }
    this.updateMapInfo(action)
  }

  onSkinChanged(skin: string) {
    for (let mgr of this.mapInfo.values()) {
      if (!mgr.isSelected) { continue }
      (mgr as SkinnedTerrainItemMgr).updateSkin(skin)
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
    this._reactArea.off(Node.EventType.TOUCH_START, this.onTouchStart, this)
    this._reactArea.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
    this._reactArea.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)
    this._reactArea.off(Node.EventType.TOUCH_END, this.onTouchEnd, this)
    this._reactArea.off(Node.EventType.MOUSE_MOVE, this.onTouchMove, this)
  }

  private onTouchStart(event: EventTouch) {
    if (!this.isEdit) return
  }

  private onTouchMove(event: EventTouch) {
    if (!this.isEdit) return
  }

  private onTouchEnd(event: EventTouch) {
    if (!this.isEdit) return
    let selected = this.selectGirdItem(event.touch)

    if (selected == TerrainEditActionType.None && this.curAction != TerrainEditActionType.Selected) return
    if (this.curAction == TerrainEditActionType.Rotate || this.curAction == TerrainEditActionType.None) return
    let type = this.curAction == TerrainEditActionType.Add_Preview ? TerrainEditActionType.Add_Done : this.curAction
    type = selected == TerrainEditActionType.Selected ? type : TerrainEditActionType.Selected
    this.updateMapInfo({ pos: this.hitNode.position, type, angle: 0 })
  }

  private selectGirdItem(touch: Touch): TerrainEditActionType {
    this.camera.screenPointToRay(touch.getLocationX(), touch.getLocationY(), this._ray)

    if (!PhysicsSystem.instance.raycast(this._ray, 0xffffffff, 500)) {
      console.warn('no hit')
      return TerrainEditActionType.None
    }
    let onSkin = -1, onSelected = -1
    for (let i = 0; i < PhysicsSystem.instance.raycastResults.length; i++) {
      let item = PhysicsSystem.instance.raycastResults[i]
      let pos = this.node.getComponent(UITransform).convertToNodeSpaceAR(item.hitPoint)

      if (item.collider.node.name == 'SkinBtn') {
        onSkin = i
        continue
      }

      pos.x = Math.floor(pos.x + 0.5)
      pos.y = Math.floor(this.curLayer)
      pos.z = Math.floor(pos.z + 0.5)

      if (this.hitNode.position.equals(pos)) {
        onSelected = i
      }
    }

    if (onSkin != -1) {
      IslandMgr.SkinMenuEvent.customData = true
      this.node.dispatchEvent(IslandMgr.SkinMenuEvent)
      return TerrainEditActionType.None
    }
    IslandMgr.SkinMenuEvent.customData = false
    this.node.dispatchEvent(IslandMgr.SkinMenuEvent)

    let item = PhysicsSystem.instance.raycastResults[onSelected == -1 ? 0 : onSelected]
    let pos = this.node.getComponent(UITransform).convertToNodeSpaceAR(item.hitPoint)
    this.hitPoint.position = pos
    pos.x = Math.floor(pos.x + 0.5)
    pos.y = Math.floor(this.curLayer)
    pos.z = Math.floor(pos.z + 0.5)
    this.hitNode.position = pos

    // 超出边界
    if (Math.abs(this.hitNode.position.x) > 9 || Math.abs(this.hitNode.position.z) > 9) {
      this.hitMeshRenderer.setMaterial(IslandAssetMgr.getMaterial('heart-translucent'), 0)
      return TerrainEditActionType.None
    } else {
      this.hitMeshRenderer.setMaterial(IslandAssetMgr.getMaterial('grass-translucent'), 0)
    }

    return onSelected == -1 ? TerrainEditActionType.None : TerrainEditActionType.Selected
  }

  private updateMapInfo(action: TerrainEditAction) {
    let idx = terrainItemIdx(action.pos.x, action.pos.y, action.pos.z)
    switch (action.type) {
      case TerrainEditActionType.Add_Preview: {
        this.curTerrainItemMgr.updatePosition(action.pos)
        return
      }
      case TerrainEditActionType.Add_Done: {
        if (this.curTerrainItemMgr == null) {
          let info: Game.MapItem = { x: 0, y: -2, z: 0, prefab: this.curPropName, angle: 0 }
          this.curTerrainItemMgr = this.addTerrainItem(info)
        }

        let mgr = this.mapInfo.get(idx)

        if (mgr) {
          if (mgr.info.prefab == this.curPropName) {
            return
          } else {
            mgr.node.destroy()
          }
        }
        if (this.curTerrainItemMgr == null) {
          console.warn(this.curPropName, action.pos)
          return
        }

        this.curTerrainItemMgr.updatePosition(action.pos)
        this.mapInfo.set(idx, this.curTerrainItemMgr)
        this.curTerrainItemMgr = null
        break
      }
      case TerrainEditActionType.Erase:
        if (this.mapInfo.has(idx)) {
          this.mapInfo.get(idx)!.node.active = false
          this.mapInfo.get(idx)!.node.destroy()
          this.mapInfo.delete(idx)
        }
        break
      case TerrainEditActionType.Rotate: {
        if (this.mapInfo.has(idx)) {
          let node = this.mapInfo.get(idx)!.node
          Quat.rotateY(this.q_rotation, node.rotation, Math.PI / 180 * action.angle)
          tween(node).to(0.3, { rotation: this.q_rotation }, {
            easing: 'linear',
            onComplete: () => {
              this.mapInfo.get(idx)!.info.angle += action.angle
            }
          }).start()
        }
        break
      }
      case TerrainEditActionType.Selected: {
        for (let key of this.mapInfo.keys()) {
          this.mapInfo.get(key).onSelected(idx == key)
        }

        if (this.mapInfo.has(idx) && this.mapInfo.get(idx).skinnable) {
          this.skinBtnPos.set(action.pos)
          this.skinBtnPos.y += 3
          this.skinBtn.position = this.skinBtnPos
          this.skinBtn.active = true
        } else {
          this.skinBtn.active = false
          this.skinBtn.position = this.skinBtnPos
        }

        break
      }
    }
  }

  private addTerrainItem(info: Game.MapItem) {
    this.loadCost = Date.now()
    if (info == null) return
    let prefab = IslandAssetMgr.getPrefab(info.prefab)
    let config = IslandAssetMgr.getModelConfig(info.prefab)
    if (prefab == null) return

    let node = instantiate(prefab)
    node.position.set(info.x, info.y, info.z)
    Quat.rotateY(this.q_rotation, node.rotation, Math.PI / 180 * info.angle)
    node.rotation = this.q_rotation
    this.node.addChild(node)

    let mgr: TerrainItemMgr

    if (PropMgrs.has(config.name)) {
      let clazz = PropMgrs.get(config.name)
      mgr = node.addComponent(clazz)
    } else {
      if (config.skin == 1) {
        mgr = node.addComponent(SkinnedTerrainItemMgr)
      } else {
        mgr = node.addComponent(TerrainItemMgr)
      }
    }

    mgr.init(info)
    this.loadCost = (Date.now() - this.loadCost) / 1000

    if (info.y >= 0) {
      node.active = true
      this.mapInfo.set(mgr.index, mgr)
      return null
    } else {
      return mgr
    }
  }

  private convert2RemoteData() {
    let arr: Array<Game.MapItem> = []
    for (let item of this.mapInfo.values()) {
      if (item.info == null) continue
      arr.push(item.info)
    }

    arr.sort((a, b) => { return terrainItemIdx(a.x, a.y, a.z) - terrainItemIdx(b.x, b.y, b.z) })
    return arr
  }

  private async genOriginTerrain() {
    let infos: Array<Game.MapItem> = []
    for (let x = -1; x < 2; ++x) {
      for (let z = -1; z < 2; ++z) {
        let info: Game.MapItem = {
          x, y: 0, z, prefab: 'block', angle: 0
        }
        infos.push(info)
      }
    }
    let info: Game.MapItem = { x: 0, y: 1, z: 0, prefab: 'tree', angle: 0 }
    infos.push(info)
    let owner = await UserService.profile()
    this._senceInfo = await GameApi.saveIsland(owner.id, infos)
  }

  private occlusion() {
    this.occlusionPos.set(BattleService.player().node.position)
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

    tmp.forEach(it => { this.mapInfo.get(it)?.translucent(false) })

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