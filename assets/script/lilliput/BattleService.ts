import { Node, Vec3, v3 } from 'cc'
import Colyseus from 'colyseus.js'
import { BigWorld } from '../common/BigWorld'
import { ChatRoomState, Game, IslandState, MsgTopic, PlayerState, RemoteAPI } from '../model'
import { Lilliput } from './LilliputEvents'

const DidEnterEvent = new BigWorld.PlayerEvent(BigWorld.PlayerEvent.Type.DidEnter)
const LeaveEvent = new BigWorld.PlayerEvent(BigWorld.PlayerEvent.Type.OnLeave)
const ChatMsgEvent = new Lilliput.UIEvent(Lilliput.UIEvent.Type.ChatMsg)


export default class BattleService {

  static get instance() {
    if (BattleService._instance == null) { BattleService._instance = new BattleService() }
    return BattleService._instance
  }

  private static _instance: BattleService

  private constructor() {
    let offset = 22
    this._positions.push({ pos: v3(offset, 0, offset), existed: false })
    this._positions.push({ pos: v3(offset, 0, -offset), existed: false })
    this._positions.push({ pos: v3(offset, 0, 0), existed: false })
    this._positions.push({ pos: v3(0, 0, offset), existed: false })
    this._positions.push({ pos: v3(0, 0, -offset), existed: false })
    this._positions.push({ pos: v3(-offset, 0, offset), existed: false })
    this._positions.push({ pos: v3(-offset, 0, -offset), existed: false })
    this._positions.push({ pos: v3(-offset, 0, 0), existed: false })
  }

  private _myself: string
  private _client: Colyseus.Client
  private _island: Colyseus.Room<IslandState>
  private _chatroom: Colyseus.Room<ChatRoomState>
  private _curIsland: string = null
  private _handler: Node

  private _players: Map<string, BigWorld.PlayerMgr> = new Map()
  private _islands: Map<string, BigWorld.IslandMgr> = new Map()

  private _localStateFrames: Array<Game.Msg> = new Array()

  private _positions: Array<{ pos: Vec3, existed: boolean }> = []

  private _timer: any = null


  get randomPos() {
    // return v3(0, 0, 0)
    let ps = this._positions.filter(it => { return !it.existed })
    let idx = Math.ceil(Math.random() * (ps.length - 1))
    return ps[idx].pos

  }

  init(uid: string, handler: Node) {
    this._client = new Colyseus.Client(`ws://${RemoteAPI.Host}:3000`)
    this._myself = uid
    this._handler = handler
  }

  isMyself(uid: string) { return this._myself == uid }

  player(uid?: string) {
    return this._players.get(uid == null ? this._myself : uid)
  }

  addPlayer(mgr: BigWorld.PlayerMgr) {
    this._players.set(mgr.profile.id, mgr)
  }

  island(id?: string, owner?: string) {
    if (owner) {
      for (let island of this._islands.values()) {
        if (island.senceInfo?.owner == owner) {
          return island
        }
      }
    } else {
      return this._islands.get(id == null ? this._curIsland : id)
    }
  }

  addIsland(mgr: BigWorld.IslandMgr) {
    this._islands.set(mgr.senceInfo.id, mgr)
    let idx = this._positions.findIndex(it => {
      return mgr.node.position.equals(it.pos)
    })
    if (idx != -1) {
      this._positions[idx].existed = true
    }
  }

  removeIsland(id: string) {
    this._islands.get(id)?.node.destroy()
    this._islands.delete(id)
  }

  sendPlayerMsg(msg: Game.PlayerMsg) {
    if (this._island == null) return
    msg.type = Game.MsgType.Player
    msg.uid = this._myself
    this._localStateFrames.push(msg)
  }

  sendChatMsg(msg: string) {
    this._chatroom?.send(MsgTopic.ChatMsg, { sendId: this._myself, content: msg })
  }

  get chatMsgs() {
    return this._chatroom?.state.chatMessages
  }

  async tryEnter(uid: string, islandId: string, pos: Vec3 = v3(0, 1.5, 1), state: Game.CharacterState) {
    if (this._curIsland == islandId) return
    this.island()?.enablePhysic(false)
    this._curIsland = islandId
    this._island = await this._client.joinOrCreate('island', { islandId, uid, px: pos.x, py: pos.y, pz: pos.z, state })
    this._chatroom = await this._client.joinOrCreate('chatRoom')
    this.registerHandlers()
    this.registerChatHandler()
  }

  async didEnter(player: BigWorld.PlayerMgr) {
    player.leave()
    let uid = player.profile.id == 'shadow' ? this._myself : player.profile.id

    if (this._island == null || !this._island.state.players.has(uid)) {
      console.log(`error: no player state ${uid}`)
      return
    }

    player.enter(this.island(), this._island.state.players.get(uid))

    if (this._timer) clearInterval(this._timer)
    this._timer = setInterval(() => {
      this._island?.send(MsgTopic.PlayerUpdate, this._localStateFrames)
      this._localStateFrames.splice(0, this._localStateFrames.length)
    }, 70)
  }

  async leave() {
    if (this._island) {
      this.island().enablePhysic(false)
      this._curIsland = null
      this._island.removeAllListeners()
      this.unregisterHandlers()
      await this._island.leave()
      this._island = null
    }

    if (this._chatroom) {
      await this._chatroom.leave()
      this._chatroom = null
    }

    if (this._timer) clearInterval(this._timer)
  }

  private registerHandlers() {
    this._island?.onLeave.once(this.onLeaveIsland)
    this._island?.onStateChange.once(this.onIslandStateChanged)
    this._island?.state.players.onAdd(BattleService.instance.onAddPlayer)
    this._island?.state.players.onRemove(BattleService.instance.onRemovePlayer)
  }

  private registerChatHandler() {

    this._chatroom.state.chatMessages.onAdd(() => {
      this._handler.dispatchEvent(ChatMsgEvent)
    })

    this._chatroom.state.chatMessages.onRemove(() => {
      this._handler.dispatchEvent(ChatMsgEvent)
    })

  }

  private unregisterHandlers() {
    this._island?.onLeave.remove(this.onLeaveIsland)
    this._island?.onStateChange.remove(this.onIslandStateChanged)
  }

  private unregisterChatHandler() {

  }

  private onLeaveIsland() {
    BattleService.instance._curIsland = null
  }

  private onIslandStateChanged(state: IslandState) {
    BattleService.instance._curIsland = state.id
    BattleService.instance.island().enablePhysic(true)
  }

  private onAddPlayer(state: PlayerState, key: string) {
    DidEnterEvent.customData = state
    BattleService.instance._handler.dispatchEvent(DidEnterEvent)
  }

  private onRemovePlayer(state: PlayerState, key: string) {
    LeaveEvent.customData = state.profile.uid
    console.log('on remove player')
    BattleService.instance._handler.dispatchEvent(LeaveEvent)

    // let player = BattleService.instance._players.get(state.profile.uid)
    // player?.leave()
    // // 缓存用户过多，则删除
    // if (BattleService.instance._players.size > 20) {
    //   BattleService.instance._players.delete(state.profile.uid)
    // }
  }
}