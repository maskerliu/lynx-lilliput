import {
  AmbientInfo, Camera, Component, DirectionalLight, MeshCollider, MeshRenderer,
  Node, Prefab, RigidBody, SkyboxInfo, _decorator, director, instantiate, quat, v3
} from 'cc'
import { PhyEnvGroup } from '../common/Misc'
import OrbitCamera from '../common/OrbitCamera'
import { PlayerEvent } from '../common/PlayerMgr'
import LocalPrefs from '../misc/LocalPrefs'
import { Game } from '../model'
import BalloonMgr from './BalloonMgr'
import BattleService from './BattleService'
import IslandAssetMgr from './IslandAssetMgr'
import IslandMgr, { IslandEvent } from './IslandMgr'
import LilliputUIMgr, { LilliputUIEvent } from './LilliputUIMgr'
import { PropEvent } from './TerrainItemMgr'
import UserService from './UserService'
import MyselfMgr from './player/MySelfMgr'


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

  @property(Prefab)
  playerPrefab: Prefab

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
  private timecost: number = 0

  onLoad() {
    this.ambientInfo = director.getScene().globals.ambient
    this.skyboxInfo = director.getScene().globals.skybox
    BattleService.playerPrefab = this.playerPrefab

    this.uiMgr = this.getComponentInChildren(LilliputUIMgr)
    this.orbitCamera.reactArea = this.uiMgr.reactArea

    IslandAssetMgr.env = this.node.getChildByName('Env')

    this.registerUIEvent()
  }

  start() {
    IslandAssetMgr.preload()
    this.timecost = Date.now()
    this.orbitCamera.target = this.bornNode

    this.uiMgr.canEdit(false)
    this.uiMgr.updateEditMode(false)
  }

  async update(dt: number) {
    if (!IslandAssetMgr.isPreloaded) {
      this.uiMgr?.updateLoading(true, `资源（${IslandAssetMgr.preloadCount}/${IslandAssetMgr.resouceCount}）加载中。。。`)
    } else {
      if (this.once) {
        this.once = false
        this.uiMgr?.updateLoading(false)

        console.log('resouce load cost:', Date.now() - this.timecost)
        await this.preload()
      }
    }

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
    console.log('destroy')
  }

  private registerUIEvent() {

    this.node.on(LilliputUIEvent.Type.TerrainEdit, () => {
      this.onEditTerrain()
    }, this)

    this.node.on(LilliputUIEvent.Type.UserInfoBind, (event: LilliputUIEvent) => {
      this.onUserInfoBind()
    }, this)

    this.node.on(LilliputUIEvent.Type.EnterIsland, (event: LilliputUIEvent) => {
      this.onEnterIsland(event.customData)
      console.log(event.customData)
    }, this)

    this.node.on(IslandEvent.Type.SkinMenu, (event: IslandEvent) => {
      this.uiMgr.showSkinMenu(event.customData)
    }, this)

    this.node.on(PropEvent.Type.ShowInteraction, (event: PropEvent) => {
      this.uiMgr.updateActions(event.interactions)
    }, this)

    this.node.on(PlayerEvent.Type.OnAction, (event: PlayerEvent) => {
      let msg: Game.PlayerMsg = { cmd: Game.PlayerMsgType.Sync, state: event.action }
      BattleService.player().onAction(msg)
    }, this)
  }

  onEditTerrain() {
    let island = BattleService.island()
    if (island == null) return
    this.uiMgr.editHandler = island
    island.isEdit = !island.isEdit
    this.uiMgr.updateEditMode(island.isEdit)
  }

  async onUserInfoBind() {
    let profile = await UserService.profile()
    await BattleService.init()

    let player = BattleService.player(profile.id)
    if (player == null) {
      let player = instantiate(this.playerPrefab)
      player.position = v3(1, 3, 1)
      player.name = 'myself'
      this.node.addChild(player)
      let mgr = player.addComponent(MyselfMgr)
      mgr.init(profile, IslandAssetMgr.getCharacter(profile.id))
      mgr.followCamera = this.orbitCamera.node

      BattleService.addPlayer(profile.id, mgr)
      this.orbitCamera.target = mgr.node
      this.uiMgr.rockerTarget = mgr
    }
  }

  async onEnterIsland(id: string, uid?: string) {
    let islandId: string = null
    let timestamp: number = 0
    let mgr = BattleService.island(id)
    if (mgr == null) {
      let node = instantiate(this.islandPrefab)

      node.position = BattleService.randomPos()
      mgr = node.addComponent(IslandMgr)
      islandId = await mgr.init(id)
      BattleService.addIsland(mgr)
    }

    mgr.camera = this.orbitCamera.getComponent(Camera)
    mgr.reactArea = this.uiMgr.reactArea

    timestamp = Date.now()
    await BattleService.enter(BattleService.player(), mgr)
    this.uiMgr.canEdit(mgr.canEdit(BattleService.player().profile.id))
  }

  async onLeaveIsland() {
    BattleService.leave()
  }

  private async onReload() {
    BattleService.removeAllIsland()

    await this.preload()
  }

  private async preload() {
    let island = instantiate(IslandAssetMgr.getPrefab('bornIsland'))

    island.scale = v3(2, 2, 2)
    island.position = v3(0, 0.6, 0)
    this.node.addChild(island)

    let rigidBody = island.addComponent(RigidBody)
    rigidBody.type = RigidBody.Type.STATIC
    rigidBody.group = PhyEnvGroup.Terrain
    rigidBody.setMask(PhyEnvGroup.Player | PhyEnvGroup.Prop)
    let collider = island.addComponent(MeshCollider)
    collider.mesh = island.getComponent(MeshRenderer).mesh
    collider.convex = true

    let lighthouse = instantiate(IslandAssetMgr.getPrefab('lighthouse'))
    lighthouse.position = v3(4, 0.3, -4)
    lighthouse.scale = v3(1.5, 1.5, 1.5)
    this.node.addChild(lighthouse)

    let airBalloon = instantiate(IslandAssetMgr.getPrefab('hotAirBalloon'))
    airBalloon.position = v3(2, 3, -3)
    airBalloon.addComponent(BalloonMgr)
    this.node.addChild(airBalloon)

    if (LocalPrefs.myself) {
      this.onUserInfoBind()
    }

    let uids = [
      '645e0003955ff9912366489a'
      // '8f4e7438-4285-4268-910c-3898fb8d6d96',
      // 'f947ed55-7e34-4a82-a9db-8a9cf6f2e608',
      // '5ee13634-340c-4741-b075-7fe169e38a13',
      // '4e6434d1-5910-46c3-879d-733c33ded257',
      // 'b09272b8-d6a4-438b-96c3-df50ac206706'
    ]

    let ids = [
      '645f068dabba9d94a8b73920'
    ]

    for (let uid of uids) {
      let mgr = BattleService.island(null, uid)
      if (mgr == null) {
        let island = instantiate(this.islandPrefab)
        island.position = BattleService.randomPos()
        this.node.addChild(island)
        let mgr = island.getComponent(IslandMgr)
        await mgr.init(null, uid)
        // mgr.camera = this.mainCamera
        // mgr.editReactArea = this.uiMgr.editReactArea
        BattleService.addIsland(mgr)
      }
    }
  }
}