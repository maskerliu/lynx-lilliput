import { Component, Vec3, _decorator } from 'cc'
const { ccclass, property } = _decorator

@ccclass('SkyAni')
export default class SkyAni extends Component {

  private currAng = 0
  private rotateSpeed = 2

  update(deltaTime: number) {
    this.currAng -= this.rotateSpeed * deltaTime
    this.node.setRotationFromEuler(new Vec3(0, this.currAng, 0))
  }
}