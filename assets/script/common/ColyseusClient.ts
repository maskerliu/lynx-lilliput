
import { Node } from 'cc'
import Colyseus from 'colyseus.js'
import { Lilliput } from '../lilliput/LilliputEvents'
import { Game, IslandState, PlayerState, User } from '../model'
import { MsgTopic } from '../model/schema/MsgTopics'


const PlayerEnterEvent = new Lilliput.PlayerEvent(Lilliput.PlayerEvent.Type.OnEnter)

export default class ColyseusClient extends Object {


  private static _instance: ColyseusClient

  public static get instance() {
    if (ColyseusClient._instance == null) {
      ColyseusClient._instance = new ColyseusClient()
    }

    return ColyseusClient._instance
  }

  private constructor() {
    super()
  }

  private _client: Colyseus.Client

  private _curUser: User.Profile = null
  private _island: Colyseus.Room<IslandState> = null
  private _isQuitting = false

  private _uid: string

  private _handler: Node

  get island() { return this._island }

  init(uid: string, handler: Node) {
    this._uid = uid
    this._handler = handler
    this._client = new Colyseus.Client(`ws://192.168.24.77:3000`)
  }

  async subscribe(islandId: string) {
    if (this._island) {
      this._isQuitting = true
      await this._island.leave()
      this._isQuitting = false
      this._island = null
    } else {
      this._island = await this._client!.joinOrCreate<IslandState>('island', { islandId, uid: this._uid })
      this.registerHandlers()
    }
  }

  private registerHandlers() {
    if (this._island) {
      this._island.onLeave.once(this.onLeaveIsland)
      this._island.onStateChange.once(this.onIslandStateChanged)

      this._island.state.players.onAdd(ColyseusClient.instance.onAddPlayer)
      this._island.state.players.onRemove(ColyseusClient.instance.onRemovePlayer)
    }
  }

  private unregisterHandlers() {
    if (this._island) {
      this._island.onLeave.remove(this.onLeaveIsland)
      this._island.onStateChange.remove(this.onIslandStateChanged)
      this._island.state.players.onAdd(null)
      this._island.state.players.onRemove(null)
    }
  }

  private onLeaveIsland(code: number) {
    console.log(`left island - ${code}`)
  }

  private onIslandStateChanged(state: any) {
    console.log(state)
  }

  private onAddPlayer(player: PlayerState, key: string) {
    PlayerEnterEvent.cusmtomData = player
    ColyseusClient.instance._handler.dispatchEvent(PlayerEnterEvent)
    return true
  }

  private onRemovePlayer(player: PlayerState, key: string) {

  }

  send(msgs: Array<Game.PlayerMsg>) {
    this._island.send(MsgTopic.PlayerUpdate, msgs)
  }

  playerState(uid: string) {
    return this._island.state.players.get(uid)
  }

}