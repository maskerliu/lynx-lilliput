import { BatchingUtility, Camera, Color, EventTouch, MeshRenderer, Node, PhysicsSystem, Touch, UITransform, Vec2, Vec3, _decorator, geometry, quat, tween, v3 } from 'cc'
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
  private anchorNode: Node

  get curAnchorNode() {
    return this._isEdit ? this.anchorNode : this.myself.node
  }

  @property(Node)
  private skinBtn: Node

  private staticNodeGroup = [new Node(), new Node(), new Node()]
  private mergedNodeGroup = [new Node(), new Node(), new Node()]

  private _isMove = false
  private _color: Color = new Color()

  camera: Camera

  private _reactArea: Node
  set reactArea(node: Node) { this._reactArea = node }

  private hitMeshRenderer: MeshRenderer

  private _infos: Array<Array<number>> = []
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
  private _loaded: boolean = false
  private _curIdx = -1

  onLoad() {
    this.hitMeshRenderer = this.hitNode.getComponentInChildren(MeshRenderer)
    this.q_skinBtn.set(this.skinBtn.rotation)

    for (let i = 0; i < this.staticNodeGroup.length; ++i) {
      this.node.addChild(this.staticNodeGroup[i])
      this.node.addChild(this.mergedNodeGroup[i])
    }
  }

  protected update(dt: number): void {
    if (this._loaded || this._senceInfo == null) return

    if (this._mapInfo.size - 1 == this._curIdx) {
      if (this._curIdx == this._senceInfo.info.length - 1) {
        this._loaded = true
      } else {
        this._curIdx++
        this.addTerrainItem(this._senceInfo.info[this._curIdx], false)
      }
    }

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

      // for (let i = 0; i < this._senceInfo.info.length; ++i) {
      //   try {
      //     this.addTerrainItem(this._senceInfo.info[i], false)
      //   } catch (err) {
      //     console.error(err, i)
      //   }
      // }

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
    this._mapInfo.forEach(it => { try { it.enablePhysic(enable) } catch (err) { console.log(err, it.config.name) } })
  }

  private initIsland() {
    SkinMenuEvent.customData = { show: false }
    this.node.dispatchEvent(SkinMenuEvent)

    this.hitNode.active = this._isEdit
    this.anchorNode.active = this._isEdit
    this.checkLayer.active = this._isEdit
    this.skinBtn.active = this._isEdit
    this.curLayer = 0

    this.hitNode.position.set(0, -2, 0)
    this.skinBtn.position.set(0, -2, 0)
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

    this.myself = this.node.getComponentInChildren('MyselfMgr') as BigWorld.PlayerMgr
    if (this.myself) {
      this.myself.sleep(this._isEdit)
      this.orginPlayerPos.set(this.myself.node.position)
      this.anchorNode.position = this.myself.node.position
      this.camera.node.getComponent(OrbitCamera).target = this.curAnchorNode
    }

    for (let mgr of this._mapInfo.values()) { mgr.preview(this._isEdit) }
    if (this._isEdit) {
      // BatchingUtility.unbatchStaticModel(this.staticNodeGroup[0], this.mergedNodeGroup[0])
      // this.mergedNodeGroup.active = false
    } else {
      await IslandApi.save(this._senceInfo)
      this.enablePhysic(true)
      setTimeout(() => {
        // BatchingUtility.batchStaticModel(this.staticNodeGroup[0], this.mergedNodeGroup[0])
        // this.staticNodeGroup.active = false
      }, 500)
    }
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
    let mgr = this._mapInfo.get(this.selectedItem)
    if (mgr) {
      this.v3_0.set(mgr.info[Island.Idx_X], mgr.info[Island.Idx_Y], mgr.info[Island.Idx_Z])
      let idx = this.getInfoIdx(this.v3_0)
      if (idx != -1) {
        mgr.updateSkin(event.customData.skin)
        this._senceInfo.info[idx][Island.Idx_Skin] = event.customData.skin
      }
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
      if (this._mapInfo.has(this.selectedItem)) {
        SkinMenuEvent.customData = { show: true, skin: this._mapInfo.get(this.selectedItem).info[5] }
        this.node.dispatchEvent(SkinMenuEvent)
      }
      return BigWorld.ActionType.None
    }

    if (checkIdx == -1) return BigWorld.ActionType.None

    this.v3_0.set(this.node.getComponent(UITransform).convertToNodeSpaceAR(PhysicsSystem.instance.raycastResults[checkIdx].hitPoint))
    this.v3_0.set(Math.floor(this.v3_0.x + 0.5), this.curLayer, Math.floor(this.v3_0.z + 0.5))

    let action = this.curAction
    if (this.curAction == BigWorld.ActionType.Add) {
      if (this.hitNode.position.equals(this.v3_0)) { action = this.curAction }
      else { action = BigWorld.ActionType.Selected }
    }

    this.hitNode.position = this.v3_0
    if (Math.abs(this.hitNode.position.x) > 9 || Math.abs(this.hitNode.position.z) > 9) {
      this.hitMeshRenderer.material.setProperty('mainColor', Color.RED)
      action = BigWorld.ActionType.Selected
    } else {
      this.hitMeshRenderer.material.setProperty('mainColor', Color.WHITE)
    }
    return action

  }

  private updateMapInfo(action: BigWorld.EditAction) {
    let idx = terrainItemIdx(action.pos.x, action.pos.y, action.pos.z)
    switch (action.type) {
      case BigWorld.ActionType.Add: {
        let item = [this.curPropId, action.pos.x, action.pos.y, action.pos.z, 0]
        let result = this.addTerrainItem(item)
        if (result) this._senceInfo.info.push(item)

        this.updateAroundMatrix(action.pos.x, action.pos.y, action.pos.z)
        break
      }
      case BigWorld.ActionType.Erase:
        if (this._mapInfo.has(idx)) {
          this._mapInfo.get(idx)!.node.active = false
          this._mapInfo.get(idx)!.node.destroy()
          this._mapInfo.delete(idx)

          let infoIdx = this.getInfoIdx(action.pos)
          if (infoIdx != -1) {
            this._senceInfo.info.splice(infoIdx, 1)
          }

          this.updateAroundMatrix(action.pos.x, action.pos.y, action.pos.z)
        }
        break
      case BigWorld.ActionType.Rotate: {
        this._mapInfo.get(idx)?.rotate(action.angle)

        let infoIdx = this.getInfoIdx(action.pos)
        if (infoIdx != -1) {
          this._senceInfo.info[infoIdx][4] = this._mapInfo.get(idx).angle(this._senceInfo.info[infoIdx][4] + action.angle)
        }
        break
      }
      case BigWorld.ActionType.Selected: {
        if (this.selectedItem != idx) {
          if (this._mapInfo.has(this.selectedItem))
            this._mapInfo.get(this.selectedItem).selected = false

          this.selectedItem = idx

          if (this._mapInfo.has(this.selectedItem))
            this._mapInfo.get(this.selectedItem).selected = true

        }

        if (this._mapInfo.get(idx)?.skinnable) {
          this.skinBtnPos.set(action.pos)
          this.skinBtnPos.y += 2
          this.skinBtn.position = this.skinBtnPos
          this.skinBtn.active = true
          this.skinBtn.rotation = this.camera.node.rotation
        } else {
          this.skinBtn.active = false
        }

        SkinMenuEvent.customData = { show: false }
        this.node.dispatchEvent(SkinMenuEvent)

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

      this.v3_0.set(info[1], info[2], info[3])
      let infoIdx = this.getInfoIdx(this.v3_0)
      if (infoIdx != -1) this._senceInfo.info.splice(infoIdx, 1)
    }

    let config = LilliputAssetMgr.instance.getModelConfig(info[0])
    let item = new Node()

    if (config.group == BigWorld.ModelGroup.Ground) {
      this.staticNodeGroup[0].addChild(item)
    } else {
      this.node.addChild(item)
    }

    mgr = item.addComponent(BigWorld.getPropMgr(config.name))
    mgr.init(info, preview)
    this._mapInfo.set(mgr.index, mgr)
    mgr.matrix = this.genMatrix(info)

    return true
  }

  private updateAroundMatrix(x: number, y: number, z: number) {
    let idx: number
    if (y > 0) {
      idx = terrainItemIdx(x, y - 1, z)
      if (this._mapInfo.has(idx) && this._mapInfo.get(idx).info[Island.Idx_Id] == 1)
        this._mapInfo.get(idx).matrix = this.genMatrix(this._mapInfo.get(idx).info)
    }

    for (let i = -1; i < 2; i += 2) {
      let idx = terrainItemIdx(x + i, y, z)
      if (this._mapInfo.has(idx) && this._mapInfo.get(idx).info[Island.Idx_Id] == 1)
        this._mapInfo.get(idx).matrix = this.genMatrix(this._mapInfo.get(idx).info)

      idx = terrainItemIdx(x, y, z + i)
      if (this._mapInfo.has(idx) && this._mapInfo.get(idx).info[Island.Idx_Id] == 1)
        this._mapInfo.get(idx).matrix = this.genMatrix(this._mapInfo.get(idx).info)

      if (y < 1) continue
      idx = terrainItemIdx(x + i, y - 1, z)
      if (this._mapInfo.has(idx) && this._mapInfo.get(idx).info[Island.Idx_Id] == 20)
        this._mapInfo.get(idx).matrix = this.genMatrix(this._mapInfo.get(idx).info)
      idx = terrainItemIdx(x, y - 1, z + i)
      if (this._mapInfo.has(idx) && this._mapInfo.get(idx).info[Island.Idx_Id] == 20)
        this._mapInfo.get(idx).matrix = this.genMatrix(this._mapInfo.get(idx).info)
    }
  }

  private genMatrix(info: Array<number>) {
    let martix = 0b00000
    let [id, x, y, z] = info
    this._senceInfo.info.forEach(it => {
      if (id == 1 && it[0] != 1) return
      let [_, ix, iy, iz] = it
      if (ix == x && iy == y && iz == z + 1) {
        if ((id == 20 && it[0] == 20) || id == 1) martix |= BigWorld.Cube_F
      }
      if (ix == x && iy == y && iz == z - 1) {
        if ((id == 20 && it[0] == 20) || id == 1) martix |= BigWorld.Cube_B
      }
      if (ix == x + 1 && iy == y && iz == z) {
        if ((id == 20 && it[0] == 20) || id == 1) martix |= BigWorld.Cube_L
      }
      if (ix == x - 1 && iy == y && iz == z) {
        if ((id == 20 && it[0] == 20) || id == 1) martix |= BigWorld.Cube_R
      }
      if (ix == x && iy == y + 1 && iz == z) {
        if ((id == 20 && it[0] == 20) || id == 1) martix |= BigWorld.Cube_U
      }

      if (id == 20) {
        if (ix == x && iy == y + 1 && iz == z + 1) martix |= BigWorld.Cube_UF
        if (ix == x && iy == y + 1 && iz == z - 1) martix |= BigWorld.Cube_UB
        if (ix == x + 1 && iy == y + 1 && iz == z) martix |= BigWorld.Cube_UL
        if (ix == x - 1 && iy == y + 1 && iz == z) martix |= BigWorld.Cube_UR
      }
    })
    return martix
  }

  private getInfoIdx(pos: Vec3) {
    return this._senceInfo.info.findIndex(it => it[1] == Math.round(pos.x) && it[2] == Math.round(pos.y) && it[3] == Math.round(pos.z))
  }
}