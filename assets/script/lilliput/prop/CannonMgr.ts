import { Node, Prefab, Quat, RigidBody, Vec3, _decorator, instantiate, math, quat, resources, v3 } from 'cc'
import { Game } from '../../model'
import LilliputAssetMgr from '../LilliputAssetMgr'
import CannonBallMgr from './CannonBallMgr'
import CommonPropMgr from './CommonPropMgr'


const { ccclass, property } = _decorator

@ccclass('CannonMgr')
export default class CannonMgr extends CommonPropMgr {
  protected barrel: Node
  protected _rotation: Quat = quat()

  protected static MAX_ANGLE = math.toRadian(50)
  protected MAX_QUAT: Quat = quat()
  protected MIN_QUAT: Quat = quat()
  protected isUp: boolean = false

  protected impulse: number = 8
  protected capacity: number = 2
  protected ballPosition: Vec3 = v3(0, 0, -0.35)
  private balls: Array<Node> = new Array()


  onLoad() {
    Quat.fromAxisAngle(this.MAX_QUAT, Vec3.UNIT_X, math.toRadian(50))
    Quat.fromAxisAngle(this.MIN_QUAT, Vec3.UNIT_X, 0)
  }

  update(dt: number) {
    if (!this._loaded) return
  }

  protected addSubModel(prefab: Prefab): void {
    super.addSubModel(prefab)

    this.barrel = this.node.getChildByName(this.config.name).getChildByName('barrelCannon')

    let ballPrefab = LilliputAssetMgr.instance.getTerrainPrefab('cannonBall')
    if (ballPrefab) {
      this.initBullet(ballPrefab)
    } else {
      resources.load(`prefab/terrain/weapon/cannonBall`, Prefab, (err, data) => {
        LilliputAssetMgr.instance.addTerrainPrefab('cannonBall', data)
        this.initBullet(data)
      })
    }
  }

  preview(preview: boolean): void {
    super.preview(preview)

    if (preview) {
      this.schedule(this.autoRotate, 0.033)
    } else {
      this.unschedule(this.autoRotate)
    }
  }

  interact(action: Game.CharacterState) {
    switch (action) {
      case Game.CharacterState.Attack:
        this.fire()
        break
    }
  }

  private autoRotate() {
    let angle = Quat.getAxisAngle(this._rotation, this.barrel.rotation)
    if (this.isUp) {
      if (angle < CannonMgr.MAX_ANGLE - 0.016) {
        this.barrel.rotation = this.barrel.rotation.slerp(this.MAX_QUAT, 0.016)
      } else {
        this.isUp = false
      }
    } else {
      if (angle > 0.016) {
        this.barrel.rotation = this.barrel.rotation.slerp(this.MIN_QUAT, 0.016)
      } else {
        this.isUp = true
      }
    }
  }

  private initBullet(prefab: Prefab) {
    for (let i = 0; i < this.capacity; ++i) {
      let ballNode = instantiate(prefab)
      ballNode.addComponent(CannonBallMgr)
      ballNode.active = false
      ballNode.parent = null
      this.balls.push(ballNode)
    }
  }

  private fire() {
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