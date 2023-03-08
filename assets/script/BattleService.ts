
import { v3, Vec3 } from 'cc'
import { Game, User } from './model'
import PlayerMgr from './PlayerMgr'
import IslandMgr from './IslandMgr'
import UserService from './UserService'

// import msgClient, { MessageHandler } from './PahoMsgClient'
let msgClient: any = {
  init() { },
  subscribe() { },
  unsubscribe() { },
  send() { },
}
interface MessageHandler { }

const offset = 20

class BattleService {

  private static _instance: BattleService

  private _curIsland: Game.Island = null

  get curIsland() { return this._curIsland }

  private _isStart: boolean = false
  get isStart() { return this._isStart }

  private gameMsgs: Array<Game.Msg>
  private timer: any = null
  private gameFrame: number
  private gameFrames: Map<string, Array<Game.Msg>> = new Map()
  private profile: User.Profile

  private players: Map<string, PlayerMgr> = new Map()
  private islands: Map<string, IslandMgr> = new Map()

  private positions: Array<{ pos: Vec3, existed: boolean }> = []

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
    this.profile = null

    this.positions.push({ pos: v3(offset, 0, offset), existed: false })
    this.positions.push({ pos: v3(offset, 0, -offset), existed: false })
    this.positions.push({ pos: v3(offset, 0, 0), existed: false })
    this.positions.push({ pos: v3(0, 0, offset), existed: false })
    this.positions.push({ pos: v3(0, 0, -offset), existed: false })
    this.positions.push({ pos: v3(-offset, 0, offset), existed: false })
    this.positions.push({ pos: v3(-offset, 0, -offset), existed: false })
    this.positions.push({ pos: v3(-offset, 0, 0), existed: false })
  }

  sendGameMsg(msg: Game.Msg) {
    if (this._curIsland == null || this.player() == null) return
    if (msg.state == null &&
      this.player().state != Game.CharacterState.Idle &&
      this.player().state != Game.CharacterState.Running)
      return

    msg.uid = this.profile.uid
    msg.seq = this.gameFrame++
    msg.state = msg.state ? msg.state : this.player().state
    msg.pos = this.v3ToXYZ(this.player()?.node.position)

    if (this.player().state == Game.CharacterState.Idle) {
      msg.dir = this.v3ToXYZ(this.player()?.node.forward)
    }

    this.gameMsgs.push(msg)
  }

  async init() {
    this.profile = await UserService.profile()
    msgClient.init(this.profile.uid)
  }

  player(uid?: string) {
    if (uid == null)
      return this.players.get(this.profile.uid)
    else
      return this.players.get(uid)
  }

  addPlayer(uid: string, mgr: PlayerMgr) {
    this.players.set(uid, mgr)
    this.gameFrames.delete(uid)
  }

  isMyself(uid: string) {
    return this.profile.uid == uid
  }

  canEdit(): boolean {
    if (this._curIsland == null || this.profile == null) return false
    return this._curIsland.owner == this.profile.uid
  }

  removePlayer(uid: string) {
    this.players.get(uid)?.node.destroy()
    this.players.delete(uid)
    this.gameFrames.delete(uid)
  }

  userIsland(uid?: string) {
    if (uid == null) uid = this.profile.uid

    for (let island of this.islands.values()) {
      if (island.senceInfo?.owner == uid) {
        return island
      }
    }
    return null
  }

  randomPos() {
    let ps = this.positions.filter(it => { return !it.existed })
    let idx = Math.ceil(Math.random() * (ps.length - 1))
    return ps[idx].pos
  }

  island(id: string) {
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


  enter(player: PlayerMgr, island: IslandMgr) {
    player.node.removeFromParent()
    island.node.addChild(player.node)
    player.node.position = Vec3.ONE
    this.sendGameMsg({ type: Game.MsgType.Enter, state: Game.CharacterState.Idle })
  }

  leave(player: PlayerMgr, island: IslandMgr) {
    player.node.removeFromParent()
    this.sendGameMsg({ type: Game.MsgType.Leave, state: Game.CharacterState.Idle })
  }

  async start(island: Game.Island, handler: MessageHandler) {
    this._curIsland = island
    this.gameFrame = 0
    msgClient.msgHanlder = handler
    msgClient.subscribe(`_game/island/${this.curIsland._id}`)
    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(() => {
      if (this.gameMsgs.length == 0) return

      msgClient.send(`_game/island/${this.curIsland._id}`, JSON.stringify(this.gameMsgs))
      this.gameMsgs.splice(0, this.gameMsgs.length)
    }, 50)

    this._isStart = true
  }

  stop() {
    msgClient.unsubscribe(`_game/island/${this.curIsland._id}`)
    this._curIsland = null
    if (this.timer) clearInterval(this.timer)
    this._isStart = false
  }

  pushGameFrame(msg: Game.Msg) {
    if (!this.gameFrames.has(msg.uid)) this.gameFrames.set(msg.uid, [])
    let arr = this.gameFrames.get(msg.uid)
    arr.push(msg)
  }

  popGameFrame(uid: string) {
    if (uid != this.profile.uid && this.gameFrames.has(uid))
      return this.gameFrames.get(uid).shift()
    return null
  }

  private v3ToXYZ(pos: Vec3) {
    return { x: pos.x, y: pos.y, z: pos.z }
  }

}

export default BattleService.instance()