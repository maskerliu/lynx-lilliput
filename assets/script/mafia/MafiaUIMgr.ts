import { Component, Node, Widget, _decorator, view } from "cc"
import RockerMgr, { RockerTarget } from "../common/RockerMgr"
const { ccclass, property } = _decorator

@ccclass('MafiaUIMgr')
export default class MafiaUIMgr extends Component {

  @property(Node)
  rocker: Node

  @property(Node)
  reactArea: Node


  onLoad() {
    let wid = this.node.getComponent(Widget)
    wid.top = -view.getViewportRect().y
    wid.bottom = -view.getViewportRect().y
    wid.left = -view.getViewportRect().x
    wid.right = -view.getViewportRect().x
  }

  set rockerTarget(target: RockerTarget) {
    this.rocker.getComponent(RockerMgr).target = target
  }

}