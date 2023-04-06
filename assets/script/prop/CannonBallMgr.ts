import { Component, ITriggerEvent, Node, ParticleSystem, RigidBody, SphereCollider, _decorator } from 'cc'
const { ccclass, property } = _decorator


@ccclass('CannonBallMgr')
export default class CannonBallMgr extends Component {
  private rigidBody: RigidBody

  @property(ParticleSystem)
  private bombEffect: ParticleSystem

  @property(Node)
  private ball: Node

  @property(ParticleSystem)
  private trailEffect: ParticleSystem

  private bombed: boolean = false

  onLoad() {
    this.rigidBody = this.getComponent(RigidBody)
    this.getComponent(SphereCollider).on('onCollisionEnter', this.onCollisionEnter, this)
  }

  start() {
    this.node.active = true
    this.ball.active = true
    this.bombed = false
    this.trailEffect.play()
  }

  update(dt: number) {
    if (this.bombed && this.bombEffect.isStopped) {
      this.node.active = false
      this.bombed = false
      this.node.removeFromParent()
    }
  }

  private onCollisionEnter(event: ITriggerEvent) {
    if (!event.otherCollider.node.name.includes('cannon')) {
      this.rigidBody.clearState()
      this.trailEffect.stop()
      this.bombEffect.play()
      this.bombed = true
    }
  }

  preview() {

  }
}