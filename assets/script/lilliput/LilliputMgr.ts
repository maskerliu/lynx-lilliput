import {
  AmbientInfo, Camera, Component, DirectionalLight, Node, Prefab,
  SkyboxInfo, UITransform, _decorator, director, instantiate, quat, v3
} from 'cc'
import OrbitCamera from '../common/OrbitCamera'
import LocalPrefs from '../misc/LocalPrefs'
import { Game, PlayerState, User } from '../model'
import BattleService from './BattleService'
import IslandMgr from './IslandMgr'
import LilliputAssetMgr from './LilliputAssetMgr'
import { Lilliput } from './LilliputEvents'
import LilliputUIMgr from './LilliputUIMgr'
import UserService from './UserService'
import MyselfMgr from './player/MySelfMgr'
import OtherMgr from './player/OtherMgr'


const { ccclass, property } = _decorator

@ccclass('LilliputMgr')
export default class LilliputMgr extends Component {

  @property(OrbitCamera)
  private orbitCamera: OrbitCamera

  @property(DirectionalLight)
  private mainLight: DirectionalLight

  @property(Node)
  private bornNode: Node

  @property(Prefab)
  islandPrefab: Prefab

  @property(Node)
  test: Node


  private skyboxInfo: SkyboxInfo
  private ambientInfo: AmbientInfo

  private uiMgr: LilliputUIMgr
  private once: boolean = true

  private q_rotation = quat()
  private v3_0 = v3()

  private worldTime: number = 0
  private isDay: boolean = false

  onLoad() {
    this.ambientInfo = director.getScene().globals.ambient
    this.skyboxInfo = director.getScene().globals.skybox

    this.uiMgr = this.getComponentInChildren(LilliputUIMgr)
    this.orbitCamera.reactArea = this.uiMgr?.reactArea
  }

  async start() {
    LilliputAssetMgr.preload()
    this.orbitCamera.target = this.bornNode
    this.uiMgr?.canEdit(false, false)
    this.registerUIEvent()
    this.schedule(this.onPreloaded, 0.5)
  }

  private async onPreloaded() {
    if (LilliputAssetMgr.preloaded) {
      try {
        await this.preload()
      } catch (err) {
        console.error(err)
      }

      this.unschedule(this.onPreloaded)
    }
  }

  async update(dt: number) {
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

    this.node.on(Lilliput.IslandEvent.Type.SkinMenu, this.uiMgr?.showSkinMenu, this.uiMgr)
    this.node.on(Lilliput.PropEvent.Type.ShowInteractMenu, this.uiMgr?.updateActions, this.uiMgr)

    this.node.on(Lilliput.PlayerEvent.Type.TryEnter, this.onTryEnter, this)
    this.node.on(Lilliput.PlayerEvent.Type.DidEnter, this.onDidEnter, this)
    this.node.on(Lilliput.PlayerEvent.Type.OnLeave, this.onLeave, this)
    this.node.on(Lilliput.PlayerEvent.Type.OnAction, this.onPlayerEvent, this)
  }

  private unregisterUIEvent() {
    this.node.off(Lilliput.UIEvent.Type.UserInfoBind, this.onUserInfoBind, this)


    this.node.off(Lilliput.IslandEvent.Type.SkinMenu, this.uiMgr?.showSkinMenu, this.uiMgr)
    this.node.off(Lilliput.PropEvent.Type.ShowInteractMenu, this.uiMgr?.updateActions, this.uiMgr)

    this.node.off(Lilliput.PlayerEvent.Type.TryEnter, this.onTryEnter, this)
    this.node.off(Lilliput.PlayerEvent.Type.DidEnter, this.onDidEnter, this)
    this.node.off(Lilliput.PlayerEvent.Type.OnLeave, this.onLeave, this)
    this.node.off(Lilliput.PlayerEvent.Type.OnAction, this.onPlayerEvent, this)
  }

  private registerIslandEvent() {
    let island = BattleService.instance.island()
    this.node.on(Lilliput.IslandEvent.Type.OnEditChanged, island.onEditModeChanged, island)
    this.node.on(Lilliput.IslandEvent.Type.OnItemChanged, island.onEditItemChanged, island)
    this.node.on(Lilliput.IslandEvent.Type.OnActionChanged, island.onEditActionChanged, island)
    this.node.on(Lilliput.IslandEvent.Type.OnLayerChanged, island.onEditLayerChanged, island)
    this.node.on(Lilliput.IslandEvent.Type.OnRotate, island.onRotate, island)
    this.node.on(Lilliput.IslandEvent.Type.OnSkinChanged, island.onSkinChanged, island)
  }

  private unregisterIslandEvent() {
    let island = BattleService.instance.island()
    this.node.off(Lilliput.IslandEvent.Type.OnEditChanged, island?.onEditModeChanged, island)
    this.node.off(Lilliput.IslandEvent.Type.OnItemChanged, island?.onEditItemChanged, island)
    this.node.off(Lilliput.IslandEvent.Type.OnActionChanged, island?.onEditActionChanged, island)
    this.node.off(Lilliput.IslandEvent.Type.OnLayerChanged, island?.onEditLayerChanged, island)
    this.node.off(Lilliput.IslandEvent.Type.OnRotate, island?.onRotate, island)
    this.node.off(Lilliput.IslandEvent.Type.OnSkinChanged, island?.onSkinChanged, island)
  }

  async onUserInfoBind() {
    let profile = await UserService.profile()
    BattleService.instance.init(profile.id, this.node)

    let player = this.genreatorPlayer(profile)
    player.node.position = v3(1, 3, 1)
  }

  async onTryEnter(event: Lilliput.UIEvent) {
    let mgr = BattleService.instance.island(event.customData.islandId)
    if (mgr == null) {
      let node = instantiate(this.islandPrefab)

      node.position = BattleService.instance.randomPos
      mgr = node.addComponent(IslandMgr)
      await mgr.init(event.customData.islandId)
      mgr.camera = this.orbitCamera.getComponent(Camera)
      mgr.reactArea = this.uiMgr.reactArea
      BattleService.instance.addIsland(mgr)
    }

    let player = BattleService.instance.player()
    await BattleService.instance.tryEnter(player.profile.id, mgr.senceInfo.id, event.customData.pos)
  }

  async onDidEnter(event: Lilliput.PlayerEvent) {
    let state = event.customData as PlayerState
    let profile = await UserService.profile(state.profile.uid)
    let player = this.genreatorPlayer(profile)

    let island = BattleService.instance.island()
    await BattleService.instance.didEnter(player, island)

    if (BattleService.instance.isMyself(profile.id)) {

      // Add shadow for Debug 
      let newProfile = Object.assign({}, profile)
      newProfile.id = 'shadow'
      newProfile.prefab = 'human'
      newProfile.skin = 'zombieMaleA'
      let shadow = this.genreatorPlayer(newProfile)
      await BattleService.instance.didEnter(shadow, island)

      let canEdit = island.canEdit(profile.id)
      this.uiMgr.canEdit(canEdit, island.isEdit)
      if (canEdit) {
        this.registerIslandEvent()
      } else {
        this.unregisterIslandEvent()
      }
    }
  }

  async onLeave(event: Lilliput.PlayerEvent) {
    let player = BattleService.instance.player(event.customData)

    if (BattleService.instance.isMyself(player.profile.id)) {
      await BattleService.instance.stop()
      let pos = this.node.getComponent(UITransform).convertToNodeSpaceAR(player.node.worldPosition)
      player.leave()
      this.node.addChild(player.node)
      player.node.position = pos
      player.node.active = true

      BattleService.instance.player('shadow')?.leave()

      this.uiMgr.canEdit(false, false)
      this.unregisterIslandEvent()
    } else {
      player.leave()
    }

  }

  private genreatorPlayer(profile: User.Profile) {
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

  async onPlayerEvent(event: Lilliput.PlayerEvent) {
    let msg: Game.PlayerMsg = { cmd: Game.PlayerMsgType.Sync, state: event.action }
    BattleService.instance.player().onAction(msg)
  }

  private async preload() {
    if (LocalPrefs.myself) {
      this.onUserInfoBind()
    }

    let uids = [
      '645e0003955ff9912366489a',
      '64747cf4416e939f6e59be40',
      '6479bbca8a1168a1d41d7c14',
      '6479be158a1168a1d41d7c17',
      '6479bf0d8a1168a1d41d7c19',
      '6479bf598a1168a1d41d7c1c',
    ]

    if (LocalPrefs.myself && !uids.includes(LocalPrefs.myself.id)) {
      uids.push(LocalPrefs.myself.id)
    }

    for (let uid of uids) {
      let mgr = BattleService.instance.island(null, uid)
      if (mgr == null) {
        let island = instantiate(this.islandPrefab)
        island.position = BattleService.instance.randomPos
        this.node.addChild(island)
        let mgr = island.getComponent(IslandMgr)
        await mgr.init(this.orbitCamera.node.getComponent(Camera), null, uid)
        mgr.reactArea = this.uiMgr.reactArea
        BattleService.instance.addIsland(mgr)
      }
    }
  }
}