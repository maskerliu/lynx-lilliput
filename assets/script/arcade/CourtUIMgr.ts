import { Button, Component, Label, Node, Vec3, Widget, _decorator, tween, v3, view } from 'cc'
import ProgressMgr from '../common/ProgressMgr'
import RockerMgr, { RockerTarget } from '../common/RockerMgr'

const { ccclass, property } = _decorator


@ccclass('CourtUIMgr')
export default class CourtUIMgr extends Component {

  @property(Node)
  reactArea: Node

  @property(Node)
  private overlay: Node

  @property(Node)
  private gameMenu: Node

  @property(Node)
  private statusBar: Node

  @property(Label)
  private scoreLabel: Label

  @property(ProgressMgr)
  private energyProgress: ProgressMgr

  @property(ProgressMgr)
  private timeProgress: ProgressMgr

  @property(Node)
  private menuBtn: Node

  @property(Node)
  private profile: Node

  @property(Node)
  private profileBtn: Node

  @property(Node)
  private settings: Node

  @property(Node)
  private settingsBtn: Node

  @property(Node)
  private retryBtn: Node

  @property(Node)
  private resumeBtn: Node

  @property(Node)
  private billboardBtn: Node

  @property(Node)
  private billboard: Node

  @property(Node)
  private rocker: Node

  private _scale: Vec3 = v3(1.2, 1.2, 1.2)

  private _score: number = 0
  set score(val: number) {
    this._score += val
    this.scoreLabel.string = `${this._score}`
  }

  protected onLoad(): void {
    let wid = this.node.getComponent(Widget)
    wid.top = -view.getViewportRect().y
    wid.bottom = -view.getViewportRect().y
    wid.left = -view.getViewportRect().x
    wid.right = -view.getViewportRect().x
  }

  set rockerTarget(target: RockerTarget) {
    this.rocker.getComponent(RockerMgr).target = target
  }

  protected start(): void {
    setInterval(() => {
      this.timeProgress.progress = this.timeProgress.progress + 10

      if (this.timeProgress.progress == 100) {
        // tween(this.timeProgress.node).to(0.2, { scale: this._scale }).start()
        this.timeProgress.progress = 10
      }

    }, 1000)

    this.init()

  }

  updateScore(socre: number) {

  }

  init() {
    this.menuBtn.on(Button.EventType.CLICK, () => { this.showGameMenu(true) }, this)
    this.profileBtn.on(Button.EventType.CLICK, this.showProfile, this)
    this.settingsBtn.on(Button.EventType.CLICK, this.showSettings, this)
    this.billboardBtn.on(Button.EventType.CLICK, this.showBillboard, this)
    this.resumeBtn.on(Button.EventType.CLICK, this.back, this)
    this.retryBtn.on(Button.EventType.CLICK, this.newGame, this)

    this.showGameMenu(false)
  }

  showEnterGameMenu() {

  }

  showGameMenu(show: boolean) {
    if (show) {
      this.gameMenu.scale = v3(1, 1, 1)
      this.gameMenu.active = show
      this.overlay.active = show
      tween(this.gameMenu).to(0.5,
        { scale: v3(1, 1, 1) },
        {
          easing: 'elasticOut',
          onComplete: () => {
            this.showSettings()
          }
        }
      ).start()
    } else {
      tween(this.gameMenu).to(0.5,
        { scale: v3(0.6, 0.6, 0.6) },
        {
          easing: 'elasticIn',
          onComplete: () => {
            this.gameMenu.active = show
          }
        }
      ).start()
    }


  }

  showProfile() {
    this.settings.active = false
    this.settingsBtn.active = true
    this.profile.active = true
    this.profileBtn.active = false
    this.billboard.active = false
  }

  showSettings() {
    this.settings.active = true
    this.settingsBtn.active = false
    this.profile.active = false
    this.profileBtn.active = true
    this.billboard.active = false
  }

  async showBillboard() {
    this.settings.active = false
    this.settingsBtn.active = true
    this.profile.active = false
    this.profileBtn.active = true
    this.billboard.active = true

    await this.syncBillboard()
  }

  back() {
    this.showGameMenu(false)
  }

  newGame() {
    this.showGameMenu(false)
  }

  private initSettings() {


  }

  private async syncProfile() {

  }

  private async syncBillboard() {

  }
}