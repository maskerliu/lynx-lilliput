import { Component, Node, Toggle, _decorator } from 'cc'
const { ccclass, property } = _decorator


@ccclass('TextToggleMgr')
export default class TextToggleMgr extends Component {

  @property(Node)
  textNode: Node

  private toggle: Toggle
  private touchStarted: boolean = false

  onLoad() {
    this.toggle = this.node.getComponent(Toggle)
    this.textNode.on(Node.EventType.TOUCH_START, this.onTouchStart, this)
    this.textNode.on(Node.EventType.TOUCH_END, this.onTouchEnd, this)
  }


  private onTouchStart() {
    this.touchStarted = true
  }

  private onTouchEnd() {
    if (this.touchStarted) {
      this.toggle.isChecked = !this.toggle.isChecked
      this.touchStarted = false
    }
  }
}