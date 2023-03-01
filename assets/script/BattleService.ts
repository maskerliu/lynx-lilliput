
import { Game, User } from './model'
// import msgClient, { MessageHandler } from './PahoMsgClient'
import UserService from './UserService'

let msgClient: any = {
  init() { },
  subscribe() { },
  unsubscribe() { },
  send() { },
}
interface MessageHandler { }

class BattleService {

  private static _instance: BattleService

  private _curIsland: Game.Island

  get curIsland() { return this._curIsland }

  private gameMsgs: Array<Game.Msg>
  private timer: any = null
  private gameFrame: number
  private profile: User.Profile

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
  }

  sendGameMsg(msg: Game.Msg) {
    msg.uid = this.profile.uid
    msg.seq = this.gameFrame++
    this.gameMsgs.push(msg)
  }

  async init() {
    this.profile = await UserService.profile()
    msgClient.init(this.profile.uid)
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
    }, 200)
  }

  stop() {
    msgClient.unsubscribe(`_game/island/${this.curIsland._id}`)
    this._curIsland = null
    if (this.timer) clearInterval(this.timer)
  }
}

export default BattleService.instance()