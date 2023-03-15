import {
  Camera, Component, Event, EventTouch, geometry, instantiate,
  MeshRenderer,
  Node, PhysicsSystem, Quat, quat, Touch, tween, UITransform, v3, Vec3, _decorator
} from 'cc'
import BattleService from './BattleService'
const { ccclass, property } = _decorator

import { TerrainEditAction, TerrainEditActionType, TerrainEditHandler } from './EnvEditHandler'
import { terrainItemIdx } from './misc/Utils'
import { Game, GameApi } from './model'
import LadderMgr from './prop/LadderMgr'
import LeverMgr from './prop/LeverMgr'
import SpikesMgr from './prop/SpikesMgr'
import IslandAssetMgr from './IslandAssetMgr'
import TerrainItemMgr from './TerrainItemMgr'
import SkinnedTerrainItemMgr from './SkinnedTerrainItemMgr'
import DiceMgr from './prop/DiceMgr'
import CrateMgr from './prop/CrateMgr'
import MushroomMgr from './prop/MushroomMgr'
import RocksMgr from './prop/RocksMgr'


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

const PropMgrs: Map<string, any> = new Map()

PropMgrs.set(CrateMgr.ItemName, CrateMgr)
PropMgrs.set(DiceMgr.ItemName, DiceMgr)
PropMgrs.set(LadderMgr.ItemName, LadderMgr)
PropMgrs.set(LeverMgr.ItemName, LeverMgr)
PropMgrs.set(MushroomMgr.ItemName, MushroomMgr)
PropMgrs.set(SpikesMgr.ItemName, SpikesMgr)
PropMgrs.set(RocksMgr.ItemName, RocksMgr)

@ccclass('IslandMgr')
export default class IslandMgr extends Component implements TerrainEditHandler {

  @property(Node)
  private checkLayer: Node

  @property(Node)
  private waterLayer: Node

  @property(Node)
  hitNode: Node

  @property(Node)
  private hitPoint: Node

  @property(Node)
  private block: Node

  @property(Node)
  private skinBtn: Node

  @property(Node)
  private airWall: Node

  camera: Camera
  editReactArea: Node

  private hitMeshRenderer: MeshRenderer

  private skinBtnPos = v3(0, -10, 0)
  private mapInfo: Map<number, TerrainItemMgr> = new Map()
  private _senceInfo: Game.Island = null
  get senceInfo() { return this._senceInfo }

  // private player: PlayerMgr
  private orginPlayerPos = v3()
  private v3_0 = v3()
  private v3_1 = v3()
  private q_rotation = quat()
  private occlusionPos = v3()
  private worldPos = v3()

  // for map sence edit
  private _isEdit: boolean = false
  private _ray: geometry.Ray = new geometry.Ray()
  private curAction: TerrainEditActionType = TerrainEditActionType.None
  private curLayer: number = 0
  private curPropName: string
  private curTerrainItemMgr: TerrainItemMgr = null
  private lstOcclusions: Array<number> = []
  private curOcclusions: Array<number> = []

  private static SkinMenuEvent: IslandEvent = new IslandEvent(IslandEvent.Type.SkinMenu, true)

  onLoad() {
    this.hitMeshRenderer = this.hitNode.getComponentInChildren(MeshRenderer)
  }

  update(dt: number) {

    if (BattleService.curIsland == null || this._senceInfo == null) return

    if (BattleService.curIsland?._id == this._senceInfo?._id) {
      this.v3_0.set(BattleService.player().node.position)
      this.v3_0.x = Math.round(this.v3_0.x)
      this.v3_0.y = Math.round(this.v3_0.y)
      this.v3_0.z = Math.round(this.v3_0.z)

      if (BattleService.player() != null && !this.v3_0.equals(this.airWall.position)) {
        this.updateAirWall(this.v3_0)
      }

      if (!this._isEdit) this.occlusion()
    }
  }

  async loadMap(uid?: string) {
    try {
      this._senceInfo = await GameApi.getUserIsland(uid)

      if (this.senceInfo.map == null || this.senceInfo.map.length == 0) {
        throw 'map is error'
      }
    } catch (err) {
      await this.genOriginTerrain()
    }

    for (let item of this.mapInfo.values()) {
      item.node.destroy()
    }

    this.senceInfo.map.forEach(it => {
      this.addTerrainItem(it)

    })

    return this.senceInfo._id
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

  async onEditModeChanged(isEdit: boolean) {
    this._isEdit = isEdit
    this.airWall.active = !isEdit
    this.checkLayer.active = isEdit
    this.hitNode.active = isEdit
    this.hitPoint.active = isEdit
    this.waterLayer.active = isEdit
    this.skinBtn.active = isEdit

    BattleService.player().onEditModel(isEdit)

    if (isEdit) {
      this.curLayer = 0
      this.curAction = TerrainEditActionType.Selected
      this.curPropName = null
      this.curTerrainItemMgr = null
      this.orginPlayerPos.set(BattleService.player().node.position)

      this.checkLayer.position.set(0, this.curLayer, 0)
      this.waterLayer.position.set(0, this.curLayer + 0.5, 0)
      this.hitNode.position.set(0, -2, 0)
      this.hitPoint.position.set(0, -2, 0)

      BattleService.player().node.position.set(this.orginPlayerPos.x, this.curLayer + 1, this.orginPlayerPos.z)
      for (let mgr of this.mapInfo.values()) {
        mgr.translucent(mgr.info.y > this.curLayer)
        mgr.preview()
      }
      this.registerEvent()
    } else {
      BattleService.player().node.position = this.orginPlayerPos

      for (let key of this.mapInfo.keys()) {
        this.mapInfo.get(key).apply()
      }

      await GameApi.saveIsland(this.convert2RemoteData())

      this.unRegisterEvent()
    }
  }

  onEditItemChanged(name: string): void {
    if (this.curPropName == name) return

    if (this.curTerrainItemMgr) {
      this.curTerrainItemMgr.node.destroy()
    }

    this.curPropName = name
    let info: Game.MapItem = { x: 0, y: -10, z: 0, prefab: name, angle: 0 }
    this.addTerrainItem(info)
  }

  onEditActionChanged(type: TerrainEditActionType): void {
    this.curAction = type
  }

  onEditLayerChanged(layer: number): void {
    this.curLayer = layer
    let pos = v3(this.checkLayer.position)
    pos.y = layer
    this.checkLayer.position = pos

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
    this.editReactArea.on(Node.EventType.TOUCH_START, this.onTouchStart, this)
    this.editReactArea.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
    this.editReactArea.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)
    this.editReactArea.on(Node.EventType.TOUCH_END, this.onTouchEnd, this)
    this.editReactArea.on(Node.EventType.MOUSE_MOVE, this.onTouchMove, this)
  }

  private unRegisterEvent() {
    this.editReactArea.off(Node.EventType.TOUCH_START, this.onTouchStart, this)
    this.editReactArea.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
    this.editReactArea.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)
    this.editReactArea.off(Node.EventType.TOUCH_END, this.onTouchEnd, this)
    this.editReactArea.off(Node.EventType.MOUSE_MOVE, this.onTouchMove, this)
  }

  private onTouchStart(event: EventTouch) {

  }

  private onTouchMove(event: EventTouch) {

  }

  private onTouchEnd(event: EventTouch) {
    let selected = this.selectGirdItem(event.touch)

    if (selected == TerrainEditActionType.None && this.curAction != TerrainEditActionType.Selected) return
    if (this.curAction == TerrainEditActionType.Rotate || this.curAction == TerrainEditActionType.None) return
    let type = this.curAction == TerrainEditActionType.Add_Preview ? TerrainEditActionType.Add_Done : this.curAction
    type = selected == TerrainEditActionType.Selected ? type : TerrainEditActionType.Selected
    this.updateMapInfo({ pos: this.hitNode.position, type, angle: 0 })
  }

  private selectGirdItem(touch: Touch): TerrainEditActionType {
    this.camera.screenPointToRay(touch.getLocationX(), touch.getLocationY(), this._ray)

    if (!PhysicsSystem.instance.raycast(this._ray, 0xffffffff, 500)) return TerrainEditActionType.None

    // PhysicsSystem.instance.raycastResults.forEach(it => { console.log(it.collider.node.name) })

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
          let info: Game.MapItem = { x: 0, y: -10, z: 0, prefab: this.curPropName, angle: 0 }
          this.addTerrainItem(info)
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
          console.log(this.curPropName, action.pos)
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

        if (this.mapInfo.has(idx) && this.mapInfo.get(idx).hasSkin) {
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
    if (info == null) return
    let prefab = IslandAssetMgr.getPrefab(info.prefab)
    let config = IslandAssetMgr.getModelConfig(info.prefab)
    if (prefab == null) return

    let node = instantiate(prefab)
    node.position = v3(info.x, info.y, info.z)
    Quat.rotateY(this.q_rotation, node.rotation, Math.PI / 180 * info.angle)
    node.rotation = this.q_rotation
    this.node.addChild(node)

    let mgr: TerrainItemMgr

    if (PropMgrs.has(config.name)) {
      let clazz = PropMgrs.get(config.name)
      node.addComponent(clazz)
      mgr = node.getComponent(clazz)
    } else {
      if (config.skin == 1) {
        node.addComponent(SkinnedTerrainItemMgr)
        mgr = node.getComponent(SkinnedTerrainItemMgr)
      } else {
        node.addComponent(TerrainItemMgr)
        mgr = node.getComponent(TerrainItemMgr)
      }
    }

    // switch (config.name) {
    //   case 'lever':
    //     node.addComponent(LeverMgr)
    //     mgr = node.getComponent(LeverMgr)
    //     break
    //   case 'spikes':
    //     node.addComponent(SpikesMgr)
    //     mgr = node.getComponent(SpikesMgr)
    //     break
    //   case 'ladder':
    //     node.addComponent(LadderMgr)
    //     mgr = node.getComponent(LadderMgr)
    //     break
    //   case 'dice':
    //     node.addComponent(DiceMgr)
    //     mgr = node.getComponent(DiceMgr)
    //     break
    //   case 'crate':
    //     node.addComponent(CrateMgr)
    //     mgr = node.getComponent(CrateMgr)
    //     break
    //   default:
    //     break
    // }

    mgr.init(info)

    if (info.y >= 0) {
      node.active = true
      this.mapInfo.set(mgr.index, mgr)
    }
    else {
      node.active = false
      this.curTerrainItemMgr = mgr
    }
  }

  private convert2RemoteData() {
    let arr: Array<Game.MapItem> = []
    for (let item of this.mapInfo.values()) {
      if (item.info == null) continue
      arr.push(item.info)
    }
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
    this._senceInfo = await GameApi.saveIsland(infos)
  }

  private occlusion() {
    this.occlusionPos.set(BattleService.player().node.position)
    this.occlusionPos.y += 0.3
    this.node.getComponent(UITransform).convertToWorldSpaceAR(this.occlusionPos, this.worldPos)
    geometry.Ray.fromPoints(this._ray, this.camera.node.position, this.worldPos)
    let distance = Vec3.distance(this.worldPos, this.camera.node.position)

    if (!PhysicsSystem.instance.raycast(this._ray, 0xffffffff, distance)) return false

    this.curOcclusions = []
    for (let i = 0; i < PhysicsSystem.instance.raycastResults.length; ++i) {
      let item = PhysicsSystem.instance.raycastResults[i]
      // if (item.collider.node.name == 'Player') break
      let mgr = item.collider.node.getComponent(TerrainItemMgr)
      if (mgr) this.curOcclusions.push(mgr.index)
    }


    let tmp = this.lstOcclusions.filter((it) => {
      return !this.curOcclusions.includes(it)
    })

    tmp.forEach(it => { this.mapInfo.get(it)?.translucent(false) })
    this.curOcclusions.forEach(it => { this.mapInfo.get(it)?.translucent(true) })
    this.lstOcclusions = this.curOcclusions
  }

}