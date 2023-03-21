import {
  Component, CylinderCollider, DirectionalLight, Event, ICollisionEvent, ITriggerEvent, lerp, Node, Prefab, quat, Quat,
  RigidBody, SkeletalAnimation, SkinnedMeshRenderer, Texture2D,
  tween, v2, v3, Vec2, Vec3, _decorator
} from 'cc'
import BattleService from '../BattleService'
import IslandAssetMgr from '../IslandAssetMgr'
import { isDebug } from '../misc/Utils'
import { Game, User } from '../model'
import LadderMgr from '../prop/LadderMgr'
import TerrainItemMgr from '../TerrainItemMgr'
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
export const Climb_Speed = 0.4
export const Roate_Speed = 8

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

export default class PlayerMgr extends Component {

  @property(Node)
  dirNode: Node

  @property(Prefab)
  propPrefab: Node

  followCamera: Node
  followLight: DirectionalLight
  userProfile: User.Profile

  protected _state: Game.CharacterState = Game.CharacterState.Idle
  protected _postState: Game.CharacterState = Game.CharacterState.None
  get state() { return this._state }

  protected _curDir: Vec2 = v2()
  get curDir() { return this._curDir }

  protected _rotation: Quat = quat()
  protected _rotateSpeed: number = 0
  protected _rotationSpeedTo: number = 0

  protected v3_pos = v3(Vec3.NEG_ONE)
  protected dstPos = v3(Vec3.NEG_ONE)

  protected v3_dir = v3()
  protected v3_speed = v3()

  protected rigidBody: RigidBody
  protected animation: SkeletalAnimation
  protected meshRenderer: SkinnedMeshRenderer

  protected propNode: Node
  protected curInteractProp: Node = null

  protected _canClimb: boolean = false
  protected _canSync: boolean = true
  get canSync() { return this._canSync }

  protected _isMyself: boolean = false
  get isMyself() { return this._isMyself }

  onLoad() {
    this.rigidBody = this.getComponent(RigidBody)
    this.node.getChildByName('Character').scale = v3(.25, .25, .25)
    this.animation = this.getComponentInChildren(SkeletalAnimation)
    this.meshRenderer = this.getComponentInChildren(SkinnedMeshRenderer)
    this.propNode = this.animation.sockets[0].target.getChildByName('Prop')
  }

  start() {
    this.getComponent(CylinderCollider).on('onCollisionEnter', this.onCollisionEnter, this)
    this.getComponent(CylinderCollider).on('onCollisionStay', this.onCollisionStay, this)
    this.getComponent(CylinderCollider).on('onCollisionExit', this.onCollisionExit, this)

    this.getComponent(CylinderCollider).on('onTriggerEnter', this.onTriggerEnter, this)
    this.getComponent(CylinderCollider).on('onTriggerStay', this.onTriggerStay, this)
    this.getComponent(CylinderCollider).on('onTriggerExit', this.onTriggerExit, this)
  }

  status() {
    console.log(this.rigidBody.isAwake)
  }


  sleep() {
    this.rigidBody.clearState()
    this.rigidBody.sleep()
    this.rigidBody.useGravity = false
  }

  resume() {
    this.rigidBody.clearState()
    this.rigidBody.useGravity = true

    this._curDir.set(Vec2.ZERO)
    this._rotateSpeed = 0
    this._rotationSpeedTo = 0

    this._state = Game.CharacterState.Idle
    this.animation?.crossFade(StateAnim.get(this._state), 0)

    this.v3_dir.set(Vec3.ZERO)
    this.v3_speed.set(Vec3.ZERO)

    this.dstPos.set(Vec3.NEG_ONE)

    this.curInteractProp = null
    this._canClimb = false
  }

  init(profile: User.Profile) {
    this.userProfile = profile
    let skin = 'f947ed55-7e34-4a82-a9db-8a9cf6f2e608' == profile.uid ? 'cyborgFemaleA' : 'criminalMaleA'
    this.meshRenderer.material.setProperty('mainTexture', IslandAssetMgr.getTexture(skin) as Texture2D)

    let debugNode = this.node.getChildByName('Debug')
    if (debugNode) debugNode.active = isDebug

    return this
  }

  update(dt: number) {
    if (!this.node.up.equals(Vec3.UNIT_Y, 0.02)) {
      let forward = this.node.forward.negative()
      this.v3_dir.set(forward.x, 0, forward.z)
      Quat.fromViewUp(this._rotation, this.v3_dir.normalize())
      this.node.rotation = this._rotation
    }

    this.rigidBody.getLinearVelocity(this.v3_speed)
    this._canSync = this.v3_speed.y >= 0

    if (this._rotationSpeedTo != 0) {
      this._rotateSpeed = lerp(this._rotateSpeed, this._rotationSpeedTo, 30 * dt)
      this.node.rotation = this.node.rotation.slerp(this._rotation, this._rotateSpeed * dt)
    }

    if (this._state == Game.CharacterState.JumpUp && !this.animState()) {
      this.state = Game.CharacterState.JumpLand
    }

    if (!this.animState()) {
      this.state = Game.CharacterState.Idle
    }
  }

  onAction(msg: Game.Msg) {
    this._postState = Game.CharacterState.None
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
        this.dstPos.set(msg.pos.x, msg.pos.y, msg.pos.z)
        this._postState = msg.state
        break
      case Game.CharacterState.Idle:
        this.v3_pos.set(msg.pos.x, msg.pos.y, msg.pos.z)
        this.rigidBody.getLinearVelocity(this.v3_speed)
        if (this.v3_speed.y < 0) {
          this.state = msg.state
          break
        }

        if (this.node.position.equals(this.v3_pos, 0.02)) {
          this.state = msg.state
          this.dstPos.set(Vec3.NEG_ONE)
          this.v3_dir.set(msg.dir.x, msg.dir.y, msg.dir.z)
          this._rotateSpeed = 0
          this._rotationSpeedTo = 0
          Quat.fromViewUp(this._rotation, this.v3_dir.normalize())
          this.node.rotation = this._rotation
        } else {
          this.dstPos.set(this.v3_pos)
          this.runTo()
          this._postState = msg.state
        }
        break
      case Game.CharacterState.BoxIdle:
        this.state = Game.CharacterState.BoxIdle
        break
      case Game.CharacterState.BoxWalk:
        this.state = Game.CharacterState.BoxWalk
        break
      case Game.CharacterState.Climb:
        this.climb()
        break
      case Game.CharacterState.Push:
        this.state = Game.CharacterState.Push
        break
    }
  }

  onEditModel(edit: boolean, pos: Vec3) {
    this.rigidBody.useGravity = !edit
    this.node.position.set(pos)
  }

  private onCollisionEnter(event: ICollisionEvent) {

    if (event.otherCollider.node.name == 'dice') {

    }
  }

  private onCollisionExit(event: ICollisionEvent) {
  }

  private onCollisionStay(event: ICollisionEvent) {
    switch (this._state) {
      case Game.CharacterState.JumpUp:
      case Game.CharacterState.Climb:
      case Game.CharacterState.JumpLand:
        break
      case Game.CharacterState.Idle:
        if (event.otherCollider.node.name == 'airWall') break
      // case Game.CharacterState.Run:
      // if (event.otherCollider.node.getComponent(RigidBody) == this.fixedConstraint.connectedBody) {
      //   console.log('add dice contraint')
      // }
      default:
        this.rigidBody.clearState()
        break
    }
  }

  private onTriggerEnter(event: ITriggerEvent) {
    this.curInteractProp = event.otherCollider.node
    if (this.curInteractProp.name == 'ladder') { this._canClimb = true }
  }

  private onTriggerStay(event: ITriggerEvent) {
    if (event.otherCollider.node.name == 'ladder') {
      this._canClimb = true
    }
  }

  private onTriggerExit(event: ITriggerEvent) {
    if (this.curInteractProp == null) {
      this._canClimb = false
    } else if (this.curInteractProp == event.otherCollider.node) {
      this.curInteractProp = null
      this._canClimb = false
    } else if (this.curInteractProp.name == 'ladder') {
      this._canClimb = true
    }

    if (event.otherCollider.node.name == 'dice') {
      // console.log(this.fixedConstraint.connectedBody)
    }
  }

  protected runTo() {
    this.state = Game.CharacterState.Run
    if (this.dstPos.equals(this.node.position, 0.03)) {
      this.node.position.set(this.dstPos)
      this.dstPos.set(Vec3.NEG_ONE)
      this.state = this._postState == Game.CharacterState.None ? this.state : this._postState
      this._postState = Game.CharacterState.None
      return
    }

    this.v3_pos.set(this.node.position)
    if (Math.abs(this.dstPos.y - this.node.position.y) > 0.1) {
      this.v3_pos.y = this.dstPos.y
    } 

    Vec3.subtract(this.v3_dir, this.dstPos, this.v3_pos)    
    this._rotationSpeedTo = 0
    this._rotateSpeed = 0
    Quat.fromViewUp(this._rotation, this.v3_dir)
    this.node.rotation = this._rotation
  }

  private jump() {
    this.state = Game.CharacterState.JumpUp
    if (this._state != Game.CharacterState.JumpUp) return
    setTimeout(() => {
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

  protected pickUp() {

  }

  protected throw() {
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
    Vec3.subtract(this.v3_dir, this.curInteractProp.position, this.node.position)
    this._rotationSpeedTo = 0
    this._rotateSpeed = 0
    let rotation = quat()
    Quat.fromViewUp(rotation, this.v3_dir)
    this.node.rotation = rotation

    this.state = Game.CharacterState.Kick
  }

  protected climb() {
    if (!this._canClimb) return

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

  protected boxIdle() {
    this.state = Game.CharacterState.BoxIdle
  }

  protected boxWalk() {
    this.state = Game.CharacterState.BoxWalk
  }

  protected push() {
    this.state = Game.CharacterState.Push
  }

  protected onBoat() {
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

  protected sit() {
    this._rotateSpeed = 0
    this.state = Game.CharacterState.Sit
  }

  protected set state(state: Game.CharacterState) {
    // same state, not work
    if (this._state == state) return

    // on action ongoing, can not break except idle or run
    if (this._state != Game.CharacterState.Idle &&
      this._state != Game.CharacterState.BoxWalk &&
      this._state != Game.CharacterState.Run &&
      this._state != Game.CharacterState.BoxIdle &&
      this._state != Game.CharacterState.Climb &&
      this.animState())
      return

    this.animation?.crossFade(StateAnim.get(state), 0)
    this._state = state
    // this.rigidBody.clearState()

    switch (this._state) {
      case Game.CharacterState.Idle:
        this.rigidBody.setLinearVelocity(Vec3.ZERO)
        this.rigidBody.useGravity = true
        this.dstPos.set(Vec3.NEG_ONE)
        break
      case Game.CharacterState.JumpLand:
        this.rigidBody.useGravity = true
        break
      case Game.CharacterState.Run:
        // this.rigidBody.clearForces()
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

  protected animState() {
    return this.animation.getState(StateAnim.get(this._state)).isPlaying
  }
}

