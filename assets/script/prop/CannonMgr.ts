import { BoxCollider, Node, ITriggerEvent, RigidBody, _decorator, tween, Quat, quat, Vec2, Vec3, instantiate, v3 } from 'cc'
import { Game, Terrain } from '../model'
const { ccclass, property } = _decorator

import TerrainItemMgr, { PropEvent } from '../TerrainItemMgr'

import IslandAssetMgr from '../IslandAssetMgr'
import CannonBallMgr from './CannonBallMgr'



@ccclass('CannonMgr')
export default class CannonMgr extends TerrainItemMgr {

  protected static ShowInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, true, [Terrain.ModelInteraction.Fire])
  protected static HideInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, false)

  protected barrel: Node

  protected _rotation: Quat = quat()

  protected static MAX_ANGLE = 50 * Math.PI / 180
  protected MAX_QUAT: Quat = quat()
  protected MIN_QUAT: Quat = quat()
  protected isUp: boolean = false

  protected impulse: number = 8
  protected capacity: number = 2
  protected ballPosition: Vec3 = v3(0, 0, -0.35)
  private balls: Array<Node> = new Array()


  onLoad() {
    super.onLoad()

    this.rigidBody = this.getComponent(RigidBody)
    this.barrel = this.node.getChildByName('barrel')

    this.getComponent(BoxCollider).on('onTriggerEnter', this.onTriggerEnter, this)
    this.getComponent(BoxCollider).on('onTriggerExit', this.onTriggerExit, this)

    Quat.fromAxisAngle(this.MAX_QUAT, Vec3.UNIT_X, 50 * Math.PI / 180)
    Quat.fromAxisAngle(this.MIN_QUAT, Vec3.UNIT_X, 0)
  }

  start() {
    for (let i = 0; i < this.capacity; ++i) {
      let ballNode = instantiate(IslandAssetMgr.getPrefab('cannonBall'))
      ballNode.active = false
      ballNode.parent = null
      this.balls.push(ballNode)
    }
  }

  update(dt: number) {

    if (this._isSleep) return

    let angle = Quat.getAxisAngle(this._rotation, this.barrel.rotation)
    let step = 0.8 * dt
    if (this.isUp) {
      if (angle < CannonMgr.MAX_ANGLE - step) {
        this.barrel.rotation = this.barrel.rotation.slerp(this.MAX_QUAT, step)
      } else {
        this.isUp = false
      }
    } else {
      if (angle > step) {
        this.barrel.rotation = this.barrel.rotation.slerp(this.MIN_QUAT, step)
      } else {
        this.isUp = true
      }
    }
  }

  protected onTriggerEnter(event: ITriggerEvent) {
    if (event.otherCollider.node.name == 'myself') {
      CannonMgr.ShowInteractEvent.propIndex = this.index
      this.node.dispatchEvent(CannonMgr.ShowInteractEvent)
    }
  }

  protected onTriggerExit(event: ITriggerEvent) {
    if (event.otherCollider.node.name == 'myself') {
      this.node.dispatchEvent(CannonMgr.HideInteractEvent)
    }
  }

  preview() {

  }

  interact(action: Game.CharacterState) {
    switch (action) {
      case Game.CharacterState.Attack:
        this.fire()
        break
    }
  }

  fire() {
    for (let node of this.balls) {
      if (node.parent == null) {
        node.position = this.ballPosition
        this.barrel.addChild(node)

        setTimeout(() => {
          node.getComponent(CannonBallMgr).start()
          node.getComponent(RigidBody).applyImpulse(this.barrel.forward.multiplyScalar(this.impulse))
        }, 600)
        break
      }
    }
  }
}

CannonMgr.ItemName = 'cannon'