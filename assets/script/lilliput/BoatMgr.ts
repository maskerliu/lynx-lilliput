import { BoxCollider, Collider, Component, Vec3, _decorator, v3 } from 'cc'
const { ccclass, property } = _decorator

@ccclass('BoatMgr')
export default class BoatMgr extends Component {

  private floatPos: Vec3 = v3()

  private collider: Collider

  onLoad() {
    this.collider = this.getComponent(BoxCollider)

  }

  start() {
    this.collider?.on('onTriggerEnter', this.onTriggerEnter, this)
    this.collider?.on('onTriggerExit', this.onTriggerExit, this)

  }

  update(deltaTime: number) {

  }

  private onTriggerEnter() {

  }

  private onTriggerExit() {

  }
}