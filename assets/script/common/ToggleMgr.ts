import { Component, Node, Toggle, _decorator } from 'cc'
const { ccclass, property } = _decorator


@ccclass('ToggleMgr')
export default class ToggleMgr extends Component {


  customData: any

  protected toggle: Toggle

  onLoad() {
    this.toggle = this.node.getComponent(Toggle)
  }
}