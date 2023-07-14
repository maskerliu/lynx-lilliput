import {
  AmbientInfo,
  Camera, Component, DirectionalLight, Mesh, MeshRenderer, Node,
  Quat,
  SkyboxInfo, UITransform, Vec2, Vec3, _decorator, director,
  gfx,
  instantiate, math,
  primitives,
  utils,
  v2,
  v3
} from 'cc'
import { BigWorld } from '../common/BigWorld'
import OrbitCamera from '../common/OrbitCamera'
import LocalPrefs from '../misc/LocalPrefs'
import { Game, PlayerState, User } from '../model'
import BattleService from './BattleService'
import LilliputAssetMgr from './LilliputAssetMgr'
import { Lilliput } from './LilliputEvents'
import LilliputUIMgr from './LilliputUIMgr'
import UserService from './UserService'
import MyselfMgr from './player/MyselfMgr'
import OtherMgr from './player/OtherMgr'
import { registerProps } from './prop'
import { MapQuad, Vertex, VertexHex } from '../common/MapGrid'

const { ccclass, property } = _decorator


@ccclass('LilliputMgr')
export default class LilliputMgr extends Component {

  @property(OrbitCamera)
  private orbitCamera: OrbitCamera

  @property(DirectionalLight)
  private mainLight: DirectionalLight

  @property(Node)
  private bornNode: Node

  private mergedBornNode: Node = new Node()

  @property(Node)
  test: Node

  @property(Node)
  test1: Node

  @property(Node)
  private seagulls: Node

  private skyboxInfo: SkyboxInfo
  private ambientInfo: AmbientInfo

  private uiMgr: LilliputUIMgr

  private worldTime: number = 0
  private isDay: boolean = false

  onLoad() {
    this.ambientInfo = director.getScene().globals.ambient
    this.skyboxInfo = director.getScene().globals.skybox

    this.uiMgr = this.getComponentInChildren(LilliputUIMgr)
    this.orbitCamera.reactArea = this.uiMgr?.reactArea


    registerProps()
  }

  static Axis_X = 0b001
  static Axis_Y = 0b010
  static Axis_Z = 0b100

  private rotate(name: string, rotation: number, axis: number) {
    let result = name
    if (axis & LilliputMgr.Axis_Y) {
      result = name
    } else if (axis & LilliputMgr.Axis_X) {
      result = name[0] + name[3] + name[7] + name[4] + name[1] + name[2] + name[6] + name[5]
    } else if (axis & LilliputMgr.Axis_Z) {
      name[0] + name[4] + name[5] + name[1] + name[3] + name[7] + name[6] + name[2]
    }
    return result.substring(rotation, 4) + result.substring(0, rotation) + result.substring(rotation + 4, 8) + result.substring(4, rotation + 4)
  }

  private flip(name: string, axis: number) {
    let result: string = name
    if (axis & LilliputMgr.Axis_X) {
      result = result[1] + result[0] + result[3] + result[2] + result[5] + result[4] + result[7] + result[6]
    }

    if (axis & LilliputMgr.Axis_Z) {
      result = result[3] + result[2] + result[1] + result[0] + result[7] + result[6] + result[5] + result[4]
    }

    if (axis & LilliputMgr.Axis_Y) {
      result = result[4] + result[5] + result[6] + result[7] + result[0] + result[1] + result[2] + result[3]
    }

    return result
  }

  async start() {
    LilliputAssetMgr.instance.preload()
    this.orbitCamera.target = this.bornNode
    this.uiMgr?.canEdit(false, false)
    this.registerUIEvent()
    this.schedule(this.onPreloaded, 0.1)

    this.node.addChild(this.mergedBornNode)
    // BatchingUtility.batchStaticModel(this.bornNode, this.mergedBornNode)

    let mesh = this.test.getComponentInChildren(MeshRenderer).mesh


    let stride = mesh.struct.vertexBundles[0].view.stride
    let count = mesh.struct.vertexBundles[0].view.count
    let offset = mesh.struct.vertexBundles[0].view.offset
    let data = new Float32Array(mesh.data.buffer)
    let wrapIntData = structuredClone(mesh.data)
    let wrapFloatData = new Float32Array(wrapIntData.buffer)
    let v3_0 = v3()
    for (let i = 0; i < count; ++i) {
      offset = i * stride / 4
      // wrapFloatData[offset] = -data[offset]
      // wrapFloatData[offset + 1] = data[offset + 1]
      // wrapFloatData[offset + 2] = data[offset + 2]
      v3_0.set(wrapFloatData[offset], wrapFloatData[offset + 1], wrapFloatData[offset + 2])
      Vec3.rotateY(v3_0, v3_0, Vec3.UNIT_Y, math.toRadian(90 * 2))
      wrapFloatData[offset] = v3_0.x
      wrapFloatData[offset + 1] = v3_0.y
      wrapFloatData[offset + 2] = v3_0.z
      // for (let j = 3; j < stride / 4; ++j) {
      //   wrapFloatData[i * stride / 4 + j] = data[i * stride / 4 + j]
      // }
    }

    let newMesh = new Mesh()
    newMesh.reset({ struct: mesh.struct, data: wrapIntData })
    newMesh.initialize()
    this.test.getComponentInChildren(MeshRenderer).mesh = newMesh
    this.test.getComponentInChildren(MeshRenderer).onGeometryChanged()


    v3_0 = v3(0, 0, 1)

    console.log(v3_0)

  }

  private async onPreloaded() {
    if (LilliputAssetMgr.instance.preloaded >= LilliputAssetMgr.instance.totalPreload) {
      this.preload()
      this.unschedule(this.onPreloaded)
      this.uiMgr.updateLoading(false)
    } else {
      this.uiMgr.updateLoading(true, `${LilliputAssetMgr.instance.preloaded} /${LilliputAssetMgr.instance.totalPreload}`)
    }
  }

  update(dt: number) {
    if (this.isDay) {
      if (this.mainLight.illuminance < 80000) {
        this.mainLight.illuminance += 100
      } else {
        this.isDay = false
      }
    } else {
      if (this.mainLight.illuminance > 10000) {
        this.mainLight.illuminance -= 100
      } else {
        this.isDay = true
      }
    }

    if (this.skyboxInfo.rotationAngle >= 360) {
      this.skyboxInfo.rotationAngle = 0
    } else {
      this.skyboxInfo.rotationAngle += dt * 2
    }
  }

  onDestroy() {
    console.log('lilliput destroy')
    this.unregisterUIEvent()
  }

  private registerUIEvent() {
    this.node.on(Lilliput.UIEvent.Type.UserInfoBind, this.onUserInfoBind, this)

    this.node.on(BigWorld.IslandEvent.Type.SkinMenu, this.uiMgr?.showSkinMenu, this.uiMgr)
    this.node.on(BigWorld.PropEvent.Type.ShowInteractMenu, this.uiMgr?.updateActions, this.uiMgr)

    this.node.on(BigWorld.PlayerEvent.Type.TryEnter, this.onTryEnter, this)
    this.node.on(BigWorld.PlayerEvent.Type.DidEnter, this.onDidEnter, this)
    this.node.on(BigWorld.PlayerEvent.Type.OnLeave, this.onLeave, this)
    this.node.on(BigWorld.PlayerEvent.Type.OnAction, this.onPlayerAction, this)
  }

  private unregisterUIEvent() {
    this.node.off(Lilliput.UIEvent.Type.UserInfoBind, this.onUserInfoBind, this)


    this.node.off(BigWorld.IslandEvent.Type.SkinMenu, this.uiMgr?.showSkinMenu, this.uiMgr)
    this.node.off(BigWorld.PropEvent.Type.ShowInteractMenu, this.uiMgr?.updateActions, this.uiMgr)

    this.node.off(BigWorld.PlayerEvent.Type.TryEnter, this.onTryEnter, this)
    this.node.off(BigWorld.PlayerEvent.Type.DidEnter, this.onDidEnter, this)
    this.node.off(BigWorld.PlayerEvent.Type.OnLeave, this.onLeave, this)
    this.node.off(BigWorld.PlayerEvent.Type.OnAction, this.onPlayerAction, this)
  }

  private registerIslandEvent() {
    let island = BattleService.instance.island()
    this.node.on(BigWorld.IslandEvent.Type.OnEditChanged, island.onEditModeChanged, island)
    this.node.on(BigWorld.IslandEvent.Type.OnItemChanged, island.onEditItemChanged, island)
    this.node.on(BigWorld.IslandEvent.Type.OnActionChanged, island.onEditActionChanged, island)
    this.node.on(BigWorld.IslandEvent.Type.OnLayerChanged, island.onEditLayerChanged, island)
    this.node.on(BigWorld.IslandEvent.Type.OnRotate, island.onRotate, island)
    this.node.on(BigWorld.IslandEvent.Type.OnSkinChanged, island.onSkinChanged, island)

    this.node.on(Lilliput.UIEvent.Type.ChatMsg, this.uiMgr.updateChatMsg, this.uiMgr)
  }

  private unregisterIslandEvent() {
    let island = BattleService.instance.island()
    this.node.off(BigWorld.IslandEvent.Type.OnEditChanged, island?.onEditModeChanged, island)
    this.node.off(BigWorld.IslandEvent.Type.OnItemChanged, island?.onEditItemChanged, island)
    this.node.off(BigWorld.IslandEvent.Type.OnActionChanged, island?.onEditActionChanged, island)
    this.node.off(BigWorld.IslandEvent.Type.OnLayerChanged, island?.onEditLayerChanged, island)
    this.node.off(BigWorld.IslandEvent.Type.OnRotate, island?.onRotate, island)
    this.node.off(BigWorld.IslandEvent.Type.OnSkinChanged, island?.onSkinChanged, island)

    this.node.off(Lilliput.UIEvent.Type.ChatMsg, this.uiMgr.updateChatMsg, this.uiMgr)
  }

  async onUserInfoBind() {
    let profile = await UserService.profile()
    BattleService.instance.init(profile.id, this.node)

    let player = this.genereatorPlayer(profile)
    player.node.position = v3(0, 3, 0)
  }

  async onTryEnter(event: BigWorld.PlayerEvent) {
    let island = await this.generateIsland(event.customData.islandId, null)
    let player = BattleService.instance.player()
    await BattleService.instance.tryEnter(player.profile.id, event.customData.islandId, event.customData.pos, player.state)
  }

  async onDidEnter(event: BigWorld.PlayerEvent) {
    let state = event.customData as PlayerState
    let profile = await UserService.profile(state.profile.uid)
    let player = this.genereatorPlayer(profile)

    let island = BattleService.instance.island()
    if (island == null) return

    if (BattleService.instance.isMyself(profile.id)) {
      this.seagulls.position = island.node.position
      // Add shadow for Debug 
      let newProfile = Object.assign({}, profile)
      newProfile.id = 'shadow'
      newProfile.prefab = 'human'
      newProfile.skin = 'zombieMaleA'
      let shadow = this.genereatorPlayer(newProfile)
      await BattleService.instance.didEnter(shadow)

      let canEdit = island.canEdit(profile.id)
      this.uiMgr.canEdit(canEdit, island.isEdit)
      if (canEdit) {
        this.registerIslandEvent()
      } else {
        this.unregisterIslandEvent()
      }
    }
    await BattleService.instance.didEnter(player)
  }

  async onLeave(event: BigWorld.PlayerEvent) {
    let player = BattleService.instance.player(event.customData)

    if (BattleService.instance.isMyself(player.profile.id)) {
      this.seagulls.position = Vec3.ZERO

      let pos = this.node.getComponent(UITransform).convertToNodeSpaceAR(player.node.worldPosition)
      player.leave()
      player.node.parent = this.node
      player.node.position = pos

      BattleService.instance.player('shadow')?.leave()
      await BattleService.instance.leave()
      this.uiMgr.canEdit(false, false)
      this.unregisterIslandEvent()
    } else {
      player.leave()
    }

  }

  async onPlayerAction(event: BigWorld.PlayerEvent) {
    let msg: Game.PlayerMsg = { state: event.action }
    BattleService.instance.player().onAction(msg)
  }

  private genereatorPlayer(profile: User.Profile) {
    let player = BattleService.instance.player(profile.id)
    if (player == null) {
      let node = new Node()
      this.node.addChild(node)
      if (BattleService.instance.isMyself(profile.id)) {
        node.name = 'myself'
        player = node.addComponent(MyselfMgr)
        player.followCamera = this.orbitCamera.node
        this.orbitCamera.target = player.node
        this.uiMgr.rockerTarget = player as MyselfMgr
      } else {
        node.name = 'other'
        player = node.addComponent(OtherMgr)
      }
      player.init(profile)
    }

    BattleService.instance.addPlayer(player)

    return player
  }

  private async generateIsland(islandId: string, uid: string) {
    let mgr = BattleService.instance.island(islandId, uid)
    if (mgr == null) {
      let island = instantiate(LilliputAssetMgr.instance.getTerrainPrefab('island'))
      island.position = BattleService.instance.randomPos
      this.node.addChild(island)
      let mgr = island.getComponent('LilliputIslandMgr') as BigWorld.IslandMgr
      await mgr.init(this.orbitCamera.node.getComponent(Camera), islandId, uid)
      mgr.reactArea = this.uiMgr.reactArea
      BattleService.instance.addIsland(mgr)
    }
    return mgr
  }

  private async preload() {
    if (LocalPrefs.myself) {
      this.onUserInfoBind()
    }

    let uids = [
      '645e0003955ff9912366489a',
      // '64747cf4416e939f6e59be40',
      // '6479bbca8a1168a1d41d7c14',
      // '6479be158a1168a1d41d7c17',
      // '6479bf0d8a1168a1d41d7c19',
      // '6479bf598a1168a1d41d7c1c',
    ]

    if (LocalPrefs.myself && !uids.includes(LocalPrefs.myself.id)) {
      uids.push(LocalPrefs.myself.id)
    }

    // for (let uid of uids) { await this.generateIsland(null, uid) }
  }
}