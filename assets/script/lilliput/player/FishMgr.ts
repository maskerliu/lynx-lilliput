import { BoxCollider, Component, ICollisionEvent, MeshRenderer, Node, Quat, _decorator, quat } from 'cc'
const { ccclass, property } = _decorator



@ccclass('FishMgr')
export default class FishMgr extends Component {

  private handle: Node

  private leverMeshRenderer: MeshRenderer
  private handleMeshRenderer: MeshRenderer

  private q_roatation = quat()

  onLoad() {

    this.handle = this.node.getChildByName('handle')

    this.leverMeshRenderer = this.node.getChildByName('lever').getComponent(MeshRenderer)
    this.handleMeshRenderer = this.handle.getComponent(MeshRenderer)

    this.q_roatation.set(this.handle.rotation)

    let angle = 90
    Quat.rotateX(this.q_roatation, this.q_roatation, Math.PI / 180 * angle)

    // tween(this.handle).to(0.5, { rotation: this.q_roatation }, {
    //   easing: 'linear', onComplete: () => {
    //     angle = -angle
    //     Quat.rotateX(this.q_roatation, this.q_roatation, Math.PI / 180 * angle)
    //   }
    // }).repeatForever().start()

    this.getComponent(BoxCollider).on('onTriggerEnter', this.onTriggerEnter, this)
    this.getComponent(BoxCollider).on('onTriggerExit', this.onTriggerExit, this)
  }


  private onTriggerEnter(event: ICollisionEvent) {

    if (event.otherCollider.name == 'myself') {
      // emit can climb event
    }
  }

  private onTriggerExit(event: ICollisionEvent) {

    if (event.otherCollider.name == 'myself') {
      // emit can climb event
    }
  }

  
}

// FishMgr.ItemName = 'fish'