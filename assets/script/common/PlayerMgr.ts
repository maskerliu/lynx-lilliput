import {
  BoxCollider,
  Collider,
  Component,
  CylinderCollider,
  DirectionalLight, Event, ICollisionEvent,
  ITriggerEvent,
  Node,
  Quat,
  RigidBody, SkeletalAnimation, SkinnedMeshRenderer, Texture2D,
  Vec2, Vec3, _decorator,
  instantiate,
  quat,
  tween, v2, v3
} from 'cc'
import IslandAssetMgr from '../lilliput/IslandAssetMgr'
import DiceMgr from '../lilliput/prop/DiceMgr'
import LadderMgr from '../lilliput/prop/LadderMgr'
import { isDebug } from '../misc/Utils'
import { Game, User } from '../model'


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

// export const Move_Speed = 1.5
export const Walk_Speed = 1
export const Push_Speed = 0.8
export const Climb_Speed = 0.4
export const Roate_Speed = 8

const StateAnim: Map<Game.CharacterState, string> = new Map()

StateAnim.set(Game.CharacterState.Idle, 'Idle')
StateAnim.set(Game.CharacterState.Run, 'Run')
StateAnim.set(Game.CharacterState.BoxIdle, 'BoxIdle')
StateAnim.set(Game.CharacterState.BoxWalk, 'BoxWalk')
StateAnim.set(Game.CharacterState.Sit, 'Sit')
StateAnim.set(Game.CharacterState.Climb, 'Climb')
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
StateAnim.set(Game.CharacterState.BwolingThrow, 'BwolingThrow')
StateAnim.set(Game.CharacterState.FrisbeeThrow, 'FrisbeeThrow')
StateAnim.set(Game.CharacterState.GunIdle, 'GunIdle')
StateAnim.set(Game.CharacterState.GunFire, 'GunFire')
StateAnim.set(Game.CharacterState.TreadWater, 'TreadWater')

export default class PlayerMgr extends Component {

  @property(Node)
  dirNode: Node

  rightProp: Node
  leftProp: Node
  headProp: Node

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
  protected dstForward = v3(Vec3.NEG_ONE)

  protected v3_dir = v3()
  protected v3_speed = v3()

  protected rigidBody: RigidBody
  protected collider: Collider
  protected animation: SkeletalAnimation
  protected meshRenderer: SkinnedMeshRenderer

  // protected propNode: Node
  private _tmpTriggers = []
  private _tmpCollisions = []
  protected curInteractProp: Node = null


  protected _isEdit: boolean = false
  protected _canClimb: boolean = false
  protected _canSync: boolean = true
  get canSync() { return this._canSync }

  onLoad() {
    this.rigidBody = this.getComponent(RigidBody)
    this.collider = this.getComponent(CylinderCollider)

    this.rigidBody.useCCD = true
  }

  start() {
    this.collider.on('onCollisionEnter', this.onCollisionEnter, this)
    this.collider.on('onCollisionStay', this.onCollisionStay, this)
    this.collider.on('onCollisionExit', this.onCollisionExit, this)

    this.collider.on('onTriggerEnter', this.onTriggerEnter, this)
    this.collider.on('onTriggerStay', this.onTriggerStay, this)
    this.collider.on('onTriggerExit', this.onTriggerExit, this)
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

    let name = null, skin = null

    switch (this.userProfile.uid) {
      case '8f4e7438-4285-4268-910c-3898fb8d6d96':
        name = 'puppet'
        skin = null
        break
      case 'f947ed55-7e34-4a82-a9db-8a9cf6f2e608':
        name = 'hotdog'
        skin = null
        break
      case '5ee13634-340c-4741-b075-7fe169e38a13':
        name = 'human'
        skin = 'cyborgFemaleA'
        break
      case '4e6434d1-5910-46c3-879d-733c33ded257':
        name = 'hoboRat'
        skin = 'hoboRatGreen'
        break
      case 'b09272b8-d6a4-438b-96c3-df50ac206706':
        name = 'human'
        skin = 'skaterMaleA'
        break
      default:
        name = 'human'
        skin = 'zombieA'
        break
    }

    this.animation = this.getComponent(SkeletalAnimation)
    this.meshRenderer = this.getComponentInChildren(SkinnedMeshRenderer)

    this.headProp = this.animation.sockets[0].target.getChildByName('HeadProp')
    this.leftProp = this.animation.sockets[1].target.getChildByName('LeftHandProp')
    this.rightProp = this.animation.sockets[2].target.getChildByName('RightHandProp')

    let debugNode = this.node.getChildByName('Debug')
    if (debugNode) debugNode.active = isDebug

    if (skin) {
      this.meshRenderer.material.setProperty('mainTexture', IslandAssetMgr.getTexture(skin) as Texture2D)
    }

    return this
  }

  update(dt: number) {

    if (this.rigidBody == null) return

    if (!this.node.up.equals(Vec3.UNIT_Y, 0.02)) {
      let forward = this.node.forward.negative()
      this.v3_dir.set(forward.x, 0, forward.z)
      Quat.fromViewUp(this._rotation, this.v3_dir.normalize())
      this.node.rotation = this._rotation
    }

    this.rigidBody.getLinearVelocity(this.v3_speed)
    this._canSync = this.v3_speed.y >= 0

    if (this._state == Game.CharacterState.JumpUp && !this.animState()) {
      this.state = Game.CharacterState.JumpLand
    }

    if (!this.animState()) {
      this.state = Game.CharacterState.Idle
    }

    this.runTo(dt)
  }

  onAction(msg: Game.PlayerMsg) {
    this._postState = Game.CharacterState.None
    switch (msg.state) {
      case Game.CharacterState.Run:
      case Game.CharacterState.BoxWalk:
      case Game.CharacterState.Push:
        this.dstPos.set(msg.pos.x, msg.pos.y, msg.pos.z)
        this.state = msg.state
        this._postState = msg.state
        break
      case Game.CharacterState.Idle:
      case Game.CharacterState.BoxIdle:
        this.dstPos.set(msg.pos.x, msg.pos.y, msg.pos.z)
        this.dstForward.set(msg.dir.x, msg.dir.y, msg.dir.z)
        this.state = Game.CharacterState.Run
        this._postState = msg.state
        break
      case Game.CharacterState.Climb:
        this.climb()
        break
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
      case Game.CharacterState.Grab:
        this.grab()
        break
      case Game.CharacterState.Attack:
        this.state = Game.CharacterState.Attack
        break
      case Game.CharacterState.BwolingThrow:
        this.state = Game.CharacterState.BwolingThrow
        break
      case Game.CharacterState.GunFire:
        this.shot()
        break
    }
  }

  onEditModel(edit: boolean, x: number, y: number, z: number) {
    this._isEdit = edit
    this.rigidBody.useGravity = !edit
    if (!edit) this.resume()
    this.v3_pos.set(x, y, z)
    this.node.position = this.v3_pos
    this.rigidBody.type = edit ? RigidBody.Type.STATIC : RigidBody.Type.DYNAMIC
  }

  private onCollisionEnter(event: ICollisionEvent) {
    // switch (this._state) {
    // case Game.CharacterState.Run:
    // if (event.otherCollider.node.name == DiceMgr.ItemName && !this._curDir.equals(Vec2.ZERO))
    // this.state = Game.CharacterState.Push
    // break
    // }
    this.rigidBody.clearState()
  }

  private onCollisionExit(event: ICollisionEvent) {
    // switch (this._state) {
    //   case Game.CharacterState.Push:
    //     this.state = Game.CharacterState.Run
    //     break
    // }
  }

  private onCollisionStay(event: ICollisionEvent) {

    if (event.otherCollider.node.name == DiceMgr.ItemName && !this._curDir.equals(Vec2.ZERO)) {
      // this.state = Game.CharacterState.Push
    }

    switch (this._state) {
      case Game.CharacterState.JumpUp:
      case Game.CharacterState.Climb:
      case Game.CharacterState.JumpLand:
        break
      case Game.CharacterState.Idle:
        if (event.otherCollider.node.name == 'airWall') break
      case Game.CharacterState.Run:
        if (event.otherCollider.node.name == DiceMgr.ItemName) {
          // this.state = Game.CharacterState.Push
        }
      default:
        // this.rigidBody.clearState()
        this.rigidBody.clearVelocity()
        break
    }
  }

  private onTriggerEnter(event: ITriggerEvent) {
    // console.log(PhysicsSystem.instance.physicsWorld)
    // console.log(event.otherCollider.shape['sharedBody'])
    this._tmpTriggers.push(event.otherCollider.shape['sharedBody'].id)
    // console.log(this._tmpTriggers)
    this.curInteractProp = event.otherCollider.node
    if (this.curInteractProp.name == LadderMgr.ItemName) { this._canClimb = true }

  }

  private onTriggerStay(event: ITriggerEvent) {
    // this._canClimb = event.otherCollider.node.name == LadderMgr.ItemName
    // // if (event.otherCollider.node.name == LadderMgr.ItemName) { this._canClimb = true }
  }

  private onTriggerExit(event: ITriggerEvent) {
    let idx = this._tmpTriggers.indexOf(event.otherCollider.shape['sharedBody'].id)
    this._tmpTriggers.splice(idx, 1)

    if (this.curInteractProp == null) {
      this._canClimb = false
    } else if (this.curInteractProp == event.otherCollider.node) {
      this.curInteractProp = null
      this._canClimb = false
    } else if (this.curInteractProp.name == LadderMgr.ItemName) {
      this._canClimb = true
    }

    this._canClimb = this.curInteractProp?.name == LadderMgr.ItemName
  }

  protected runTo(dt: number) {
    if (this.dstPos.equals(Vec3.NEG_ONE)) {
      this._canSync = true
      return
    }

    this._canSync = false

    if (this.dstPos.equals(this.node.position, dt * 1)) {
      this.dstPos.set(Vec3.NEG_ONE)
      if (this._postState != Game.CharacterState.None) {
        this.state = this._postState
        this._postState = Game.CharacterState.None
      }
      return
    }

    this.v3_pos.set(this.node.position)
    this.v3_pos.y = this.dstPos.y

    // 当前位置与目标帧出现较大误差，直接跳帧
    if (Math.abs(this.node.position.y - this.dstPos.y) > 0.1) {
      this.node.position = this.dstPos
      this.dstPos.set(Vec3.NEG_ONE)
      this.state = this._postState
    } else {
      this.state = Game.CharacterState.Run
      Vec3.subtract(this.v3_dir, this.dstPos, this.v3_pos)
      this._rotationSpeedTo = 0 //Roate_Speed
      this._rotateSpeed = 0
      Quat.fromViewUp(this._rotation, this.v3_dir)
      this.node.rotation = this._rotation
    }
  }

  protected jump() {
    if (this.state == Game.CharacterState.JumpUp) return
    this.state = Game.CharacterState.JumpUp
    if (this._state != Game.CharacterState.JumpUp) return
    setTimeout(() => {
      this.rigidBody.useGravity = true
      this.rigidBody.applyImpulse(v3(this._curDir.negative().x * 1, 6, this._curDir.negative().y * 1), v3(0, 0, 0))
    }, 500)
  }

  protected lift() {
    if (this.curInteractProp == null) return
    this.state = Game.CharacterState.Lift

    // this.curInteractProp.getComponent(TerrainItemMgr).beenCollected()
    // this.propNode.removeAllChildren()
    // this.propNode.addChild(this.curInteractProp)
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
    Vec3.subtract(this.v3_dir, this.node.position, this.curInteractProp.position)
    this._rotationSpeedTo = 0
    this._rotateSpeed = 0
    let rotation = quat()
    Quat.rotateY(rotation, rotation, (ladderMgr.info.angle - 180) * Math.PI / 180)
    this.node.rotation = rotation

    this.node.position = ladderMgr.ladderPos
    this.state = Game.CharacterState.Climb
  }

  protected grab() {
    this.state = Game.CharacterState.Grab
    if (this.curInteractProp) {
      this.headProp.removeAllChildren()
      let prop = instantiate(this.curInteractProp)
      prop.getComponent(RigidBody).enabled = false
      prop.getComponent(BoxCollider).enabled = false
      prop.position = v3()
      this.headProp.addChild(prop)
    }
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

  protected shot() {

  }

  protected set state(state: Game.CharacterState) {
    // same state, not work
    if (this._state == state) return

    // on action ongoing, can not break except idle or run
    if (this._state != Game.CharacterState.Idle &&
      this._state != Game.CharacterState.Run &&
      this._state != Game.CharacterState.Push &&
      this._state != Game.CharacterState.BoxWalk &&
      this._state != Game.CharacterState.BoxIdle &&
      this._state != Game.CharacterState.Climb &&
      this.animState())
      return

    this.animation?.crossFade(StateAnim.get(state), 0)
    this._state = state
    this.rigidBody.useGravity = true

    switch (this._state) {
      case Game.CharacterState.Idle:
        this.rigidBody.getLinearVelocity(this.v3_speed)
        this.v3_speed.set(0, this.v3_speed.y, 0)
        this.rigidBody.setLinearVelocity(this.v3_speed)
        this.dstPos.set(Vec3.NEG_ONE)
        break
      case Game.CharacterState.Lift:
      case Game.CharacterState.Throw:
      case Game.CharacterState.Kick:
      case Game.CharacterState.Climb:
      case Game.CharacterState.Attack:
        this.rigidBody.clearState()
        break
      default:
        // current do nothing
        break
    }
  }

  protected animState() {
    try {
      return this.animation?.getState(StateAnim.get(this._state)).isPlaying
    } catch (err) {
      console.error(this._state)
      throw err
    }

  }
}

