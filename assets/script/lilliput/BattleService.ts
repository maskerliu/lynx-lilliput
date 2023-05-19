import { instantiate, Prefab, v3, Vec3 } from 'cc'
import PlayerMgr from '../common/PlayerMgr'
import { v3ToXYZ } from '../misc/Utils'
import { Game, User } from '../model'
import IslandAssetMgr from './IslandAssetMgr'
import IslandMgr from './IslandMgr'
import OtherMgr from './player/OtherMgr'
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

  private _playerPrefab: Prefab = null
  set playerPrefab(prefab: Prefab) { this._playerPrefab = prefab }

  private players: Map<string, PlayerMgr> = new Map()
  private islands: Map<string, IslandMgr> = new Map()

  private positions: Array<{ pos: Vec3, existed: boolean }> = []


  private lstFrameState: Game.CharacterState = Game.CharacterState.None

  private _interval = 0
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
    if (this._curIsland == null) return

    msg.uid = this.myself.id
    msg.seq = this.gameFrame++

    this.gameMsgs.push(msg)
    this.lstFrameState = msg.state
  }

  async init() {
    this.myself = await UserService.profile()
    msgClient.init(this.myself.id)
  }

  player(uid?: string) {
    try {
      if (uid == null)
        return this.players.get(this.myself.id)
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
    return this.myself.id == uid
  }

  canEdit(): boolean {
    if (this._curIsland == null || this.myself == null) return false
    return this._curIsland.owner == this.myself.id
  }

  removePlayer(uid: string) {
    this.players.get(uid)?.node.destroy()
    this.players.delete(uid)
    this.playerRemoteFrames.delete(uid)
  }

  randomPos() {
    // return v3(0, 0, 0)
    let ps = this.positions.filter(it => { return !it.existed })
    let idx = Math.ceil(Math.random() * (ps.length - 1))
    return ps[idx].pos

  }

  island(id?: string, uid?: string) {

    if (id == null && uid == null) return this.islands.get(this._curIsland.id)

    if (id) {
      return this.islands.get(id)
    }

    if (uid) {
      for (let island of this.islands.values()) {
        if (island.senceInfo?.owner == uid) {
          return island
        }
      }
    }

    return null
  }

  addIsland(mgr: IslandMgr) {
    this.islands.set(mgr.senceInfo.id, mgr)
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
      if (this._curIsland.id == island.senceInfo.id) { } else {
        this.stop()
      }
    }
    await this.start(island.senceInfo)
    player.node.removeFromParent()
    player.node.active = false
    this.playerRemoteFrames.delete(player.profile.id)

    player.node.position = v3(1, 1.5, 1)
    island.node.addChild(player.node)
    player.node.active = true
    player.resume()
    this.sendPlayerMsg({
      cmd: Game.PlayerMsgType.Enter,
      state: Game.CharacterState.Idle,
      pos: v3ToXYZ(player.node.position),
      dir: v3ToXYZ(player.node.forward)
    })

    console.log(island)
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
    msgClient.subscribe(`_game/island/${this.curIsland.id}`)

    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(() => {
      if (this.gameMsgs.length == 0) return

      // if (this._interval >= 15) {
      //   this._interval = 0
      //   this._delay = Math.floor(30 + Math.random() * 400)
      // } else {
      //   this._interval++
      // }

      if (msgClient.isLocal) {
        // this.mockTimer()
      } else {
        msgClient.send(`_game/island/${this.curIsland.id}`, JSON.stringify(this.gameMsgs))
        this.gameMsgs.splice(0, this.gameMsgs.length)
      }
    }, 70)

    this._isStart = true

    if (msgClient.isLocal) {
      this.mockConsume()
    }
  }

  private mockConsume() {

    let delay = Math.floor(30 + Math.random() * 400)
    setTimeout(() => {
      msgClient.msgHanlder.onMessageArrived(this.gameMsgs)
      this.gameMsgs.splice(0, this.gameMsgs.length)
      this.mockConsume()
    }, delay)
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
        let uid = this.myself.id == msg.uid ? 'shadow' : msg.uid
        let island = this.island(this.curIsland.id)
        let mgr = this.player(uid)
        let profile = await UserService.profile(msg.uid)
        profile.id = uid
        if (mgr == null) {
          let player = instantiate(this._playerPrefab)
          island.node.addChild(player)
          mgr = player.addComponent(OtherMgr).init(profile, IslandAssetMgr.getCharacter(profile.id))
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
        if (msg.uid == this.myself.id) msg.uid = 'shadow'
        this.pushPlayerFrame(msg)
        break
      case Game.PlayerMsgType.Leave:
        if (msg.uid == this.myself.id) msg.uid = 'shadow'
        this.removePlayer(msg.uid)
        break
    }
  }

  private async handlePropMsg(msg: Game.PropMsg) {

  }

  private stop() {
    msgClient.unsubscribe(`_game/island/${this.curIsland?.id}`)
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
    if (uid != this.myself.id && this.playerRemoteFrames.has(uid))
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

}

export default BattleService.instance()