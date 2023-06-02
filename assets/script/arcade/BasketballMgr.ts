import { Component, CylinderCollider, ITriggerEvent, MeshCollider, MeshRenderer, Node, PhysicMaterial, RigidBody, _decorator, instantiate, v3 } from 'cc'
import { Terrain } from '../common/Terrain'

const { ccclass, property } = _decorator

// const BasketballStandMtl = new PhysicMaterial()
// BasketballStandMtl.setValues(0.2, 0, 0, 0.6)

// const BasketballMtl = new PhysicMaterial()
// BasketballMtl.setValues(0.2, 0, 0, 0.8)

@ccclass('BasketballMgr')
export default class BasketballMgr extends Component {

  private idx = 0
  private standsPos = v3()
  private left = true
  private randomPos = v3()
  private basketballs: Array<Node> = []

  protected onLoad(): void {

    let prefab = this.node.parent.getChildByName('basketball')
    let luckyball = this.node.parent.getChildByName('beachball')

    for (let i = 0; i < 6; i++) {
      let ball = i == 5 ? instantiate(luckyball) : instantiate(prefab)
      this.node.parent.addChild(ball)
      this.basketballs.push(ball)
    }
  }

  private initStands() {
    this.standsPos.set(14, -1, 0)
    this.node.position = this.standsPos
    let rigidBody = this.node.addComponent(RigidBody)
    rigidBody.type = RigidBody.Type.STATIC
    rigidBody.group = Terrain.PhyEnvGroup.Prop
    rigidBody.setMask(Terrain.PropMask)

    let collider = this.node.addComponent(MeshCollider)
    collider.mesh = this.node.getComponent(MeshRenderer).mesh
    collider.material.setValues(0.2, 0, 0, 0.6) // = BasketballStandMtl

    let net = this.node.getChildByName('net')
    rigidBody = net.addComponent(RigidBody)
    rigidBody.type = RigidBody.Type.STATIC
    rigidBody.group = Terrain.PhyEnvGroup.Prop
    rigidBody.setMask(Terrain.PropMask)

    let cyCollider = net.addComponent(CylinderCollider)
    cyCollider.isTrigger = true
    cyCollider.radius = 0.2
    cyCollider.height = 0.01
    cyCollider.on('onTriggerEnter', this.onTriggerEnter, this)
  }

  private randomBall() {
    setTimeout(() => {
      if (this.idx == this.basketballs.length - 1) {
        this.idx = 0
      } else {
        this.idx++
      }

      this.randomPos.set(8, 1, Math.random() / 2)
      this.randomPos.z = Math.random() > 0.5 ? this.randomPos.z : - this.randomPos.z
      let rigidBody = this.basketballs[this.idx].getComponent(RigidBody)
      rigidBody.clearState()
      rigidBody.useGravity = false
      this.basketballs[this.idx].position = this.randomPos
      this.basketballs[this.idx].active = true
    }, 800)
  }

  private onTriggerEnter(event: ITriggerEvent) {

    let name = event.otherCollider.node.name

    switch (name) {
      case 'basketball':
        // this.uiMgr.score = 2
        break
      case 'beachball':
        // this.uiMgr.score = Math.floor(1 + Math.random() * 4)
        break
    }
  }
}