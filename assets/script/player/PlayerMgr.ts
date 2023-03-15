import {
  clamp, Component, CylinderCollider, DirectionalLight, Event, geometry,
  ICollisionEvent, instantiate, ITriggerEvent, lerp, Node, PhysicsSystem, Prefab, quat, Quat,
  RigidBody, SkeletalAnimation, SkinnedMeshRenderer, Texture2D,
  tween, UITransform, v2, v3, Vec2, Vec3, _decorator, physics, CapsuleCollider, Animation
} from 'cc'
import BattleService from '../BattleService'
import { Game, User } from '../model'
import IslandAssetMgr from '../IslandAssetMgr'
import TerrainItemMgr from '../TerrainItemMgr'
import { RockerTarget } from '../ui/RockerMgr'
import LadderMgr from '../prop/LadderMgr'
const { ccclass, property } = _decorator


export class PlayerEvent extends Event {

  action: Game.CharacterState
  interactProp: number

  static Type = {
    OnAction: 'OnAction'
  }

  constructor(type: string, action: Game.CharacterState, interactProp: number = -1) {
    super(type, true)
    this.action = action
    this.interactProp = interactProp
  }
}

const Move_Speed = 2
const Roate_Speed = 8

const StateAnim: Map<Game.CharacterState, string> = new Map()

StateAnim.set(Game.CharacterState.Idle, 'Idle')
StateAnim.set(Game.CharacterState.Run, 'Run')
StateAnim.set(Game.CharacterState.BoxIdle, 'BoxIdle')
StateAnim.set(Game.CharacterState.BoxWalk, 'BoxWalk')
StateAnim.set(Game.CharacterState.Sit, 'Sit')
StateAnim.set(Game.CharacterState.Climb, 'Climb')
StateAnim.set(Game.CharacterState.Jump, 'Jump')
StateAnim.set(Game.CharacterState.JumpUp, 'JumpUp')
StateAnim.set(Game.CharacterState.JumpLand, 'JumpLand')
StateAnim.set(Game.CharacterState.Lift, 'Lift')
StateAnim.set(Game.CharacterState.Throw, 'Throw')
StateAnim.set(Game.CharacterState.Kick, 'Kick')
StateAnim.set(Game.CharacterState.Push, 'Push')
StateAnim.set(Game.CharacterState.Grab, 'Grab')
StateAnim.set(Game.CharacterState.PickUp, 'PickUp')
StateAnim.set(Game.CharacterState.Watering, 'Watering')
StateAnim.set(Game.CharacterState.Attack, 'AttackDownward')
StateAnim.set(Game.CharacterState.Dance, 'Dance')

@ccclass('PlayerMgr')
export default class PlayerMgr extends Component implements RockerTarget {

  @property(Node)
  dirNode: Node

  @property(Prefab)
  propPrefab: Node

  followCamera: Node
  followLight: DirectionalLight
  userProfile: User.Profile
  private myself: boolean = true

  private _state: Game.CharacterState = Game.CharacterState.Idle
  get state() { return this._state }

  private _curDir: Vec2 = v2()
  get curDir() { return this._curDir }

  private _rotation: Quat = quat()
  private _rotateSpeed: number = 0
  private _rotationSpeedTo: number = 0

  private dstPos = v3(Vec3.NEG_ONE)

  private v3_dir = v3()
  private v3_speed = v3()

  private rigidBody: RigidBody
  private fixedConstraint: physics.FixedConstraint
  private animation: SkeletalAnimation
  private meshRenderer: SkinnedMeshRenderer

  private propNode: Node
  private curInteractProp: Node = null
  private canClimb: boolean = false
  private canMove: boolean = false

  async onLoad() {
    this.rigidBody = this.getComponent(RigidBody)
    this.node.getChildByName('Character').scale = v3(.25, .25, .25)
    this.animation = this.getComponentInChildren(SkeletalAnimation)
    this.meshRenderer = this.getComponentInChildren(SkinnedMeshRenderer)
    this.propNode = this.animation.sockets[0].target.getChildByName('Prop')
    this.fixedConstraint = this.getComponent(physics.FixedConstraint)
  }

  start() {
    this.getComponent(CylinderCollider).on('onCollisionEnter', this.onCollisionEnter, this)
    this.getComponent(CylinderCollider).on('onCollisionStay', this.onCollisionStay, this)
    this.getComponent(CylinderCollider).on('onCollisionExit', this.onCollisionExit, this)
    this.getComponent(CylinderCollider).on('onTriggerEnter', this.onTriggerEnter, this)
    this.getComponent(CylinderCollider).on('onTriggerStay', this.onTriggerStay, this)
    this.getComponent(CylinderCollider).on('onTriggerExit', this.onTriggerExit, this)

    // let prop = instantiate(this.propPrefab)
    // prop.scale.set(0.05, 0.05, 0.05)
    // this.animation.sockets[0].target.addChild(prop)
  }

  resume() {
    this.rigidBody.clearState()
    this.rigidBody.useGravity = true
    this.rigidBody.type = RigidBody.Type.DYNAMIC

    this.fixedConstraint.connectedBody = null

    this._curDir.set(Vec2.ZERO)
    this._rotateSpeed = 0
    this._rotationSpeedTo = 0

    this._state = Game.CharacterState.Idle
    this.animation?.crossFade(StateAnim.get(this._state), 0)

    this.v3_dir.set(Vec3.ZERO)
    this.v3_speed.set(Vec3.ZERO)

    this.dstPos.set(Vec3.NEG_ONE)

    this.curInteractProp = null
    this.canClimb = false
  }

  init(profile: User.Profile) {
    this.userProfile = profile
    let skin = 'f947ed55-7e34-4a82-a9db-8a9cf6f2e608' == profile.uid ? 'cyborgFemaleA' : 'criminalMaleA'
    this.meshRenderer.material.setProperty('mainTexture', IslandAssetMgr.getTexture(skin) as Texture2D)

    this.myself = BattleService.isMyself(profile.uid)
    return this
  }

  private onCollisionEnter(event: ICollisionEvent) {

    if (event.otherCollider.node.name == 'dice') {
      this.fixedConstraint.connectedBody = event.otherCollider.node.getComponent(RigidBody)
      PhysicsSystem.instance.syncSceneToPhysics()
    }
  }

  private onCollisionExit(event: ICollisionEvent) {
    if (event.otherCollider.node.name == 'dice' && this.fixedConstraint.connectedBody != null) {
      console.log('remove dice contraint')
      this.fixedConstraint.connectedBody = null
    }
  }

  private onCollisionStay(event: ICollisionEvent) {
    switch (this._state) {
      case Game.CharacterState.JumpUp:
      case Game.CharacterState.Climb:
        break

      case Game.CharacterState.Run:
        if (event.otherCollider.node.getComponent(RigidBody) == this.fixedConstraint.connectedBody) {
          console.log('add dice contraint')
        }
      default:
        this.rigidBody.clearState()
        break
    }
  }

  private onTriggerEnter(event: ITriggerEvent) {
    this.curInteractProp = event.otherCollider.node
    if (this.curInteractProp.name == 'ladder') { this.canClimb = true }
  }

  private onTriggerStay(event: ITriggerEvent) {
    // if (event.otherCollider.node.name == 'ladder') {
    //   this.canClimb = true
    //   console.log(this.canClimb)
    // }
  }

  private onTriggerExit(event: ITriggerEvent) {
    if (this.curInteractProp == null) {
      this.canClimb = false
    } else if (this.curInteractProp == event.otherCollider.node) {
      this.curInteractProp = null
      this.canClimb = false
    } else if (this.curInteractProp.name == 'ladder') {
      this.canClimb = true
    }

    if (event.otherCollider.node.name == 'dice') {
      console.log(this.fixedConstraint.connectedBody)
    }
  }

  update(dt: number) {

    if (!this.node.up.equals(Vec3.UNIT_Y, 0.02)) {
      let forward = this.node.forward.negative()
      this.v3_dir.set(forward.x, 0, forward.z)
      Quat.fromViewUp(this._rotation, this.v3_dir.normalize())
      this.node.rotation = this._rotation
    }

    if (this._rotationSpeedTo != 0) {
      this._rotateSpeed = lerp(this._rotateSpeed, this._rotationSpeedTo, 30 * dt)
      this.node.rotation = this.node.rotation.slerp(this._rotation, this._rotateSpeed * dt)
    }

    if (this._state == Game.CharacterState.JumpUp && !this.animState()) {
      this.rigidBody.applyImpulse(v3(0, -8, 0), Vec3.ZERO)
      this.state = Game.CharacterState.JumpLand
    }

    if (!this.animState()) {
      this.state = Game.CharacterState.Idle
    }

    if (!this.myself) {
      if (this.dstPos.equals(Vec3.NEG_ONE)) {
        let frame = BattleService.popGameFrame(this.userProfile.uid)
        if (frame) this.onAction(frame)
      }
    }

    if (this.dstPos.equals(this.node.position, 0.06)) {
      this.dstPos.set(Vec3.NEG_ONE)
      this.rigidBody.clearState()
      this.state = Game.CharacterState.Idle
    }

    if (!this.dstPos.equals(Vec3.NEG_ONE)) {
      this.runTo()
    }

    if (this._state == Game.CharacterState.Run) {
      let dir = this.node.forward.negative()
      this.rigidBody.getLinearVelocity(this.v3_speed)
      let speedY = this.v3_speed.y
      Vec3.multiplyScalar(this.v3_speed, dir, Move_Speed)
      this.v3_speed.y = speedY
      this.rigidBody.setLinearVelocity(this.v3_speed)
    } else if (this._state == Game.CharacterState.Climb) {
      if (!this.canClimb) {
        this.state = Game.CharacterState.Idle
        this.dstPos.set(this.node.forward.negative())
        this.dstPos.add(this.node.position)
        this.runTo()
      } else {
        this.v3_speed.set(0, 0.3, 0)
        this.rigidBody.setLinearVelocity(this.v3_speed)
      }
    }
  }

  onAction(msg: Game.Msg) {
    if (this.myself) this.dstPos.set(Vec3.NEG_ONE)
    switch (msg.state) {
      case Game.CharacterState.JumpUp:
        this.jump()
        break
      case Game.CharacterState.Lift:
        this.lift()
        break
      case Game.CharacterState.Throw:
        this.throw()
        break
      case Game.CharacterState.Kick:
        this.kick()
        break
      case Game.CharacterState.Run:
        // if (this.myself) return
        this.dstPos.set(msg.pos.x, msg.pos.y, msg.pos.z)
        this.runTo()
        break
      case Game.CharacterState.Idle:
        this.state = Game.CharacterState.Idle
        // this.node.forward = dir
        this.rigidBody.clearState()
        this.rigidBody.sleep()
        break
      case Game.CharacterState.BoxIdle:
        this.state = Game.CharacterState.BoxIdle
        this.rigidBody.clearState()
        this.rigidBody.sleep()
        break
      case Game.CharacterState.BoxWalk:
        this.state = Game.CharacterState.BoxWalk
        this.rigidBody.clearState()
        this.rigidBody.sleep()
        break
      case Game.CharacterState.Climb:
        this.climb()
        break
      case Game.CharacterState.Push:
        this.state = Game.CharacterState.Push

        break
    }
  }

  onDirectionChanged(dir: Vec2) {
    if (this._state != Game.CharacterState.Idle &&
      this._state != Game.CharacterState.Run &&
      this._state != Game.CharacterState.JumpUp &&
      this._state != Game.CharacterState.Push) {
      return
    }

    this._curDir.set(dir)
    if (this._state == Game.CharacterState.Run && dir.equals(Vec2.ZERO)) {
      this.state = Game.CharacterState.Idle
      return
    }

    this._rotationSpeedTo = Roate_Speed
    this._rotateSpeed = 0
    this.state = Game.CharacterState.Run
    this.dstPos.set(Vec3.NEG_ONE)

    let forward = this.followCamera.forward
    this.v3_dir.set(forward.x, 0, forward.z)
    if (!Vec2.ZERO.equals(this._curDir)) {
      Vec3.rotateY(this.v3_dir, this.v3_dir, Vec3.ZERO, this._curDir.signAngle(Vec2.UNIT_Y))
    }
    Quat.fromViewUp(this._rotation, this.v3_dir.normalize())
  }

  onEditModel(edit: boolean) {
    PhysicsSystem.instance.enable = !edit
    if (!edit) {
      this.resume()
    }
  }

  private jump() {
    this.state = Game.CharacterState.JumpUp
    if (this._state != Game.CharacterState.JumpUp) return
    setTimeout(() => {
      let pos = v3(this.node.position)
      pos.y += 0.1
      this.node.position = pos
      this.rigidBody.useGravity = true
      this.rigidBody.applyImpulse(v3(this._curDir.x * 2, 6, this._curDir.y * 2), v3(0, 0, 0))
    }, 500)
  }

  private lift() {
    if (this.curInteractProp == null) return
    this.state = Game.CharacterState.Lift

    this.curInteractProp.getComponent(TerrainItemMgr).beenCollected()
    this.propNode.removeAllChildren()
    this.propNode.addChild(this.curInteractProp)
  }

  private pickUp() {

  }

  private throw() {
    this.rigidBody.sleep()
    this._rotateSpeed = 0
    this.state = Game.CharacterState.Throw
    setTimeout(() => {
      // let node = instantiate(this.prop)
      // let pos = v3(this.node.position)
      // pos.y += 0.5
      // node.position = pos
      // this.node.parent.addChild(node)
      // let forward = this.node.forward.negative()
      // node.getComponent(RigidBody).applyImpulse(v3(forward.x * 5, this.jumpImpluse, forward.z * 5))
    }, 700)
  }

  private kick() {
    if (this.curInteractProp == null) return
    Vec3.subtract(this.v3_dir, this.curInteractProp.position, this.node.position)
    this._rotationSpeedTo = 0
    this._rotateSpeed = 0
    let rotation = quat()
    Quat.fromViewUp(rotation, this.v3_dir)
    this.node.rotation = rotation

    this.state = Game.CharacterState.Kick
  }

  private climb() {
    if (!this.canClimb) return

    let ladderMgr = this.curInteractProp.getComponent(LadderMgr)
    let pos = ladderMgr.ladderPos
    Vec3.subtract(this.v3_dir, this.node.position, this.curInteractProp.position)
    this._rotationSpeedTo = 0
    this._rotateSpeed = 0
    let rotation = quat()
    Quat.rotateY(rotation, rotation, (ladderMgr.info.angle - 180) * Math.PI / 180)
    this.node.rotation = rotation

    this.node.position = pos
    this.state = Game.CharacterState.Climb
  }

  private runTo() {
    this.state = Game.CharacterState.Run
    Vec3.subtract(this.v3_dir, this.dstPos, this.node.position)
    this._rotationSpeedTo = 0
    this._rotateSpeed = 0
    let rotation = quat()
    Quat.fromViewUp(rotation, this.v3_dir)
    this.node.rotation = rotation
    this.v3_dir.set(Vec3.ZERO)
  }

  private boxIdle() {
    this.state = Game.CharacterState.BoxIdle
  }

  private boxWalk() {
    this.state = Game.CharacterState.BoxWalk
  }

  private push() {
    this.state = Game.CharacterState.Push
  }

  private onBoat() {
    let dstY = this.node.position.y + 0.05
    let originY = this.node.position.y - 0.05
    let pos = v3(this.node.position)
    tween(this.node).to(0.5, { position: pos }, {
      easing: 'smooth', onComplete: () => {
        pos.y = this.node.position.y == dstY ? originY : dstY
      }
    }).repeatForever().start()

    this.sit()
  }

  private sit() {
    this.rigidBody.sleep()
    this._rotateSpeed = 0
    this.state = Game.CharacterState.Sit
  }

  private set state(state: Game.CharacterState) {
    // same state, not work
    if (this._state == state) return

    // on action ongoing, can not break except idle or run
    if (this._state != Game.CharacterState.Idle &&
      this._state != Game.CharacterState.Run &&
      this._state != Game.CharacterState.Climb &&
      this.animState())
      return

    this.animation?.crossFade(StateAnim.get(state), 0)
    this._state = state
    this.rigidBody.clearState()
    this.rigidBody.type = RigidBody.Type.DYNAMIC

    switch (this._state) {
      case Game.CharacterState.Idle:
        this.rigidBody.clearState()
        this.rigidBody.sleep()
        this.rigidBody.setLinearVelocity(Vec3.ZERO)
        this.rigidBody.useGravity = true
        this.dstPos.set(Vec3.NEG_ONE)
        break
      case Game.CharacterState.JumpLand:
        this.rigidBody.useGravity = true
        break
      case Game.CharacterState.Run:
        this.rigidBody.clearForces()
        this.rigidBody.useGravity = false
        break
      case Game.CharacterState.Lift:
      case Game.CharacterState.Throw:
      case Game.CharacterState.Kick:
      case Game.CharacterState.Climb:
        this.rigidBody.useGravity = false
        break
    }
  }

  private animState() {
    return this.animation.getState(StateAnim.get(this._state)).isPlaying
  }
}

