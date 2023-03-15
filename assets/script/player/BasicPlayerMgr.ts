import {
  clamp, Component, CylinderCollider, DirectionalLight, Event, geometry,
  ICollisionEvent, instantiate, ITriggerEvent, lerp, Node, PhysicsSystem, Prefab, quat, Quat,
  RigidBody, SkeletalAnimation, SkinnedMeshRenderer, Texture2D,
  tween, UITransform, v2, v3, Vec2, Vec3, _decorator, physics
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

export const Move_Speed = 2
export const Roate_Speed = 8

const StateAnim: Map<Game.CharacterState, string> = new Map()

StateAnim.set(Game.CharacterState.Idle, 'Idle')
StateAnim.set(Game.CharacterState.Run, 'Running')
StateAnim.set(Game.CharacterState.Jump, 'Jumping')
StateAnim.set(Game.CharacterState.JumpUp, 'JumpUp')
StateAnim.set(Game.CharacterState.JumpLand, 'JumpLanding')
StateAnim.set(Game.CharacterState.Sit, 'Sitting')
StateAnim.set(Game.CharacterState.Dance, 'Dancing')
StateAnim.set(Game.CharacterState.Lift, 'Lifting')
StateAnim.set(Game.CharacterState.Throw, 'Throw')
StateAnim.set(Game.CharacterState.Kick, 'Kicking')
StateAnim.set(Game.CharacterState.BoxIdle, 'BoxIdle')
StateAnim.set(Game.CharacterState.BoxWalk, 'BoxWalk')
StateAnim.set(Game.CharacterState.Climb, 'Climbing')
StateAnim.set(Game.CharacterState.Push, 'Push')

@ccclass('BasicPlayerMgr')
export default class BasicPlayerMgr extends Component {
  followCamera: Node
  followLight: DirectionalLight
  userProfile: User.Profile



  private _curDir: Vec2 = v2()
  get curDir() { return this._curDir }

  protected rigidBody: RigidBody
  protected fixedConstraint: physics.FixedConstraint
  protected animation: SkeletalAnimation
  protected meshRenderer: SkinnedMeshRenderer

  protected _rotation: Quat = quat()
  protected _rotateSpeed: number = 0
  protected _rotationSpeedTo: number = 0
  protected _dir = v3()
  protected _speed = v3()

  private propNode: Node

  protected curInteractProp: Node = null
  protected canClimb: boolean = false

  onLoad() {
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
    this.getComponent(CylinderCollider).on('onCollisionExit', this.onCollisionStay, this)
    this.getComponent(CylinderCollider).on('onTriggerEnter', this.onTriggerEnter, this)
    this.getComponent(CylinderCollider).on('onTriggerStay', this.onTriggerStay, this)
    this.getComponent(CylinderCollider).on('onTriggerExit', this.onTriggerExit, this)
  }

  init(profile: User.Profile) {
    this.userProfile = profile
    let skin = 'f947ed55-7e34-4a82-a9db-8a9cf6f2e608' == profile.uid ? 'cyborgFemaleA' : 'criminalMaleA'
    this.meshRenderer.material.setProperty('mainTexture', IslandAssetMgr.getTexture(skin) as Texture2D)

    return this
  }


  resume() {
    this.rigidBody.clearState()
    this.rigidBody.useGravity = true
    this.rigidBody.type = RigidBody.Type.DYNAMIC

    this._curDir.set(Vec2.ZERO)
    this._rotateSpeed = 0
    this._rotationSpeedTo = 0

    this._state = Game.CharacterState.Idle
    this.animation?.crossFade(StateAnim.get(this._state), 0)

    this._dir.set(Vec3.ZERO)
    this._speed.set(Vec3.ZERO)

    this.curInteractProp = null
    this.canClimb = false
  }

  protected onCollisionEnter(event: ICollisionEvent) {

  }

  protected onCollisionExit(event: ICollisionEvent) {

  }

  protected onCollisionStay(event: ICollisionEvent) {
    switch (this._state) {
      case Game.CharacterState.JumpUp:
      case Game.CharacterState.Climb:
        break

      case Game.CharacterState.Run:
        if (event.otherCollider.node.name == 'dice') {
          console.log('dice')
          this.fixedConstraint.connectedBody = event.otherCollider.node.getComponent(RigidBody)
        } else {

        }
      default:
        this.rigidBody.clearState()
        break
    }
  }

  protected onTriggerEnter(event: ITriggerEvent) {
    this.curInteractProp = event.otherCollider.node
    if (this.curInteractProp.name == 'ladder') { this.canClimb = true }
  }

  protected onTriggerStay(event: ITriggerEvent) {
    // if (event.otherCollider.node.name == 'ladder') {
    //   this.canClimb = true
    //   console.log(this.canClimb)
    // }
  }

  protected onTriggerExit(event: ITriggerEvent) {
    if (this.curInteractProp == null) {
      this.canClimb = false
    } else if (this.curInteractProp == event.otherCollider.node) {
      this.curInteractProp = null
      this.canClimb = false
    } else if (this.curInteractProp.name == 'ladder') {
      this.canClimb = true
    }
  }

  update(dt: number) {
    // 垂直修正
    if (!this.node.up.equals(Vec3.UNIT_Y, 0.02)) {
      let forward = this.node.forward.negative()
      this._dir.set(forward.x, 0, forward.z)
      Quat.fromViewUp(this._rotation, this._dir.normalize())
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


    if (!Vec2.ZERO.equals(this._curDir)) {
      let dir = this.node.forward.negative()
      Vec3.multiplyScalar(this._speed, dir, Move_Speed)
      this._speed.y = 0
      this.rigidBody.setLinearVelocity(this._speed)
    } else {
      this.rigidBody.clearVelocity()
    }
  }

  onAction(msg: Game.Msg) {
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

  protected jump() {
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

  protected lift() {
    if (this.curInteractProp == null) return
    this.state = Game.CharacterState.Lift

    this.curInteractProp.getComponent(TerrainItemMgr).beenCollected()
    this.propNode.removeAllChildren()
    this.propNode.addChild(this.curInteractProp)
  }

  protected throw() {
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

  protected kick() {
    if (this.curInteractProp == null) return
    Vec3.subtract(this._dir, this.curInteractProp.position, this.node.position)
    this._rotationSpeedTo = 0
    this._rotateSpeed = 0
    let rotation = quat()
    Quat.fromViewUp(rotation, this._dir)
    this.node.rotation = rotation

    this.state = Game.CharacterState.Kick
  }

  protected climb() {
    if (!this.canClimb) return

    let ladderMgr = this.curInteractProp.getComponent(LadderMgr)
    let pos = ladderMgr.ladderPos
    Vec3.subtract(this._dir, this.node.position, this.curInteractProp.position)
    this._rotationSpeedTo = 0
    this._rotateSpeed = 0
    let rotation = quat()
    Quat.rotateY(rotation, rotation, (ladderMgr.info.angle - 180) * Math.PI / 180)
    this.node.rotation = rotation

    this.node.position = pos
    this.state = Game.CharacterState.Climb
  }




  protected _state: Game.CharacterState = Game.CharacterState.Idle
  protected get state() { return this._state }
  protected set state(state: Game.CharacterState) {
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
        this.rigidBody.useGravity = false
        break
      case Game.CharacterState.JumpLand:
        this.rigidBody.useGravity = true
        break
      case Game.CharacterState.Run:
        this.rigidBody.clearForces()
        this.rigidBody.useGravity = true
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