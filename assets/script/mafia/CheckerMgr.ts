import { Component, Node, _decorator, instantiate, v3 } from "cc"
const { ccclass, property } = _decorator

@ccclass('CheckerMgr')
export default class CheckerMgr extends Component {

  private checkers: Node[] = []

  private offsetX = 1.261
  private offsetZ = 0.281

  private offsetXX = 1.561
  private offsetZZ = 0.613

  onLoad() {

    let checker = this.node.getChildByName('checker')

    for (let i = 0; i < 8; i++) {
      let blackChecker = instantiate(checker)
      blackChecker.position = v3(i * 0.0375 + this.offsetX, 0.005712, this.offsetZ)
      this.node.addChild(blackChecker)
      this.checkers.push(blackChecker)

      let redChecker = instantiate(checker)
      redChecker.position = v3(i * 0.0375 + this.offsetX, 0.005712, this.offsetZZ)
      this.node.addChild(redChecker)
      this.checkers.push(redChecker)
    }

  }


}