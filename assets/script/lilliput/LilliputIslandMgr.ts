import { BatchingUtility, Camera, EventTouch, MeshRenderer, Node, PhysicsSystem, Touch, UITransform, Vec2, _decorator, geometry, quat, tween, v3 } from 'cc'
import { BigWorld } from '../common/BigWorld'
import OrbitCamera from '../common/OrbitCamera'
import { isDebug, terrainItemIdx } from '../misc/Utils'
import { Game, Island, IslandApi } from '../model'
import LilliputAssetMgr from './LilliputAssetMgr'

const { ccclass, property } = _decorator

const SkinMenuEvent = new BigWorld.IslandEvent(BigWorld.IslandEvent.Type.SkinMenu)


@ccclass('LilliputIslandMgr')
export default class LilliputIslandMgr extends BigWorld.IslandMgr {

  @property(Node)
  private checkLayer: Node

  @property(Node)
  private hitNode: Node

  @property(Node)
  private hitPoint: Node

  @property(Node)
  private anchorNode: Node

  get curAnchorNode() {
    return this._isEdit ? this.anchorNode : this.myself.node
  }

  @property(Node)
  private skinBtn: Node

  @property(Node)
  private staticNodeGroup: Node

  @property(Node)
  private mergedNodeGroup: Node

  private _isMove = false

  camera: Camera

  private _reactArea: Node
  set reactArea(node: Node) { this._reactArea = node }

  private hitMeshRenderer: MeshRenderer

  private skinBtnPos = v3(0, -2, 0)
  private _mapInfo: Map<number, BigWorld.MapItemMgr> = new Map()
  mapInfo(idx: number) { return this._mapInfo.get(idx) }

  private _senceInfo: Island.Island = null
  get senceInfo() { return this._senceInfo }

  private orginPlayerPos = v3()
  private v3_0 = v3()
  private q_skinBtn = quat()

  // for map sence edit
  private _isEdit: boolean = false
  get isEdit() { return this._isEdit }

  private _ray: geometry.Ray = new geometry.Ray()
  private curAction: BigWorld.ActionType = BigWorld.ActionType.None
  private curLayer: number = 0
  private curPropId: number
  private selectedItem: number
  private myself: BigWorld.PlayerMgr

  onLoad() {
    this.hitMeshRenderer = this.hitNode.getComponentInChildren(MeshRenderer)
    this.q_skinBtn.set(this.skinBtn.rotation)
  }

  protected onDestroy(): void {
    this._mapInfo.clear()
    this._senceInfo = null
  }

  async init(camera: Camera, id?: string, uid?: string) {
    this.camera = camera
    try {
      this._senceInfo = await IslandApi.getIsland(id, uid)

      if (this._senceInfo.info == null || this.senceInfo.info.length == 0) {
        throw 'map is error'
      }

      for (let item of this._mapInfo.values()) {
        item.node.destroy()
      }

      for (let i = 0; i < this._senceInfo.info.length; ++i) {
        try {
          this.addTerrainItem(this._senceInfo.info[i], false)
        } catch (err) {
          console.error(this._senceInfo.info[i], i)
        }
      }

      // let arr: Map<number, Array<number>> = new Map()
      // for (let i = 0; i < this._senceInfo.info.length; ++i) {
      //   let info = this._senceInfo.info[i]
      //   let idx = terrainItemIdx(info[1], info[2], info[3])
      //   if (arr.has(idx)) {
      //     console.log(i, arr.get(idx))
      //     console.log(this._senceInfo.info[i])
      //   } else {
      //     arr.set(idx, this._senceInfo.info[i])
      //   }
      // }

      this.schedule(this.batchStatic, 0.02)

      this._isEdit = false
      this.initIsland()
    } catch (err) {
      console.log(err)
    }

    this.node.getChildByName('Range').active = isDebug
  }

  private batchStatic() {
    let loaded = 0
    this._mapInfo?.forEach(it => { if (it.loaded) loaded++ })
    if (this._senceInfo.info.length == loaded) {
      // BatchingUtility.batchStaticModel(this.staticNodeGroup, this.mergedNodeGroup)
      this.unschedule(this.batchStatic)
    }
  }

  handleInteract(index: number, action: Game.CharacterState) {
    let item = this._mapInfo.get(index)
    if (item == null) return
    item.interact(action)
  }

  canEdit(uid: string) {
    return uid == this._senceInfo.owner
  }

  enablePhysic(enable: boolean) {
    this._mapInfo.forEach(it => { it.enablePhysic(enable) })
  }

  private initIsland() {
    SkinMenuEvent.customData = { show: false }
    this.node.dispatchEvent(SkinMenuEvent)

    this.hitNode.active = this._isEdit
    this.hitPoint.active = this._isEdit
    this.anchorNode.active = this._isEdit
    this.checkLayer.active = this._isEdit
    this.skinBtn.active = this._isEdit
    this.curLayer = 0

    this.hitNode.position.set(0, -2, 0)
    this.skinBtn.position.set(0, -2, 0)
    this.hitPoint.position.set(0, -2, 0)
    this.curPropId = -1
    if (this._isEdit) {
      this.curLayer = 0
      this.curAction = BigWorld.ActionType.Selected
      this.checkLayer.position = v3(0, this.curLayer + 1, 0)
      this.registerEvent()
    } else {
      this.unRegisterEvent()
    }
  }

  async onEditModeChanged() {
    this._isEdit = !this._isEdit
    this.initIsland()

    this.myself = this.node.getChildByName('myself').getComponent('MyselfMgr') as BigWorld.PlayerMgr
    if (this.myself) {
      this.myself.sleep(this._isEdit)
      this.orginPlayerPos.set(this.myself.node.position)
      this.anchorNode.position = this.myself.node.position
      this.camera.node.getComponent(OrbitCamera).target = this.curAnchorNode
    }

    for (let mgr of this._mapInfo.values()) { mgr.preview(this._isEdit) }
    if (this._isEdit) {
      BatchingUtility.unbatchStaticModel(this.staticNodeGroup, this.mergedNodeGroup)
      // this.mergedNodeGroup.active = false
    } else {
      let arr = []
      for (let i of this._mapInfo.keys()) { arr.push(this._mapInfo.get(i).info) }
      arr.sort((a, b) => terrainItemIdx(a[1], a[2], a[3]) - terrainItemIdx(b[1], b[2], b[3]))
      this._senceInfo.info = arr
      await IslandApi.save(this._senceInfo)
      this.enablePhysic(true)
      setTimeout(() => {
        BatchingUtility.batchStaticModel(this.staticNodeGroup, this.mergedNodeGroup)
        // this.staticNodeGroup.active = false
      }, 500)
    }
  }

  private syncLocalData() {
    let arr = []
    for (let i of this._mapInfo.keys()) { arr.push(this._mapInfo.get(i).info) }
    arr.sort((a, b) => terrainItemIdx(a[1], a[2], a[3]) - terrainItemIdx(b[1], b[2], b[3]))
    this._senceInfo.info = arr
  }

  onEditItemChanged(event: BigWorld.IslandEvent): void {
    this.curPropId = event.customData.prefab
  }

  onEditActionChanged(event: BigWorld.IslandEvent): void {
    this.curAction = event.customData.action
  }

  onEditLayerChanged(event: BigWorld.IslandEvent): void {
    this.curLayer = event.customData.layer
    let pos = v3(0, this.curLayer, 0)
    pos.set(this.orginPlayerPos)
    pos.y = this.curLayer + 1.5
    tween(this.anchorNode).to(0.5, { position: pos }, { easing: 'linear' }).start()
    this.checkLayer.position = v3(0, this.curLayer + 1 + 0.2, 0)
  }

  onRotate(event: BigWorld.IslandEvent): void {
    this.updateMapInfo({
      pos: this.hitNode.position,
      type: BigWorld.ActionType.Rotate,
      angle: event.customData.degree
    })
  }

  onSkinChanged(event: BigWorld.IslandEvent) {
    for (let mgr of this._mapInfo.values()) {
      if (!mgr.selected) { continue }
      mgr.updateSkin(event.customData.skin)
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
  }

  private onTouchEnd(event: EventTouch) {
    if (!this.isEdit || this._isMove) return
    let action = this.selectGirdItem(event.touch)
    if (action == BigWorld.ActionType.None) return
    this.updateMapInfo({ pos: this.hitNode.position, type: action, angle: 0 })
  }

  private selectGirdItem(touch: Touch): BigWorld.ActionType {
    this.camera.screenPointToRay(touch.getLocationX(), touch.getLocationY(), this._ray)

    if (!PhysicsSystem.instance.raycast(this._ray, 0xffffffff, 500)) {
      console.warn('no hit')
      return BigWorld.ActionType.None
    }

    let skinIdx = PhysicsSystem.instance.raycastResults.findIndex((it) => it.collider.node.name == 'SkinBtn')
    let checkIdx = PhysicsSystem.instance.raycastResults.findIndex((it) => it.collider.node.name == 'CheckLayer')

    if (skinIdx != -1) {
      SkinMenuEvent.customData = { show: true, skin: this._mapInfo.get(this.selectedItem).info[5] }
      this.node.dispatchEvent(SkinMenuEvent)
      return BigWorld.ActionType.None
    }

    if (checkIdx != -1) {
      this.v3_0.set(this.node.getComponent(UITransform).convertToNodeSpaceAR(PhysicsSystem.instance.raycastResults[checkIdx].hitPoint))
      this.hitPoint.position = this.v3_0
      this.v3_0.set(Math.floor(this.v3_0.x + 0.5), this.curLayer, Math.floor(this.v3_0.z + 0.5))

      let action = this.curAction
      if (this.curAction == BigWorld.ActionType.Add) {
        if (this.hitNode.position.equals(this.v3_0)) { action = this.curAction }
        else { action = BigWorld.ActionType.Selected }
      }

      this.hitNode.position = this.v3_0
      if (Math.abs(this.hitNode.position.x) > 9 || Math.abs(this.hitNode.position.z) > 9) {
        this.hitMeshRenderer.setMaterial(LilliputAssetMgr.instance.getMaterial('heart'), 0)
        action = BigWorld.ActionType.Selected
      } else {
        this.hitMeshRenderer.setMaterial(LilliputAssetMgr.instance.getMaterial('green'), 0)
      }
      return action
    }
    return BigWorld.ActionType.None
  }

  private updateMapInfo(action: BigWorld.EditAction) {
    let idx = terrainItemIdx(action.pos.x, action.pos.y, action.pos.z)
    switch (action.type) {
      case BigWorld.ActionType.Add: {
        let item = [this.curPropId, action.pos.x, action.pos.y, action.pos.z, 0]
        this.addTerrainItem(item)
        this.syncLocalData()
        this.updateAroundMatrix(action.pos.x, action.pos.y, action.pos.z)
        break
      }
      case BigWorld.ActionType.Erase:
        if (this._mapInfo.has(idx)) {
          this._mapInfo.get(idx)!.node.active = false
          this._mapInfo.get(idx)!.node.destroy()
          this._mapInfo.delete(idx)
          this.syncLocalData()
          this.updateAroundMatrix(action.pos.x, action.pos.y, action.pos.z)
        }
        break
      case BigWorld.ActionType.Rotate: {
        this._mapInfo.get(idx)?.rotate(action.angle)
        break
      }
      case BigWorld.ActionType.Selected: {
        if (this.selectedItem != idx) {
          this._mapInfo.get(this.selectedItem)?.onSelected(false)
          this.selectedItem = idx
          this._mapInfo.get(this.selectedItem)?.onSelected(true)
        }

        if (this._mapInfo.get(idx)?.skinnable) {
          this.skinBtnPos.set(action.pos)
          this.skinBtnPos.y += 3
          this.skinBtn.position = this.skinBtnPos
          this.skinBtn.active = true
          this.skinBtn.rotation = this.camera.node.rotation
        } else {
          SkinMenuEvent.customData = { show: false }
          this.node.dispatchEvent(SkinMenuEvent)

          this.skinBtn.active = false
          this.skinBtn.position = this.skinBtnPos
        }
        break
      }
    }
  }

  private addTerrainItem(info: Array<number>, preview: boolean = true): boolean {
    if (info.length < 4) return false
    let idx = terrainItemIdx(info[1], info[2], info[3])
    let mgr = this._mapInfo.get(idx)

    if (mgr != null) {
      if (mgr.info[0] == info[0]) return false
      this._mapInfo.delete(idx)
      mgr.node.destroy()
    }

    let config = LilliputAssetMgr.instance.getModelConfig(info[0])
    let item = new Node()

    if (config.group == BigWorld.ModelGroup.Ground) {
      this.staticNodeGroup.addChild(item)
    } else {
      this.node.addChild(item)
    }

    mgr = item.addComponent(BigWorld.getPropMgr(config.name))
    mgr.init(info, preview)
    this._mapInfo.set(mgr.index, mgr)
    if (info[0] == 1) { mgr.matrix = this.genMatrix(info[1], info[2], info[3]) }

    return true
  }

  private updateAroundMatrix(x: number, y: number, z: number) {
    let idx = terrainItemIdx(x + 1, y, z)
    if (this._mapInfo.has(idx) && this._mapInfo.get(idx).info[0] == 1)
      this._mapInfo.get(idx).matrix = this.genMatrix(x + 1, y, z) // left
    idx = terrainItemIdx(x - 1, y, z)
    if (this._mapInfo.has(idx) && this._mapInfo.get(idx).info[0] == 1)
      this._mapInfo.get(idx).matrix = this.genMatrix(x - 1, y, z) // right
    idx = terrainItemIdx(x, y, z + 1)
    if (this._mapInfo.has(idx) && this._mapInfo.get(idx).info[0] == 1)
      this._mapInfo.get(idx).matrix = this.genMatrix(x, y, z + 1) // forward
    idx = terrainItemIdx(x, y, z - 1)
    if (this._mapInfo.has(idx) && this._mapInfo.get(idx).info[0] == 1)
      this._mapInfo.get(idx).matrix = this.genMatrix(x, y, z - 1) // behind
    idx = terrainItemIdx(x, y - 1, z)
    if (this._mapInfo.has(idx) && this._mapInfo.get(idx).info[0] == 1)
      this._mapInfo.get(idx).matrix = this.genMatrix(x, y - 1, z) // below
  }

  private genMatrix(x: number, y: number, z: number) {
    let martix = 0b00000

    // for (let i of this._mapInfo.keys()) {
    //   let it = this._mapInfo.get(i)
    //   if (it[0] != 1) continue
    //   if (it[1] == x + 1 && it[2] == y && it[3] == z) {
    //     martix |= BigWorld.Cube_Left
    //     continue
    //   }
    //   if (it[1] == x - 1 && it[2] == y && it[3] == z) {
    //     martix |= BigWorld.Cube_Right
    //     continue
    //   }
    //   if (it[1] == x && it[2] == y && it[3] == z + 1) {
    //     martix |= BigWorld.Cube_Forward
    //     continue
    //   }
    //   if (it[1] == x && it[2] == y && it[3] == z - 1) {
    //     martix |= BigWorld.Cube_Behind
    //     continue
    //   }
    //   if (it[1] == x && it[2] == y + 1 && it[3] == z) {
    //     martix |= BigWorld.Cube_Up
    //     continue
    //   }
    // }

    this._senceInfo.info.forEach(it => {
      if (it[0] != 1) return
      if (it[1] == x + 1 && it[2] == y && it[3] == z) martix |= BigWorld.Cube_Left
      if (it[1] == x - 1 && it[2] == y && it[3] == z) martix |= BigWorld.Cube_Right
      if (it[1] == x && it[2] == y && it[3] == z + 1) martix |= BigWorld.Cube_Forward
      if (it[1] == x && it[2] == y && it[3] == z - 1) martix |= BigWorld.Cube_Behind
      if (it[1] == x && it[2] == y + 1 && it[3] == z) martix |= BigWorld.Cube_Up
    })
    return martix
  }
}