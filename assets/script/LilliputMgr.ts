import { AmbientInfo, Camera, Component, DirectionalLight, director, instantiate, Node, PhysicsSystem, Prefab, quat, Quat, SkyboxInfo, v3, _decorator } from 'cc'
const { ccclass, property } = _decorator

import BattleService from './BattleService'
import IslandAssetMgr from './IslandAssetMgr'
import IslandMgr, { IslandEvent } from './IslandMgr'
import { Game } from './model'
import OrbitCamera from './OrbitCamera'
import MyselfMgr from './player/MySelfMgr'
import { PlayerEvent } from './player/PlayerMgr'
import TerrainItemMgr, { PropEvent } from './TerrainItemMgr'
import RockerMgr from './ui/RockerMgr'
import UIMgr, { UIEvent } from './ui/UIMgr'
import UserService from './UserService'

@ccclass('LilliputMgr')
export default class LilliputMgr extends Component {

  @property(Camera)
  private mainCamera: Camera

  @property(DirectionalLight)
  private mainLight: DirectionalLight

  @property(Node)
  private bornNode: Node

  @property(Prefab)
  playerPrefab: Prefab

  @property(Prefab)
  islandPrefab: Prefab

  @property(Node)
  test: Node

  @property(Prefab)
  terrain: Prefab

  private skyboxInfo: SkyboxInfo
  private ambientInfo: AmbientInfo

  private isEidtEnv: boolean = false
  private rockerMgr: RockerMgr
  private orbitCamera: OrbitCamera
  private uiMgr: UIMgr
  private once: boolean = true
  private frameCount = 0

  private curInteractProp: number = -1

  private bornTerrainInfos: Array<Game.MapItem> = []

  private q_rotation = quat()
  private v3_0 = v3()

  private worldTime: number = 0
  private isDay: boolean = false
  private timecost: number = 0

  onLoad() {
    this.rockerMgr = this.getComponentInChildren(RockerMgr)
    this.orbitCamera = this.mainCamera.getComponent(OrbitCamera)
    this.uiMgr = this.getComponentInChildren(UIMgr)
    IslandAssetMgr.preload()
    this.timecost = new Date().getTime()

    this.node.on(UIEvent.Type.TerrainEdit, () => { this.onEditTerrain() }, this)
    this.node.on(UIEvent.Type.UserInfoBind, (event: UIEvent) => { this.onUserInfoBind(event.customData) }, this)
    this.node.on(UIEvent.Type.EnterIsland, (event: UIEvent) => { this.onEnterIsland(event.customData) }, this)
    this.node.on(IslandEvent.Type.SkinMenu, (event: IslandEvent) => { this.uiMgr.showSkinMenu(event.customData) }, this)
    this.node.on(PropEvent.Type.ShowInteraction, (event: PropEvent) => {
      this.curInteractProp = event.propIndex
      this.uiMgr.updateActions(event.interactions)
    }, this)

    this.node.on(PlayerEvent.Type.OnAction, (event: PlayerEvent) => {
      BattleService.island()?.handleInteract(this.curInteractProp, event.action)

      let msg: Game.Msg = { type: Game.MsgType.Cmd, state: event.action }
      if (msg.state == Game.CharacterState.Run) {
        msg.pos = { x: 1, y: 1, z: 2 }
      }
      BattleService.player().onAction(msg)
      BattleService.sendGameMsg(msg)
    }, this)

    this.ambientInfo = director.getScene().globals.ambient
    this.skyboxInfo = director.getScene().globals.skybox
  }


  start() {
    this.updateEditMode(this.isEidtEnv, true)

    this.orbitCamera.target = this.bornNode
    this.bornNode.getChildByName('fences').children.forEach(it => {
      let angle = Quat.getAxisAngle(this.v3_0, it.rotation)
      angle = angle * 180 / Math.PI * this.v3_0.y
      let info: Game.MapItem = { x: it.position.x, y: it.position.y, z: it.position.z, prefab: it.name, angle }
      this.bornTerrainInfos.push(info)
    })

    this.bornNode.getChildByName('ground').children.forEach(it => {
      let angle = Quat.getAxisAngle(this.v3_0, it.rotation)
      angle = angle * 180 / Math.PI * this.v3_0.y
      let info: Game.MapItem = { x: it.position.x, y: it.position.y, z: it.position.z, prefab: it.name, angle }
      this.bornTerrainInfos.push(info)
    })
  }

  update(dt: number) {
    if (!IslandAssetMgr.isPreloaded) {
      this.uiMgr.updateLoading(true, `资源（${IslandAssetMgr.preloadCount}/${IslandAssetMgr.resouceCount}）加载中。。。`)
    } else {
      if (this.once) {
        this.once = false
        this.uiMgr.updateLoading(false)

        console.log('resouce load cost:', new Date().getTime() - this.timecost)
        this.generateBornTerrain()
      }
    }

    if (this.isDay) {
      if (this.ambientInfo.skyIllum < 50000) {
        this.ambientInfo.skyIllum += 100
      } else {
        this.isDay = false
      }
    } else {
      if (this.ambientInfo.skyIllum > 10000) {
        this.ambientInfo.skyIllum -= 100
      } else {
        this.isDay = true
      }
    }

    if (this.skyboxInfo.rotationAngle >= 360) {
      this.skyboxInfo.rotationAngle = 0
    } else {
      this.skyboxInfo.rotationAngle += dt * 2
    }

    if (this.frameCount < 2) {
      this.frameCount++
    } else {
      this.frameCount = 0
      if (BattleService.started)
        BattleService.sendGameMsg({ type: Game.MsgType.Cmd })
    }
  }

  onDestroy() {
    console.log('destroy')
  }

  onEditTerrain() {
    this.isEidtEnv = !this.isEidtEnv
    this.updateEditMode(this.isEidtEnv)
  }

  async onUserInfoBind(token: string) {
    if (UserService.accessToken == token) return

    UserService.accessToken = token
    let profile = await UserService.profile()
    await BattleService.init(this.playerPrefab, this.islandPrefab)

    let player = BattleService.player(profile.uid)
    if (player == null) {
      let player = instantiate(this.playerPrefab)
      player.position = v3(1, 3, 1)
      player.name = 'myself'
      this.node.addChild(player)
      player.addComponent(MyselfMgr)
      player.getComponent(MyselfMgr).init(profile)
      let mgr = player.getComponent(MyselfMgr)
      mgr.followCamera = this.orbitCamera.node
      mgr.followLight = this.mainLight

      BattleService.addPlayer(profile.uid, mgr)
      this.orbitCamera.target = mgr.node
      this.rockerMgr.target = mgr
    }
  }

  async onEnterIsland(uid: string) {
    let islandId: string = null
    let timestamp: number = 0
    let island = BattleService.userIsland(uid)
    if (island == null) {
      let node = instantiate(this.islandPrefab)

      node.position = BattleService.randomPos()
      this.node.addChild(node)
      let mgr = node.getComponent(IslandMgr)
      timestamp = new Date().getTime()
      islandId = await mgr.loadMap(uid)
      console.log('island render:', new Date().getTime() - timestamp)

      mgr.camera = this.mainCamera
      mgr.editReactArea = this.uiMgr.editReactArea
      BattleService.addIsland(islandId, mgr)
      island = BattleService.island(islandId)
    }

    timestamp = new Date().getTime()
    await BattleService.enter(BattleService.player(), island)
    this.uiMgr.canEdit(BattleService.canEdit())
  }

  async onLeaveIsland() {
    BattleService.leave()
  }

  private generateBornTerrain() {
    this.bornTerrainInfos.forEach(it => {
      let prefab = IslandAssetMgr.getPrefab(it.prefab)
      if (prefab == null) return
      let node = instantiate(prefab)
      node.position = v3(it.x, it.y, it.z)
      Quat.rotateY(this.q_rotation, node.rotation, Math.PI / 180 * it.angle)
      node.rotation = this.q_rotation
      this.bornNode.addChild(node)
      node.addComponent(TerrainItemMgr)
      let mgr = node.getComponent(TerrainItemMgr)
      mgr.init(it)
    })
  }

  private updateEditMode(isEdit: boolean, init?: boolean) {
    if (isEdit) {
      let myIsland = BattleService.userIsland()
      if (myIsland == null) return

      let rotation = v3(this.orbitCamera.targetRotation)
      rotation.x = 30
      this.orbitCamera.updateTargetRotation(rotation)
      this.orbitCamera.reactArea = this.uiMgr.editCameraReactArea
      this.uiMgr.editHandler = myIsland
    } else {
      this.orbitCamera.reactArea = this.uiMgr.cameraReactArea
    }
    this.uiMgr.updateEditMode(isEdit)
  }
}