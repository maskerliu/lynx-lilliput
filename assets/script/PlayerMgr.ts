import {
  clamp, Component, CylinderCollider, DirectionalLight, Event, geometry,
  ICollisionEvent, instantiate, lerp, Node, PhysicsSystem, Prefab, quat, Quat,
  RigidBody, SkeletalAnimation, SkinnedMeshRenderer, Texture2D,
  tween, UITransform, v2, v3, Vec2, Vec3, _decorator
} from 'cc'
import BattleService from './BattleService'
import { Game, User } from './model'
import TerrainAssetMgr from './TerrainAssetMgr'
import TerrainItemMgr from './TerrainItemMgr'
import { RockerTarget } from './ui/RockerMgr'
const { ccclass, property } = _decorator


export class PlayerActionEvent extends Event {

  action: Game.CharacterState

  constructor(name: string, action: Game.CharacterState, bubbles?: boolean) {
    super(name, bubbles)
    this.action = action
  }
}



const Move_Speed = 3
const Roate_Speed = 10

const StateAnim: Map<Game.CharacterState, string> = new Map()

StateAnim.set(Game.CharacterState.Idle, 'Idle')
StateAnim.set(Game.CharacterState.Running, 'Running')
StateAnim.set(Game.CharacterState.Jump, 'Jumping')
StateAnim.set(Game.CharacterState.JumpUp, 'JumpUp')
StateAnim.set(Game.CharacterState.JumpLanding, 'JumpLanding')
StateAnim.set(Game.CharacterState.Sitting, 'Sitting')
StateAnim.set(Game.CharacterState.Dancing, 'Dancing')
StateAnim.set(Game.CharacterState.Lifting, 'Lifting')
StateAnim.set(Game.CharacterState.Throwing, 'Throw')
StateAnim.set(Game.CharacterState.Kicking, 'Kicking')
StateAnim.set(Game.CharacterState.BoxIdle, 'BoxIdle')
StateAnim.set(Game.CharacterState.BoxWalk, 'BoxWalk')
StateAnim.set(Game.CharacterState.Climbing, 'Climbing')
StateAnim.set(Game.CharacterState.Push, 'Push')

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

  private _rotation: Quat = new Quat()
  private _rotateSpeed: number = 0
  private _rotationSpeedTo: number = 0

  private _ray: geometry.Ray = new geometry.Ray()
  private occlusionPos = v3()
  private worldPos = v3()
  private dstPos = v3(Vec3.NEG_ONE)

  private v3_dir = v3()
  private v3_speed = v3()
  private v3_correct = v3()

  private rigidBody: RigidBody
  private animation: SkeletalAnimation
  private meshRenderer: SkinnedMeshRenderer

  private curColliderProp: Node
  private cannClimb: boolean = false

  async onLoad() {
    this.rigidBody = this.getComponent(RigidBody)
    this.node.getChildByName('Character').scale = v3(.25, .25, .25)
    this.animation = this.getComponentInChildren(SkeletalAnimation)
    this.meshRenderer = this.getComponentInChildren(SkinnedMeshRenderer)
  }

  start() {
    this.getComponent(CylinderCollider).on('onCollisionEnter', this.onCollision, this)
    this.getComponent(CylinderCollider).on('onCollisionStay', this.onCollision, this)

    let prop = instantiate(this.propPrefab)
    prop.scale.set(0.05, 0.05, 0.05)
    this.animation.sockets[0].target.addChild(prop)
  }

  init(profile: User.Profile) {
    this.userProfile = profile
    let skin = 'f947ed55-7e34-4a82-a9db-8a9cf6f2e608' == profile.uid ? 'cyborgFemaleA' : 'criminalMaleA'
    this.meshRenderer.material.setProperty('mainTexture', TerrainAssetMgr.getTexture(skin) as Texture2D)

    this.myself = BattleService.isMyself(profile.uid)

    this.rigidBody.useCCD = true
    this.rigidBody.mass = 1
    return this
  }

  private onCollision(event: ICollisionEvent) {
    this.block()

    let prefab = event.otherCollider.node.getComponent(TerrainItemMgr)?.info.prefab

    switch (prefab) {
      case 'mushrooms':
        this.curColliderProp = event.otherCollider.node
        break
      case 'labber':
        this.cannClimb = true
        break
      default:
        this.cannClimb = false
        this.curColliderProp = null
    }
  }

  update(dt: number) {
    // if (Vec3.distance(this.occlusionPos, this.node.position) > 1) {
    //   this.occlusionPos.set(this.node.position)
    //   this.occlusionPos.y += 0.2
    //   this.occlusion()
    // }
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
      this.state = Game.CharacterState.JumpLanding
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

    if (this._state == Game.CharacterState.Running) {
      let dir = this.node.forward.negative()
      Vec3.multiplyScalar(this.v3_speed, dir, Move_Speed)
      this.v3_speed.y = 0
      this.rigidBody.setLinearVelocity(this.v3_speed)
    }
  }

  onAction(msg: Game.Msg) {
    if (this.myself) this.dstPos.set(Vec3.NEG_ONE)
    switch (msg.state) {
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
      case Game.CharacterState.Running:
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
      case Game.CharacterState.Climbing:
        this.climb()
        break
    }
  }

  onDirectionChanged(dir: Vec2) {
    if (this._state != Game.CharacterState.Idle &&
      this._state != Game.CharacterState.Running &&
      this._state != Game.CharacterState.JumpUp) {
      return
    }

    this._curDir.set(dir)
    if (this._state == Game.CharacterState.Running && dir.equals(Vec2.ZERO)) {
      this.state = Game.CharacterState.Idle
      return
    }

    this._rotationSpeedTo = Roate_Speed
    this._rotateSpeed = 0
    this.state = Game.CharacterState.Running
    this.dstPos.set(Vec3.NEG_ONE)

    let forward = this.followCamera.forward
    this.v3_dir.set(forward.x, 0, forward.z)
    if (!Vec2.ZERO.equals(this._curDir)) {
      Vec3.rotateY(this.v3_dir, this.v3_dir, Vec3.ZERO, this._curDir.signAngle(Vec2.UNIT_Y))
    }
    Quat.fromViewUp(this._rotation, this.v3_dir.normalize())
  }

  onEditModel(edit: boolean) {
    this.rigidBody.useGravity = !edit
    this.rigidBody.type = edit ? RigidBody.Type.STATIC : RigidBody.Type.DYNAMIC
  }

  private block() {
    if (this._state != Game.CharacterState.Running && this._state != Game.CharacterState.Idle) return

    this.rigidBody.clearState()
    this.rigidBody.sleep()
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
    this.rigidBody.sleep()
    this.state = Game.CharacterState.Lifting

    if (this.curColliderProp) {
      this.curColliderProp.getComponent(TerrainItemMgr).beenCollected()
      this.animation.sockets[0].target.addChild(this.curColliderProp)
    }
  }

  private throw() {
    this.rigidBody.sleep()
    this._rotateSpeed = 0
    this.state = Game.CharacterState.Throwing
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
    this.rigidBody.sleep()
    this.state = Game.CharacterState.Kicking
  }

  private climb() {
    if (!this.cannClimb) return
    this.state = Game.CharacterState.Climbing
    this.rigidBody.setLinearVelocity(v3(0, Move_Speed, 0))
  }

  private runTo() {
    this.state = Game.CharacterState.Running
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
    this.state = Game.CharacterState.Sitting
  }

  private set state(state: Game.CharacterState) {
    // same state, not work
    if (this._state == state) return

    // on action ongoing, can not break except idle or run
    if (this._state != Game.CharacterState.Idle &&
      this._state != Game.CharacterState.Running &&
      this.animState())
      return

    this.animation?.crossFade(StateAnim.get(state), 0)
    this._state = state
    this.rigidBody.clearState()

    switch (this._state) {
      case Game.CharacterState.Idle:
        this.rigidBody.clearState()
        this.rigidBody.sleep()
        this.rigidBody.setLinearVelocity(Vec3.ZERO)
        this.rigidBody.useGravity = true
        this.dstPos.set(Vec3.NEG_ONE)
        break
      case Game.CharacterState.JumpLanding:
        this.rigidBody.useGravity = true
        break
      case Game.CharacterState.Running:
        this.rigidBody.clearForces()
        this.rigidBody.useGravity = true
        break
      case Game.CharacterState.Lifting:
      case Game.CharacterState.Throwing:
      case Game.CharacterState.Kicking:
        this.rigidBody.useGravity = false
        break
    }
  }

  private animState() {
    return this.animation.getState(StateAnim.get(this._state)).isPlaying
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

