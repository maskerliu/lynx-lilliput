import {
  CapsuleCollider,
  clamp,
  Component, DirectionalLight, Event, geometry,
  ICollisionEvent, instantiate, lerp, Node, PhysicsSystem, Prefab, Quat,
  resources, RigidBody, tween, UITransform, v2, v3, Vec2, Vec3, _decorator
} from 'cc'
import BoatMgr from './BoatMgr'
import CharacterMgr from './CharacterMgr'
import { Game, User } from './model'
import TerrainItemMgr from './TerrainItemMgr'
import { RockerTarget } from './ui/RockerMgr'


export class PlayerActionEvent extends Event {

  action: Game.CharacterState

  constructor(name: string, action: Game.CharacterState, bubbles?: boolean) {
    super(name, bubbles)
    this.action = action
  }
}

const { ccclass, property } = _decorator


let v3_1 = v3()
let v3_2 = v3()
let v2_1 = v2()

const Move_Speed = 100
const Jump_Speed = 400
const Roate_Speed = 10

@ccclass('PlayerMgr')
export default class PlayerMgr extends Component implements RockerTarget {

  followCamera: Node
  followLight: DirectionalLight

  private curDir: Vec2 = v2()
  private _rotation: Quat = new Quat()
  private _rotateSpeed: number = 0
  private _rotationSpeedTo: number = 0

  private rigidBody: RigidBody

  private boatMgr: BoatMgr
  private characterMgr: CharacterMgr

  private prop: Prefab

  private _ray: geometry.Ray = new geometry.Ray()
  private correctPos = v3()
  private occlusionPos = v3()
  private worldPos = v3()

  userProfile: User.Profile

  async onLoad() {
    this.rigidBody = this.getComponent(RigidBody)
    this.characterMgr = this.getComponentInChildren(CharacterMgr)
  }

  start() {
    // this.onBoat()
    this.idle()
    this.getComponent(CapsuleCollider).on('onCollisionEnter', this.onCollision, this)

    resources.load('prefab/prop/apple', Prefab, (err, prefab) => {
      this.prop = prefab
    })
  }

  init(profile: User.Profile) {
    this.userProfile = profile
    this.characterMgr.skin = 'f947ed55-7e34-4a82-a9db-8a9cf6f2e608' == profile.uid ? 'cyborgFemaleA' : 'criminalMaleA'
    this.occlusionPos.set(this.node.position)
  }

  private onCollision(event: ICollisionEvent) {
    console.log(event.otherCollider.node.name)
    // this.rigidBody.sleep()
    this.correctPos.set(this.node.position)
    this.correctPos.y = Math.round(this.node.position.y)
    this.node.position = this.correctPos
  }

  update(dt: number) {
    // if (Vec3.distance(this.occlusionPos, this.node.position) > 1) {
    //   this.occlusionPos.set(this.node.position)
    //   this.occlusionPos.y += 0.2
    //   this.occlusion()
    // }

    if (this._rotationSpeedTo != 0) {
      this._rotateSpeed = lerp(this._rotateSpeed, this._rotationSpeedTo, 30 * dt)
      this.node.rotation = this.node.rotation.slerp(this._rotation, this._rotateSpeed * dt)
    }
    if (this.characterMgr.state == Game.CharacterState.JumpLanding || this.characterMgr.state == Game.CharacterState.JumpUp) {
      this.rigidBody.useGravity = true
    } else {
      this.rigidBody.useGravity = false
    }


    switch (this.characterMgr.state) {
      case Game.CharacterState.Running: {
        let dir = this.node.forward.negative()
        Vec3.multiplyScalar(v3_2, dir, Move_Speed * dt)

        this.rigidBody.setLinearVelocity(v3_2)

        this.rigidBody.getLinearVelocity(v3_2)
        v3_2.x = clamp(v3_2.x, -5, 5)
        v3_2.y = 0
        v3_2.z = clamp(v3_2.z, -5, 5)
        this.rigidBody.setLinearVelocity(v3_2)
        break
      }
      case Game.CharacterState.JumpUp:
        if (!this.curDir.equals(Vec2.ZERO)) {
          this.rigidBody.getLinearVelocity(v3_2)
          v3_2.x = -this.curDir.x * Move_Speed * dt
          v3_2.z = -this.curDir.y * Move_Speed * dt
          this.rigidBody.setLinearVelocity(v3_2)
          // this.rigidBody.applyImpulse(v3(this.curDir.x, 0, this.curDir.y))
        }
        break
      case Game.CharacterState.Idle: {
        this.idle()
        break
      }
    }
  }


  onDirectionChanged(dir: Vec2) {
    this.curDir = dir
    if (dir.equals(Vec2.ZERO)) {
      this.characterMgr.updateState(Game.CharacterState.Idle)
      this.idle()
      return
    }

    this._rotationSpeedTo = Roate_Speed

    if (this.characterMgr.state == Game.CharacterState.JumpLanding) return

    if (this.characterMgr.state != Game.CharacterState.JumpUp) {
      this.characterMgr.updateState(Game.CharacterState.Running)
    }
    this.updateRotationByTouch()
  }

  onAction(state: Game.CharacterState) {
    switch (state) {
      case Game.CharacterState.JumpUp:
        this.jump()
        break
      case Game.CharacterState.Lifting:
        this.lift()
        break
      case Game.CharacterState.Throwing:
        this.throw()
        break
      case Game.CharacterState.Kicking:
        this.kick()
        break
    }
  }

  jump() {
    let success = this.characterMgr.updateState(Game.CharacterState.JumpUp)
    if (!success) return

    this.rigidBody.sleep()
    setTimeout(() => {
      let forward = this.node.forward.negative()
      this.rigidBody.applyImpulse(v3(this.curDir.x * 20, 80, this.curDir.y * 20))
    }, 500)
  }

  lift() {
    this.rigidBody.sleep()
    this.characterMgr.updateState(Game.CharacterState.Lifting)
  }

  throw() {
    this.rigidBody.sleep()
    this._rotateSpeed = 0
    this.characterMgr.updateState(Game.CharacterState.Throwing)

    setTimeout(() => {
      let node = instantiate(this.prop)
      let pos = v3(this.node.position)
      pos.y += 0.5
      node.position = pos
      this.node.parent.addChild(node)

      // node.addComponent(RigidBody)
      // node.getComponent(RigidBody).type = RigidBody.Type.DYNAMIC
      // node.getComponent(RigidBody).group = PhyEnvGroup.Prop
      // node.getComponent(RigidBody).setMask(PhyEnvGroup.Terrain + PhyEnvGroup.Prop + PhyEnvGroup.Vehicle)

      // node.addComponent(MeshCollider)
      // node.getComponent(MeshCollider).mesh = node.getComponentInChildren(MeshRenderer).mesh
      // node

      let forward = this.node.forward.negative()
      node.getComponent(RigidBody).applyForce(v3(forward.x * 200, 450, forward.z * 200))
    }, 700)
  }

  kick() {
    this.rigidBody.sleep()
    this.characterMgr.updateState(Game.CharacterState.Kicking)
  }

  onBoat() {
    let dstY = this.node.position.y + 0.05
    let originY = this.node.position.y - 0.05
    let pos = v3(this.node.position)
    tween(this.node).to(0.5, { position: pos }, {
      easing: 'smooth', onComplete: () => {
        pos.y = this.node.position.y == dstY ? originY : dstY
      }
    }).repeatForever().start()

    this.boatMgr.float()
    this.sit()
  }

  private idle() {
    this.rigidBody.clearVelocity()
    this.rigidBody.clearState()
    this.rigidBody.clearForces()
    this.rigidBody.sleep()
    this._rotateSpeed = 0
  }

  private sit() {
    this.rigidBody.sleep()
    this._rotateSpeed = 0
    this.characterMgr.updateState(Game.CharacterState.Sitting)
  }

  private updateRotationByTouch() {
    // if (!this.isUpdateTr || !this.isRocker) return
    let forward = this.followCamera.forward
    v3_1.set(forward.x, 0, forward.z)
    if (this.curDir.x != 0 || this.curDir.y != 0) {
      v2_1.set(this.curDir)
      Vec3.rotateY(v3_1, v3_1, Vec3.ZERO, v2_1.signAngle(Vec2.UNIT_Y))
    }

    Quat.fromViewUp(this._rotation, v3_1.normalize())
  }

  private occlusion() {
    this.node.getComponent(UITransform).convertToWorldSpaceAR(this.occlusionPos, this.worldPos)
    geometry.Ray.fromPoints(this._ray, this.followCamera.position, this.worldPos)

    if (!PhysicsSystem.instance.raycast(this._ray, 0xffffffff, 500)) return false

    for (let i = 0; i < PhysicsSystem.instance.raycastResults.length; i++) {
      const item = PhysicsSystem.instance.raycastResults[i]
      let mgr = item.collider.node.getComponent(TerrainItemMgr)
      if (mgr) {
        mgr.translucent(true)
      }
    }

  }

}

