import Paho from 'paho-mqtt'
import { Game } from '../model'

export interface MessageHandler {
  onMessageArrived(msg: Array<Game.Msg>): void
}

class PahoMsgClient {

  isLocal: boolean = false
  private retry = 0
  private option = {
    port: 8884,
    protocol: 'mqtts',
    username: 'lynx-iot',
    password: '12345678',
    ssl: true,
    keepAlive: 0,
    timeout: 5000,
  }
  private willTopic: string
  private willMessage: Paho.Message

  private curTopic: string
  private curSubDevice: string

  private client: Paho.Client

  msgHanlder: MessageHandler

  public init(uid: string) {
    this.willTopic = `_client/lwt/game/${uid}`
    this.willMessage = new Paho.Message(uid)
    this.willMessage.destinationName = this.willTopic
    this.willMessage.retained = true

    if (this.client != null) {
      this.client.disconnect()
      this.client = null
    }

    this.retry = 0

    if (uid == null) throw 'user info error'

    this.client = new Paho.Client('f9cc4cbec7c54744b1448fe4e6bfd274.s2.eu.hivemq.cloud', this.option.port, uid)

    // set callback handlers
    this.client.onConnectionLost = (err: Paho.MQTTError) => {
      if (err.errorCode !== 0 && this.retry > 0 && this.retry <= 5) {
        this.connect()
        console.error(`[${err.errorCode}]:`, err.errorMessage)
        this.connect()
      }
    }
    this.client.onMessageArrived = (msg: any) => { this.handleMsg(msg.topic, msg.payloadString) }
    this.connect()
  }

  private connect() {
    this.retry++
    this.client.connect({
      useSSL: this.option.ssl,
      userName: this.option.username,
      password: this.option.password,
      willMessage: this.willMessage,
      // reconnect: true,
      onSuccess: () => {
        this.retry = 0
        this.client.send(this.willTopic, '', 0, true) // 更新在线状态
      }
    })
  }

  public subscribe(topic: string): boolean {
    if (!this.isConnected()) { return false }
    this.client.subscribe(topic)
    return true
  }

  public unsubscribe(topic: string) {
    if (!this.isConnected()) { return }
    this.client.unsubscribe(topic)
  }

  public send(topic: string, message: string) {
    if (!this.isConnected()) { return }
    this.client.send(topic, message, 0, false)
  }

  protected handleMsg(topic: string, message: string) {
    try {
      let msgs = JSON.parse(message)
      this.msgHanlder?.onMessageArrived(msgs)
    } catch (err) {
      console.log(err)
    }
  }

  isConnected(): boolean {
    return this.client?.isConnected()
  }

  close() {
    if (this.client && this.isConnected()) {
      this.client.disconnect()
      this.client = null
    }

  }
}

const msgClient = new PahoMsgClient()

export default msgClient