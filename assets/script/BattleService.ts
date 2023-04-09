
import { instantiate, Prefab, v3, Vec3 } from 'cc'
import IslandMgr from './IslandMgr'
import { Game, User } from './model'
import OtherMgr from './player/OtherMgr'
import PlayerMgr from './player/PlayerMgr'
import UserService from './UserService'

// import msgClient, { MessageHandler } from './PahoMsgClient'


interface MessageHandler {
  onMessageArrived(msg: Array<Game.Msg>): void
}
class LocalMsgClient {
  isLocal: boolean = true
  msgHanlder: MessageHandler

  init(uid: string) { }
  subscribe(topic: string) { }
  unsubscribe(topic: string) { }
  send(topic: string, messages: string) { }
}
let msgClient = new LocalMsgClient()

const offset = 20

class BattleService implements MessageHandler {
  private static _instance: BattleService

  private _curIsland: Game.Island = null

  get curIsland() { return this._curIsland }

  private _isStart: boolean = false
  get started() { return this._isStart }

  private gameMsgs: Array<Game.PlayerMsg>
  private timer: any = null
  private gameFrame: number
  private playerRemoteFrames: Map<string, Array<Game.PlayerMsg>> = new Map()
  private playerLocalFrames: Map<string, Array<Game.PlayerMsg>> = new Map()
  private myself: User.Profile

  private players: Map<string, PlayerMgr> = new Map()
  private islands: Map<string, IslandMgr> = new Map()

  private positions: Array<{ pos: Vec3, existed: boolean }> = []

  private playerPrefab: Prefab = null
  private islandPrefab: Prefab = null

  private lstFrameState: Game.CharacterState = Game.CharacterState.None

  private _delay: number = 0
  get delay() { return this._delay }

  static instance() {

    if (!BattleService._instance) {
      BattleService._instance = new BattleService()
    }

    return BattleService._instance
  }

  private constructor() {
    this._curIsland = null
    this.gameMsgs = new Array()
    this.timer = null
    this.gameFrame = 0
    this.myself = null

    this.positions.push({ pos: v3(offset, 0, offset), existed: false })
    this.positions.push({ pos: v3(offset, 0, -offset), existed: false })
    this.positions.push({ pos: v3(offset, 0, 0), existed: false })
    this.positions.push({ pos: v3(0, 0, offset), existed: false })
    this.positions.push({ pos: v3(0, 0, -offset), existed: false })
    this.positions.push({ pos: v3(-offset, 0, offset), existed: false })
    this.positions.push({ pos: v3(-offset, 0, -offset), existed: false })
    this.positions.push({ pos: v3(-offset, 0, 0), existed: false })
  }

  sendPlayerMsg(msg: Game.PlayerMsg) {
    msg.type = Game.MsgType.Player
    if (this._curIsland == null || this.island().isEdit || this.player() == null || !this.player().canSync) return
    if (msg.cmd == Game.PlayerMsgType.Sync && this.lstFrameState == Game.CharacterState.Idle && this.player().state == this.lstFrameState) return

    if (msg.state == null &&
      this.player().state != Game.CharacterState.Idle &&
      this.player().state != Game.CharacterState.Run &&
      this.player().state != Game.CharacterState.BoxIdle &&
      this.player().state != Game.CharacterState.BoxWalk)
      return


    msg.uid = this.myself.uid
    msg.seq = this.gameFrame++
    msg.state = msg.state ? msg.state : this.player().state
    msg.pos = this.v3ToXYZ(this.player()?.node.position)


    if (this.player().state == Game.CharacterState.Idle) {
      msg.dir = this.v3ToXYZ(this.player()?.node.forward)
    }

    this.gameMsgs.push(msg)
    this.lstFrameState = msg.state
  }

  async init(playerPrefab: Prefab, islandPrefab: Prefab) {
    this.playerPrefab = playerPrefab
    this.islandPrefab = islandPrefab
    this.myself = await UserService.profile()
    msgClient.init(this.myself.uid)
  }

  player(uid?: string) {
    try {
      if (uid == null)
        return this.players.get(this.myself.uid)
      else
        return this.players.get(uid)
    } catch (err) {
      return null
    }

  }

  addPlayer(uid: string, mgr: PlayerMgr) {
    this.players.set(uid, mgr)
    this.playerRemoteFrames.delete(uid)
  }

  isMyself(uid: string) {
    return this.myself.uid == uid
  }

  canEdit(): boolean {
    if (this._curIsland == null || this.myself == null) return false
    return this._curIsland.owner == this.myself.uid
  }

  removePlayer(uid: string) {
    this.players.get(uid)?.node.destroy()
    this.players.delete(uid)
    this.playerRemoteFrames.delete(uid)
  }

  userIsland(uid?: string) {
    if (uid == null) uid = this.myself.uid

    for (let island of this.islands.values()) {
      if (island.senceInfo?.owner == uid) {
        return island
      }
    }
    return null
  }

  randomPos() {
    // return v3(0, 0, 0)
    let ps = this.positions.filter(it => { return !it.existed })
    let idx = Math.ceil(Math.random() * (ps.length - 1))
    return ps[idx].pos

  }

  island(id?: string) {
    if (id == null) {
      if (this._curIsland) return this.islands.get(this._curIsland._id)
      else return null
    }
    return this.islands.get(id)
  }

  addIsland(id: string, mgr: IslandMgr) {
    this.islands.set(id, mgr)
    let idx = this.positions.findIndex(it => {
      return mgr.node.position.equals(it.pos)
    })
    if (idx != -1) {
      this.positions[idx].existed = true
    }
  }

  removeIsland(id: string) {
    this.islands.get(id)?.node.destroy()
    this.islands.delete(id)

  }

  removeAllIsland() {
    this.positions.forEach(it => { it.existed = false })
    for (let key of this.islands.keys()) {
      this.islands.get(key)?.node.destroy()
      this.islands.delete(key)
    }
  }

  async enter(player: PlayerMgr, island: IslandMgr) {
    if (this._curIsland) {
      if (this._curIsland._id == island.senceInfo._id) { } else {
        this.stop()
      }
    }
    await this.start(island.senceInfo)
    player.node.removeFromParent()
    player.node.active = false
    this.playerRemoteFrames.delete(player.userProfile.uid)

    player.node.position.set(Vec3.ONE)
    island.node.addChild(player.node)
    player.node.active = true
    player.resume()
    this.sendPlayerMsg({ cmd: Game.PlayerMsgType.Enter, state: Game.CharacterState.Idle })
  }

  leave() {
    this.player()?.node.removeFromParent()
    this.sendPlayerMsg({ cmd: Game.PlayerMsgType.Leave, state: Game.CharacterState.Idle })
    this.stop()
  }

  private async start(island: Game.Island) {
    this._curIsland = island
    this.gameFrame = 0
    msgClient.msgHanlder = this
    msgClient.subscribe(`_game/island/${this.curIsland._id}`)

    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(() => {
      if (this.gameMsgs.length == 0) return

      if (msgClient.isLocal) {
        // this.mockTimer()
      } else {
        msgClient.send(`_game/island/${this.curIsland._id}`, JSON.stringify(this.gameMsgs))
        this.gameMsgs.splice(0, this.gameMsgs.length)
      }
    }, 70)

    this._isStart = true

    if (msgClient.isLocal) {
      this.mockTimer()
    }
  }

  private mockTimer() {
    this._delay = Math.floor(30 + Math.random() * 400)
    setTimeout(() => {
      msgClient.msgHanlder.onMessageArrived(this.gameMsgs)
      this.gameMsgs.splice(0, this.gameMsgs.length)
      this.mockTimer()
    }, this._delay)

    // setInterval(()=>{
    //   msgClient.msgHanlder.onMessageArrived(this.gameMsgs)
    //   this.gameMsgs.splice(0, this.gameMsgs.length)
    // }, 400)
  }

  async onMessageArrived(msgs: Array<Game.Msg>) {
    msgs.forEach(async (it) => {
      // if (this.myself.uid == it.uid) return
      switch (it.type) {
        case Game.MsgType.Player:
          await this.handlePlayerMsg(it as Game.PlayerMsg)
          break
        case Game.MsgType.Prop:
          await this.handlePropMsg(it as Game.PropMsg)
          break
      }
    })
  }


  private async handlePlayerMsg(msg: Game.PlayerMsg) {
    switch (msg.cmd) {
      case Game.PlayerMsgType.Enter:
        let uid = this.myself.uid == msg.uid ? 'shadow' : msg.uid
        let island = this.island(this.curIsland._id)
        let mgr = this.player(uid)
        let profile = await UserService.profile(msg.uid)
        profile.uid = uid
        if (mgr == null) {
          let player = instantiate(this.playerPrefab)
          player.addComponent(OtherMgr)
          island.node.addChild(player)
          mgr = player.getComponent(OtherMgr)
          mgr.init(profile)
          this.addPlayer(uid, mgr)
        } else {
          mgr.node.removeFromParent()
          mgr.node.position = Vec3.ZERO
          mgr.resume()
        }
        island.node.addChild(mgr.node)
        mgr.node.position = v3(msg.pos.x, msg.pos.y, msg.pos.z)
        break
      case Game.PlayerMsgType.Sync:
        if (msg.uid == this.myself.uid) msg.uid = 'shadow'
        this.pushPlayerFrame(msg)
        break
      case Game.PlayerMsgType.Leave:
        if (msg.uid == this.myself.uid) msg.uid = 'shadow'
        this.removePlayer(msg.uid)
        break
    }
  }

  private async handlePropMsg(msg: Game.PropMsg) {

  }

  private stop() {
    msgClient.unsubscribe(`_game/island/${this.curIsland?._id}`)
    this._curIsland = null
    if (this.timer) clearInterval(this.timer)
    this._isStart = false
  }

  pushPlayerFrame(msg: Game.PlayerMsg) {
    if (!this.playerRemoteFrames.has(msg.uid)) this.playerRemoteFrames.set(msg.uid, [])
    let arr = this.playerRemoteFrames.get(msg.uid)
    arr.push(msg)
  }

  popPlayerFrame(uid: string) {
    if (uid != this.myself.uid && this.playerRemoteFrames.has(uid))
      return this.playerRemoteFrames.get(uid).shift()
    return null
  }

  playerFrameCount(uid: string) {
    return this.playerRemoteFrames.get(uid)?.length
  }

  pushPropFrame(msg: Game.PropMsg) {

  }

  popPropFrame(propId: number) {

  }

  private v3ToXYZ(pos: Vec3) {
    return { x: pos.x, y: pos.y, z: pos.z }
  }

}

export default BattleService.instance()