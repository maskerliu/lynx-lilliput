import { Component, MeshCollider, MeshRenderer, Node, RigidBody, _decorator, instantiate } from 'cc'
import { Terrain } from '../common/Terrain'

const { ccclass, property } = _decorator


// const BowlingPinPhyMtl = new PhysicMaterial()
// BowlingPinPhyMtl.setValues(0.5, 0, 0, 0.2)

// const BowlingPongPhyMtl = new PhysicMaterial()


@ccclass('BowlingMgr')
export default class BowlingMgr extends Component {

  private pong: Node
  private pins: Node[]

  protected onLoad(): void {


    let pinPrefab = this.node.getChildByName('bowlingPin')
    for (let i = 0; i < 10; ++i) {
      let pin = instantiate(pinPrefab)
      this.node.addChild(pin)
      pin.active = false
    }

    this.pong = this.node.getChildByName('bowlingPong')


  }

  protected start(): void {
    this.initGame()
  }

  private initGame() {
    this.pins.forEach(it => {
      let rigidBody = it.addComponent(RigidBody)
      rigidBody.type = RigidBody.Type.DYNAMIC
      rigidBody.group = Terrain.PhyEnvGroup.Prop
      rigidBody.setMask(Terrain.PropMask)
      rigidBody.sleep()

      let collider = it.addComponent(MeshCollider)
      collider.convex = true
      collider.mesh = it.getComponent(MeshRenderer).mesh
      collider.material.setValues(0.5, 0, 0, 0.2)
    })

    let rigidBody = this.pong.addComponent(RigidBody)
    rigidBody.type = RigidBody.Type.DYNAMIC
    rigidBody.group = Terrain.PhyEnvGroup.Prop
    rigidBody.setMask(Terrain.PropMask)
    rigidBody.sleep()
    let collider = this.pong.addComponent(MeshCollider)
    collider.convex = true
    collider.mesh = this.pong.getComponent(MeshRenderer).mesh
    // collider.material = BowlingPongPhyMtl
  }


}