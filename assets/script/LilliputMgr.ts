import { Camera, Component, DirectionalLight, geometry, instantiate, Node, Prefab, v3, _decorator } from 'cc'
import { Game } from './model'
import OrbitCamera from './OrbitCamera'
import PlayerMgr, { PlayerActionEvent } from './PlayerMgr'
import TerrainAssetMgr from './TerrainAssetMgr'
import TerrainMgr from './TerrainMgr'
import RockerMgr from './ui/RockerMgr'
import UIMgr from './ui/UIMgr'
const { ccclass, property } = _decorator

import BattleService from './BattleService'
import { MessageHandler } from './PahoMsgClient'
import UserService from './UserService'

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
  terrainPrefab: Prefab


  isEidtEnv: boolean = false

  private rockerMgr: RockerMgr
  private orbitCamera: OrbitCamera
  private uiMgr: UIMgr

  private players: Map<string, PlayerMgr> = new Map()
  private islands: Map<string, TerrainMgr> = new Map()

  private mySelf: PlayerMgr

  private once: boolean = true

  private gameFrameSeq: number = 0

  onLoad() {
    this.rockerMgr = this.getComponentInChildren(RockerMgr)
    this.orbitCamera = this.mainCamera.getComponent(OrbitCamera)
    this.uiMgr = this.getComponentInChildren(UIMgr)
    TerrainAssetMgr.preload()

    this.node.on('ShowSkinMenu', () => { this.uiMgr.showSkinMenu() }, this)

    this.node.on(PlayerActionEvent.name, (event: any) => { this.mySelf.onAction(event.action) }, this)
  }

  start() {
    this.updateEditMode(this.isEidtEnv, true)

    let ray = new geometry.Ray()
    geometry.Ray.fromPoints(ray, v3(0, 0, 0), v3(1, 0, 1))
    console.log(ray)

    this.orbitCamera.target = this.bornNode
  }

  update(dt: number) {
    if (!TerrainAssetMgr.isPreloaded) {
      this.uiMgr.updateLoading(true, `资源（${TerrainAssetMgr.preloadCount}/${TerrainAssetMgr.resouceCount}）加载中。。。`)
    } else {
      if (this.once) {
        this.once = false
        this.uiMgr.updateLoading(false)
      }
    }
  }

  onMessageArrived(msgs: Array<Game.Msg>) {
    msgs.forEach(async (it) => {
      if (this.mySelf.userProfile.uid == it.uid) return
      switch (it.type) {
        case Game.MsgType.Enter:
          if (!this.players.has(it.uid)) {
            let player = instantiate(this.playerPrefab)
            player.position = v3(it.pos.x, it.pos.y, it.pos.z)
            let profile = await UserService.profile(it.uid)
            let island = this.islands.get(BattleService.curIsland._id)
            island.node.addChild(player)
            player.addComponent(PlayerMgr).init(profile)
            this.players.set(profile.uid, player.getComponent(PlayerMgr))
          }
          break
        case Game.MsgType.Cmd:
          this.players.get(it.uid).onAction(it.state)
          break
        case Game.MsgType.Leave:
          this.players.get(it.uid)?.node.destroy()
          this.players.delete(it.uid)
          break
      }
    })
  }

  async onAction(event: Event, data: string) {
    if (this.mySelf == null) return
    let state = Number.parseInt(data) as Game.CharacterState
    this.mySelf?.onAction(state)

    if (state == Game.CharacterState.Kicking) {
      // this.terrainMgr.shake(this.playerMgr.node.forward.negative())
    }

    let msg: Game.Msg = {
      type: Game.MsgType.Cmd,
      pos: this.mySelf.node.position,
      state
    }
    BattleService.sendGameMsg(msg)
  }

  onEditTerrain() {
    this.isEidtEnv = !this.isEidtEnv
    this.updateEditMode(this.isEidtEnv)
  }

  async onUserInfoBind() {
    if (UserService.accessToken == this.uiMgr.inputToken) return

    UserService.accessToken = this.uiMgr.inputToken
    let profile = await UserService.profile()

    if (!this.players.has(profile.uid)) {
      let player = instantiate(this.playerPrefab)
      player.position = v3(0, 1, 0)
      this.node.addChild(player)
      player.getComponent(PlayerMgr).init(profile)
      this.mySelf = player.getComponent(PlayerMgr)
      this.mySelf.followCamera = this.orbitCamera.node
      this.mySelf.followLight = this.mainLight
      this.players.set(profile.uid, this.mySelf)
      this.orbitCamera.target = this.mySelf.node
      this.rockerMgr.target = this.mySelf
    }

    BattleService.init()
  }

  async onEnterIsland() {
    let otherUid = this.uiMgr.inputRoomId

    let islandId: string = null
    for (let island of this.islands.values()) {
      if (island.senceInfo?.owner == otherUid) {
        islandId = island.senceInfo._id
        break
      }
    }

    if (islandId == null) {
      let island = instantiate(this.terrainPrefab)
      island.position = v3(-10, 0, -10)
      this.node.addChild(island)
      let mgr = island.getComponent(TerrainMgr)
      islandId = await mgr.loadMap(otherUid)
      mgr.camera = this.mainCamera
      mgr.editReactArea = this.uiMgr.editReactArea
      this.islands.set(islandId, mgr)
    }

    let mgr = this.islands.get(islandId)

    BattleService.start(mgr.senceInfo, this)
    let pos = v3(1, 1, 1)
    let msg: Game.Msg = {
      uid: this.mySelf.userProfile.uid,
      type: Game.MsgType.Enter,
      state: Game.CharacterState.Idle,
      pos
    }
    let island = this.islands.get(islandId)
    this.mySelf.node.removeFromParent()
    island.node.addChild(this.mySelf.node)
    this.mySelf.node.position = pos
    BattleService.sendGameMsg(msg)

  }

  private getMyIsland() {
    for (let island of this.islands.values()) {
      if (island.senceInfo.owner == this.mySelf.getComponent(PlayerMgr).userProfile.uid) return island
    }
    return null
  }

  private updateEditMode(isEdit: boolean, init?: boolean) {
    if (isEdit) {
      let myIsland = this.getMyIsland()
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