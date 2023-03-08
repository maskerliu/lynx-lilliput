import { Camera, Component, DirectionalLight, geometry, instantiate, Node, Prefab, quat, Quat, v3, _decorator } from 'cc'
import IslandMgr, { SkinMenuEvent } from './IslandMgr'
import { Game } from './model'
import OrbitCamera from './OrbitCamera'
import PlayerMgr, { PlayerActionEvent } from './PlayerMgr'
import TerrainAssetMgr from './TerrainAssetMgr'
import RockerMgr from './ui/RockerMgr'
import UIMgr from './ui/UIMgr'
const { ccclass, property } = _decorator

import BattleService from './BattleService'
import { MessageHandler } from './PahoMsgClient'
import UserService from './UserService'
import TerrainItemMgr from './TerrainItemMgr'

@ccclass('LilliputMgr')
export default class LilliputMgr extends Component implements MessageHandler {

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

  private isEidtEnv: boolean = false
  private rockerMgr: RockerMgr
  private orbitCamera: OrbitCamera
  private uiMgr: UIMgr
  private once: boolean = true
  private frameCount = 0

  private bornTerrainInfos: Array<Game.MapItem> = []

  private q_rotation = quat()
  private v3_0 = v3()

  onLoad() {
    this.rockerMgr = this.getComponentInChildren(RockerMgr)
    this.orbitCamera = this.mainCamera.getComponent(OrbitCamera)
    this.uiMgr = this.getComponentInChildren(UIMgr)
    TerrainAssetMgr.preload()

    this.node.on(SkinMenuEvent.name, (event: SkinMenuEvent) => { this.uiMgr.showSkinMenu(event.show) }, this)
    this.node.on(PlayerActionEvent.name, (event: PlayerActionEvent) => {
      let msg: Game.Msg = { type: Game.MsgType.Cmd, state: event.action }
      if (msg.state == Game.CharacterState.Running) {
        msg.pos = { x: 1, y: 1, z: 2 }
      }
      BattleService.player().onAction(msg)
      BattleService.sendGameMsg(msg)
    }, this)


    // if (this.test.up.equals(Vec3.UNIT_Y)) {
    //   console.log(true)
    // }

    // console.log(this.test.up, this.test.rotation)
  }

  start() {
    this.updateEditMode(this.isEidtEnv, true)

    let ray = new geometry.Ray()
    geometry.Ray.fromPoints(ray, v3(0, 0, 0), v3(1, 0, 1))
    console.log(ray)

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

  private generateBornTerrain() {
    this.bornTerrainInfos.forEach(it => {
      let prefab = TerrainAssetMgr.getPrefab(it.prefab)
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

  update(dt: number) {
    if (!TerrainAssetMgr.isPreloaded) {
      this.uiMgr.updateLoading(true, `资源（${TerrainAssetMgr.preloadCount}/${TerrainAssetMgr.resouceCount}）加载中。。。`)
    } else {
      if (this.once) {
        this.once = false
        this.uiMgr.updateLoading(false)

        this.generateBornTerrain()
      }
    }

    if (this.frameCount < 10) {
      this.frameCount++
    } else {
      this.frameCount = 0
      if (BattleService.isStart)
        BattleService.sendGameMsg({ type: Game.MsgType.Cmd })
    }
  }

  async onMessageArrived(msgs: Array<Game.Msg>) {
    let myself = await UserService.profile()
    msgs.forEach(async (it) => {
      if (myself.uid == it.uid) return
      switch (it.type) {
        case Game.MsgType.Enter:
          let island = BattleService.island(BattleService.curIsland._id)
          let mgr = BattleService.player(it.uid)
          let profile = await UserService.profile(it.uid)
          if (mgr == null) {
            let player = instantiate(this.playerPrefab)
            mgr = player.getComponent(PlayerMgr)
            BattleService.addPlayer(profile.uid, mgr)
          }
          mgr.node.removeFromParent()
          island.node.addChild(mgr.node)
          mgr.init(profile)
          mgr.node.position = v3(it.pos.x, it.pos.y, it.pos.z)
          break
        case Game.MsgType.Cmd:
          BattleService.pushGameFrame(it)
          break
        case Game.MsgType.Leave:
          BattleService.removePlayer(it.uid)
          break
      }
    })
  }

  onEditTerrain() {
    this.isEidtEnv = !this.isEidtEnv
    this.updateEditMode(this.isEidtEnv)
  }

  async onUserInfoBind() {
    if (UserService.accessToken == this.uiMgr.inputToken) return

    UserService.accessToken = this.uiMgr.inputToken
    let profile = await UserService.profile()
    await BattleService.init()

    let player = BattleService.player(profile.uid)
    if (player == null) {
      let player = instantiate(this.playerPrefab)
      player.position = v3(0, 1, 0)
      this.node.addChild(player)
      player.getComponent(PlayerMgr).init(profile)
      let mgr = player.getComponent(PlayerMgr)
      mgr.followCamera = this.orbitCamera.node
      mgr.followLight = this.mainLight

      BattleService.addPlayer(profile.uid, mgr)
      this.orbitCamera.target = mgr.node
      this.rockerMgr.target = mgr
    }
  }

  async onEnterIsland() {
    let otherUid = this.uiMgr.inputRoomId

    let islandId: string = null

    let island = BattleService.userIsland(otherUid)
    if (island == null) {
      let island = instantiate(this.islandPrefab)

      island.position = BattleService.randomPos()
      this.node.addChild(island)
      let mgr = island.getComponent(IslandMgr)
      islandId = await mgr.loadMap(otherUid)
      mgr.camera = this.mainCamera
      mgr.editReactArea = this.uiMgr.editReactArea
      BattleService.addIsland(islandId, mgr)
    } else {
      islandId = island.senceInfo._id
    }

    island = BattleService.island(islandId)
    BattleService.start(island.senceInfo, this)
    BattleService.enter(BattleService.player(), island)
    this.uiMgr.canEdit(BattleService.canEdit())
    BattleService.sendGameMsg({ type: Game.MsgType.Enter, state: Game.CharacterState.Idle })

  }

  async onLeaveIsland() {

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