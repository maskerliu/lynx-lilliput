import { Button, Component, EditBox, EventHandler, Label, Node, Toggle, ToggleContainer, _decorator } from 'cc'
import LocalPrefs from '../misc/LocalPrefs'
import { UserApi } from '../model'
import { LilliputUIEvent } from './LilliputUIMgr'

const { ccclass, property } = _decorator

@ccclass('LilliputLoginMgr')
export default class LilliputLoginMgr extends Component {

  @property(Label)
  private title: Label

  @property(Button)
  private switchBtn: Button

  @property(Node)
  private signUp: Node

  @property(Node)
  private login: Node

  @property(EditBox)
  private signUpPhoneInput: EditBox

  @property(EditBox)
  private signUpUsernameInput: EditBox

  @property(EditBox)
  private signUpPwdInput: EditBox

  @property(EditBox)
  private signUpRePwdInput: EditBox

  @property(Label)
  private signUpErrorMsg: Label

  @property(ToggleContainer)
  private loginAccountType: ToggleContainer

  @property(EditBox)
  private loginAccountInput: EditBox

  @property(EditBox)
  private loginPwdInput: EditBox

  @property(Toggle)
  private rememberMe: Toggle

  @property(Label)
  private loginErrorMsg: Label

  @property(Button)
  private submitBtn: Button

  private islogin = true

  protected onLoad(): void {
    this.switchBtn.node.on(Button.EventType.CLICK, this.onSwitch, this)
    this.submitBtn.node.on(Button.EventType.CLICK, this.loginOrSignUp, this)

    // let accountTypeHandler = new EventHandler()
    // accountTypeHandler.target = this.node
    // accountTypeHandler.component = 'LilliputLoginMgr'
    // accountTypeHandler.handler = 'onAccountTypeChanged'
    // this.loginAccountType.checkEvents.push(accountTypeHandler)

    let phoneInputHandler = new EventHandler()
    phoneInputHandler.target = this.node
    phoneInputHandler.component = 'LilliputLoginMgr'
    phoneInputHandler.handler = 'onPhoneInputEnd'
    this.signUpPhoneInput.editingDidEnded.push(phoneInputHandler)

    let usernameInputHandler = new EventHandler()
    usernameInputHandler.target = this.node
    usernameInputHandler.component = 'LilliputLoginMgr'
    usernameInputHandler.handler = 'onUserNameInputEnd'
    this.signUpUsernameInput.editingDidEnded.push(usernameInputHandler)

    let pwdInputHandler = new EventHandler()
    pwdInputHandler.target = this.node
    pwdInputHandler.component = 'LilliputLoginMgr'
    pwdInputHandler.handler = 'onRePwdInputEnd'
    this.signUpRePwdInput.editingDidEnded.push(pwdInputHandler)
  }

  protected start(): void {
    this.init()
  }

  private async onSwitch() {

    this.islogin = !this.islogin

    this.title.string = this.islogin ? '登录' : '注册'
    this.switchBtn.getComponentInChildren(Label).string = this.islogin ? '注册' : '登录'
    this.submitBtn.getComponentInChildren(Label).string = this.title.string

    this.login.active = this.islogin
    this.signUp.active = !this.islogin
  }

  private init() {
    let activeIdx = LocalPrefs.accountType == 'Phone' ? 1 : 0
    this.loginAccountType.toggleItems[activeIdx].isChecked = true
    this.loginErrorMsg.node.active = false
    this.signUpErrorMsg.node.active = false
    this.rememberMe.isChecked = LocalPrefs.rememberMe
    if (LocalPrefs.rememberMe) {
      this.loginAccountInput.string = LocalPrefs.account
      this.loginPwdInput.string = LocalPrefs.password
    } else {
      this.loginAccountInput.string = ''
      this.loginPwdInput.string = ''
    }
  }

  private async loginOrSignUp() {
    try {
      if (this.islogin) {
        let phone = null
        let username = null
        if (this.loginAccountType.activeToggles()[0].node.name == 'Phone') {
          phone = this.loginAccountInput.string
        } else {
          username = this.loginAccountInput.string
        }

        LocalPrefs.rememberMe = this.rememberMe.isChecked
        LocalPrefs.accountType = this.loginAccountType.activeToggles()[0].node.name

        if (LocalPrefs.rememberMe) {
          LocalPrefs.account = this.loginAccountInput.string
          LocalPrefs.password = this.loginPwdInput.string
        } else {
          LocalPrefs.account = ''
          LocalPrefs.password = ''
        }

        let result = await UserApi.login(phone, username, this.loginPwdInput.string)
        LocalPrefs.myself = result
      } else {
        let phone = this.signUpPhoneInput.string
        let username = this.signUpUsernameInput.string
        let pwd = this.signUpPwdInput.string
        let result = await UserApi.signUp(phone, username, pwd)
        LocalPrefs.myself = result
      }

      this.node.active = false
      this.node.dispatchEvent(new LilliputUIEvent(LilliputUIEvent.Type.UserInfoBind))
    } catch (err: any) {
      if (this.islogin) {
        this.loginErrorMsg.node.active = true
        this.loginErrorMsg.string = err
      } else {
        this.signUpErrorMsg.node.active = true
        this.signUpErrorMsg.string = err
      }
    }
  }

  protected async onPhoneInputEnd(editbox: EditBox, customData: any) {
    try {
      await UserApi.validCheck(editbox.string)
    } catch (err: any) {
      this.signUpErrorMsg.node.active = true
      this.signUpErrorMsg.string = err // '该手机号已注册，请换一个或直接登录'
    }
  }

  protected async onUserNameInputEnd(editbox: EditBox, customData: any) {
    try {
      await UserApi.validCheck(null, editbox.string)
    } catch (err: any) {
      this.signUpErrorMsg.node.active = true
      this.signUpErrorMsg.string = err// '用户名已被占用，请换一个'
    }
  }

  protected async onRePwdInputEnd(editbox: EditBox, customData: any) {
    if (this.signUpPwdInput.string != this.signUpRePwdInput.string) {
      this.signUpErrorMsg.node.active = true
      this.signUpErrorMsg.string = '两次密码输入不一致'
    } else {
      this.signUpErrorMsg.node.active = false
    }
  }

}