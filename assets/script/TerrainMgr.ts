import {
  Camera, Component, Event, EventTouch, geometry, instantiate,
  Node, PhysicsSystem, Prefab, Quat, quat, resources,
  TerrainAsset,
  Touch, tween, UITransform, v3, Vec3, _decorator
} from 'cc'
const { ccclass, property } = _decorator

import { TerrainEditAction, TerrainEditActionType, TerrainEditHandler } from './EnvEditHandler'
import { Game, GameApi, Terrain } from './model'
import TerrainItemMgr from './TerrainItemMgr'
import TerrainAssetMgr from './TerrainAssetMgr'
import OrbitCamera from './OrbitCamera'
import PlayerMgr from './PlayerMgr'



export class SkinMenuEvent extends Event {
  constructor(name: string, bubbles?: boolean) {
    super(name, bubbles)
  }
}

const MAP_X = 20
const MAP_Z = 20
const MAP_Y = 4

@ccclass('TerrainMgr')
export default class TerrainMgr extends Component implements TerrainEditHandler {

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


  private player: PlayerMgr
  private orginPlayerPos = v3()
  private skinBtnPos = v3(0, -10, 0)

  camera: Camera
  editReactArea: Node

  private mapInfo: Map<number, TerrainItemMgr> = new Map()
  private _senceInfo: Game.Island = null
  get senceInfo() { return this._senceInfo }

  // for map sence edit
  private _ray: geometry.Ray = new geometry.Ray()
  private curAction: TerrainEditActionType = TerrainEditActionType.None
  private curLayer: number = 0
  private curPropName: string
  private curTerrainItemMgr: TerrainItemMgr = null

  async loadMap(uid?: string) {
    try {
      this._senceInfo = await GameApi.getUserIsland(uid)

      if (this.senceInfo.map == null || this.senceInfo.map.length == 0) {
        throw 'no map, need system auto generate map'
      }

      for (let item of this.mapInfo.values()) {
        item.node.destroy()
      }

      this.senceInfo.map.forEach(it => {
        this.addTerrainItem(it)
      })

      return this.senceInfo._id
    } catch (err) {
      this.genOriginTerrain()
      console.error(err)
    }
  }

  check(node: Node) {
    let forward = node.forward
    // let ray = geometry.Ray.

    // let layer = Math.floor(pos.y)
    // this.mapInfo
  }

  shake(dir: Vec3) {
    this.mapInfo.forEach(it => {
      if (it.config.name == 'tree') {
        it.shake(dir)
      }
    })
  }

  onEditModeChanged(isEdit: boolean) {
    this.checkLayer.active = isEdit
    this.hitNode.active = isEdit
    this.hitPoint.active = isEdit

    let pos = v3()
    if (isEdit) {
      this.curLayer = 0
      this.curAction = TerrainEditActionType.Selected
      this.curPropName = null
      this.curTerrainItemMgr = null
      this.player = this.getComponentInChildren(PlayerMgr)
      this.waterLayer.active = true
      this.orginPlayerPos.set(this.player.node.position)

      pos.y = this.curLayer
      this.checkLayer.position = pos
      pos.y = this.curLayer + 0.5
      this.waterLayer.position = pos

      pos.y = -2
      this.hitNode.position = pos
      this.hitPoint.position = pos

      pos.set(this.orginPlayerPos)
      pos.y = this.curLayer + 1
      this.player.node.position = pos

      for (let mgr of this.mapInfo.values()) {
        mgr.translucent(mgr.info.y > this.curLayer)
        mgr.preview()
      }
      this.registerEvent()
    } else {
      this.waterLayer.active = false
      this.player.node.position = this.orginPlayerPos
      this.player = null

      for (let key of this.mapInfo.keys()) {
        this.mapInfo.get(key).apply()
      }

      GameApi.saveIsland(this.convert2RemoteData())

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
    pos.y = this.curLayer
    this.checkLayer.position = pos

    pos.y = this.curLayer + 0.2
    tween(this.waterLayer).to(0.5, { position: pos }, { easing: 'linear' }).start()

    pos.set(this.orginPlayerPos)
    pos.y = layer + 1
    tween(this.player.node).to(0.5, { position: pos }, { easing: 'linear' }).start()

    for (let mgr of this.mapInfo.values()) {
      mgr.translucent(mgr.info.y != layer)
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
      mgr.updateSkin(skin)
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
    if (this.curAction == TerrainEditActionType.Rotate || this.curAction == TerrainEditActionType.None) return
    let type = this.curAction == TerrainEditActionType.Add_Preview ? TerrainEditActionType.Add_Done : this.curAction
    type = selected ? type : TerrainEditActionType.Selected
    this.updateMapInfo({ pos: this.hitNode.position, type, angle: 0 })
  }

  private selectGirdItem(touch: Touch): boolean {
    this.camera.screenPointToRay(touch.getLocationX(), touch.getLocationY(), this._ray)

    if (!PhysicsSystem.instance.raycast(this._ray, 0xffffffff, 500)) return false

    for (let i = 0; i < PhysicsSystem.instance.raycastResults.length; i++) {
      const item = PhysicsSystem.instance.raycastResults[i]
      let pos = this.node.getComponent(UITransform).convertToNodeSpaceAR(item.hitPoint)
      this.hitPoint.position = pos

      if (item.collider.node.name == 'SkinBtn') {
        this.node.dispatchEvent(new SkinMenuEvent('ShowSkinMenu', true))
        return false
      }

      pos.x = Math.floor(pos.x + 0.5)
      pos.y = Math.floor(this.curLayer)
      pos.z = Math.floor(pos.z + 0.5)

      if (this.hitNode.position.equals(pos)) {
        return true
      }


      this.hitNode.position = pos
      return false
    }
  }

  private updateMapInfo(action: TerrainEditAction) {
    let idx = this.convertIndex(action.pos.x, action.pos.y, action.pos.z)
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

        let mapNode = this.mapInfo.get(idx)
        if (mapNode && mapNode.info.prefab == this.curPropName) {
          return
        } else {
          if (mapNode) { mapNode.node.destroy() }
        }

        this.curTerrainItemMgr.updatePosition(action.pos)
        this.mapInfo.set(idx, this.curTerrainItemMgr)
        this.curTerrainItemMgr = undefined
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
          let rotation = quat()
          Quat.rotateY(rotation, node.rotation, Math.PI / 180 * action.angle)
          tween(node).to(0.3, { rotation }, {
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
        } else {
          this.skinBtnPos.y = -10
          this.skinBtn.position = this.skinBtnPos
        }

        break
      }
    }
  }

  private convertIndex(x: number, y: number, z: number) {
    let x0 = MAP_X / 2 + x
    let z0 = MAP_Z / 2 + z
    return x0 + z0 * MAP_X + y * MAP_Z * MAP_X
  }

  private addTerrainItem(info: Game.MapItem) {
    let prefab = TerrainAssetMgr.getPrefab(info.prefab)
    if (prefab == null) return

    let node = instantiate(prefab)
    node.position = v3(info.x, info.y, info.z)
    let rotation = quat()
    Quat.rotateY(rotation, node.rotation, Math.PI / 180 * info.angle)
    node.rotation = rotation
    this.node.addChild(node)
    node.addComponent(TerrainItemMgr)
    let mgr = node.getComponent(TerrainItemMgr)
    mgr.init(info)

    if (info.y >= 0) { this.mapInfo.set(mgr.index, mgr) }
    else { this.curTerrainItemMgr = mgr }
  }

  private convert2RemoteData() {
    let arr: Array<Game.MapItem> = []
    for (let item of this.mapInfo.values()) {
      arr.push(item.info)
    }
    return arr
  }

  private genOriginTerrain() {
    for (let x = -1; x < 2; ++x) {
      for (let z = -1; z < 2; ++z) {
        let info: Game.MapItem = {
          x, y: 0, z, prefab: 'block', angle: 0
        }
        this.addTerrainItem(info)
      }
    }

    let info: Game.MapItem = { x: 0, y: 1, z: 0, prefab: 'tree', angle: 0 }
    this.addTerrainItem(info)
  }
}