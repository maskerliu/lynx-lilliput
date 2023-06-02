import { Node, Vec3, v3 } from 'cc'
import Colyseus from 'colyseus.js'
import PlayerMgr from '../common/PlayerMgr'
import { Game, IslandState, PlayerState } from '../model'
import { MsgTopic } from '../model/schema/MsgTopics'
import IslandMgr from './IslandMgr'
import { Lilliput } from './LilliputEvents'

const DidEnterEvent = new Lilliput.PlayerEvent(Lilliput.PlayerEvent.Type.DidEnter)
const LeaveEvent = new Lilliput.PlayerEvent(Lilliput.PlayerEvent.Type.OnLeave)

export default class BattleService {

  static get instance() {
    if (BattleService._instance == null) { BattleService._instance = new BattleService() }
    return BattleService._instance
  }

  private static _instance: BattleService

  private constructor() {
    let offset = 20
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
  private _handler: Node

  private _players: Map<string, PlayerMgr> = new Map()
  private _islands: Map<string, IslandMgr> = new Map()

  private _localStateFrames: Array<Game.Msg> = new Array()

  private _positions: Array<{ pos: Vec3, existed: boolean }> = []

  private _timer: any = null


  init(uid: string, handler: Node) {
    this._client = new Colyseus.Client(`ws://192.168.24.77:3000`)
    this._myself = uid
    this._handler = handler
  }

  async stop() {
    if (this._island) {
      await this._island.leave()
      this._island.removeAllListeners()
      this.unregisterHandlers()
      this._island = null
    }
    if (this._timer) clearInterval(this._timer)
  }

  isMyself(uid: string) { return this._myself == uid }

  player(uid?: string) {
    try {
      if (uid == null)
        return this._players.get(this._myself)
      else
        return this._players.get(uid)
    } catch (err) {
      return null
    }
  }

  addPlayer(mgr: PlayerMgr) {
    this._players.set(mgr.profile.id, mgr)
  }

  get randomPos() {
    // return v3(0, 0, 0)
    let ps = this._positions.filter(it => { return !it.existed })
    let idx = Math.ceil(Math.random() * (ps.length - 1))
    return ps[idx].pos

  }

  island(id?: string, owner?: string) {
    if (id == null && owner == null) return this._islands.get(this._island?.state.id)

    if (id) {
      return this._islands.get(id)
    }

    if (owner) {
      for (let island of this._islands.values()) {
        if (island.senceInfo?.owner == owner) {
          return island
        }
      }
    }

    return null
  }

  addIsland(mgr: IslandMgr) {
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

  async tryEnter(uid: string, islandId: string, pos: Vec3 = v3(1, 1.5, 1)) {
    if (this._island && this._island.state.id == islandId) return

    this._island = await this._client.joinOrCreate('island', { islandId, uid, px: pos.x, py: pos.y, pz: pos.z })
    this.registerHandlers()
  }

  async didEnter(player: PlayerMgr, island: IslandMgr) {
    player.leave()
    let uid = player.profile.id == 'shadow' ? this._myself : player.profile.id
    player.enter(island, this._island.state.players.get(uid))

    if (this._timer) clearInterval(this._timer)
    this._timer = setInterval(() => {
      this._island.send(MsgTopic.PlayerUpdate, this._localStateFrames)
      this._localStateFrames.splice(0, this._localStateFrames.length)
    }, 70)
  }

  private registerHandlers() {
    this._island?.onLeave.once(this.onLeaveIsland)
    this._island?.onStateChange.once(this.onIslandStateChanged)
    this._island?.state.players.onAdd(BattleService.instance.onAddPlayer)
    this._island?.state.players.onRemove(BattleService.instance.onRemovePlayer)
  }

  private unregisterHandlers() {
    this._island?.onLeave.remove(this.onLeaveIsland)
    this._island?.onStateChange.remove(this.onIslandStateChanged)
    // this._island?.state.players.onAdd(null)
    // this._island?.state.players.onRemove.
  }

  private onLeaveIsland() {
    BattleService.instance.stop()
  }

  private onIslandStateChanged() {

  }

  private onAddPlayer(state: PlayerState, key: string) {
    DidEnterEvent.customData = state
    BattleService.instance._handler.dispatchEvent(DidEnterEvent)
  }

  private onRemovePlayer(state: PlayerState, key: string) {
    // PlayerLeaveEvent.cusmtomData = state
    // BattleService.instance._handler.dispatchEvent(PlayerLeaveEvent)

    let player = BattleService.instance._players.get(state.profile.uid)
    player?.leave()
    // 缓存用户过多，则删除
    if (BattleService.instance._players.size > 20) {
      BattleService.instance._players.delete(state.profile.uid)
    }

  }

}