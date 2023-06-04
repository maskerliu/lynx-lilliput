import {
  Component, CylinderCollider, ICollisionEvent, ITriggerEvent, Node,
  Prefab, Quat,
  RigidBody, SkeletalAnimation, SkinnedMeshRenderer, Texture2D,
  Vec2, Vec3, _decorator,
  instantiate, quat, resources, tween, v2, v3
} from 'cc'
import IslandMgr from '../lilliput/IslandMgr'
import LilliputAssetMgr from '../lilliput/LilliputAssetMgr'
import TerrainItemMgr from '../lilliput/TerrainItemMgr'
import LadderMgr from '../lilliput/prop/LadderMgr'
import { PropMgrs } from '../lilliput/prop/Props'
import { Game, PlayerState, User } from '../model'
import { Terrain } from './Terrain'

const { ccclass, property } = _decorator


// export const Move_Speed = 1.5
export const Walk_Speed = 1
export const Push_Speed = 0.8
export const Climb_Speed = 0.4
export const Swim_Speed = 1.5
export const Roate_Speed = 8
export const QuatNeg = new Quat(0, -2, 0, 1)

export const SyncableStates = [
  Game.CharacterState.Idle,
  Game.CharacterState.Run,
  Game.CharacterState.TreadWater,
  Game.CharacterState.Swim
]

export const InteractStates = [
  Game.CharacterState.Attack,
  Game.CharacterState.Climb,
  Game.CharacterState.Grab,
  Game.CharacterState.Kick,
  Game.CharacterState.Lift,
  Game.CharacterState.PickUp,
  Game.CharacterState.Sit,
]

const BreakableStates = [
  Game.CharacterState.None,
  Game.CharacterState.Idle,
  Game.CharacterState.Run,
  Game.CharacterState.TreadWater,
  Game.CharacterState.Swim,
  Game.CharacterState.Climb,
  Game.CharacterState.Sit,
  Game.CharacterState.JumpLand,
]

const MAX_RAIDUS = Math.PI / 180 * 5

const StateAnim: Map<Game.CharacterState, string> = new Map()

StateAnim.set(Game.CharacterState.Idle, 'Idle')
StateAnim.set(Game.CharacterState.Run, 'Run')
StateAnim.set(Game.CharacterState.Sit, 'Sit')
StateAnim.set(Game.CharacterState.Climb, 'Climb')
StateAnim.set(Game.CharacterState.JumpUp, 'JumpUp')
StateAnim.set(Game.CharacterState.JumpLand, 'JumpLand')
StateAnim.set(Game.CharacterState.Lift, 'Lift')
StateAnim.set(Game.CharacterState.Throw, 'Throw')
StateAnim.set(Game.CharacterState.Kick, 'Kick')
StateAnim.set(Game.CharacterState.Grab, 'Grab')
StateAnim.set(Game.CharacterState.PickUp, 'PickUp')
StateAnim.set(Game.CharacterState.Attack, 'AttackDownward')
StateAnim.set(Game.CharacterState.BwolingThrow, 'BwolingThrow')
StateAnim.set(Game.CharacterState.FrisbeeThrow, 'FrisbeeThrow')
StateAnim.set(Game.CharacterState.GunFire, 'GunFire')
StateAnim.set(Game.CharacterState.Swim, 'Swim')
StateAnim.set(Game.CharacterState.TreadWater, 'TreadWater')
StateAnim.set(Game.CharacterState.Kneel, 'Kneel')

export default class PlayerMgr extends Component {

  rightProp: Node
  leftProp: Node
  headProp: Node

  followCamera: Node

  protected dstPos = v3(Vec3.NEG_ONE)
  protected dstForward = v3(Vec3.NEG_ONE)
  protected dstState: Game.CharacterState = Game.CharacterState.None

  protected q_rotation: Quat = quat(QuatNeg)
  protected v3_dir = v3()
  protected v3_speed = v3()
  protected v3_pos = v3(Vec3.NEG_ONE)

  protected rigidBody: RigidBody
  protected collider: CylinderCollider
  protected animation: SkeletalAnimation
  protected meshRenderer: SkinnedMeshRenderer
  protected character: Node

  protected _profile: User.Profile
  get profile() { return this._profile }

  protected _playerState: PlayerState
  protected _state: Game.CharacterState = Game.CharacterState.Idle

  protected _curDir: Vec2 = v2()
  protected _tmpTriggers: Map<number, string> = new Map()
  protected _interactObj: TerrainItemMgr
  protected _canClimb: boolean = false
  protected _inWater: boolean = false

  protected _islandMgr: IslandMgr

  start() {
    // this.node.getChildByName('Debug').active = true
  }

  update(dt: number) {

    if (this.rigidBody == null) return

    if (!this.animState()) {
      if (this._state == Game.CharacterState.JumpUp) {
        this.state = Game.CharacterState.JumpLand
      } else {
        this.state = this._inWater ? Game.CharacterState.TreadWater : Game.CharacterState.Idle
      }
    }

    this.runTo()

    if (!this.node.up.equals(Vec3.UNIT_Y, 0.02)) {
      let forward = this.node.forward.negative()
      this.v3_dir.set(forward.x, 0, forward.z)
      Quat.fromViewUp(this.q_rotation, this.v3_dir.normalize())
      this.node.rotation = this.q_rotation
      this.q_rotation.set(QuatNeg)
    }
  }

  resume() {
    this.rigidBody.clearState()
    this.rigidBody.useGravity = true

    this.state = Game.CharacterState.Idle
    this.q_rotation.set(QuatNeg)
    this.v3_dir.set(Vec3.ZERO)
    this.v3_speed.set(Vec3.ZERO)

    this.dstPos.set(Vec3.NEG_ONE)
    this.dstForward.set(Vec3.NEG_ONE)
    this.dstState = Game.CharacterState.None

    this._interactObj = null
    this._canClimb = false
  }

  enter(island: IslandMgr, state: PlayerState) {
    this._playerState = state
    this._islandMgr = island
    this.node.position = v3(state.px, state.py, state.pz)
    island.node.addChild(this.node)
    this.node.active = true
    this.resume()
  }

  leave() {
    this.node.removeFromParent()
    this.node.active = false
    this.rigidBody.sleep()
    this._playerState = null
  }

  init(profile: User.Profile) {
    this._profile = profile

    this.rigidBody = this.addComponent(RigidBody)
    this.rigidBody.type = RigidBody.Type.DYNAMIC
    this.rigidBody.group = Terrain.PhyEnvGroup.Player
    this.rigidBody.useGravity = true
    this.rigidBody.useCCD = true
    this.rigidBody.mass = 1
    this.rigidBody.setMask(Terrain.PlayerMask)

    this.collider = this.addComponent(CylinderCollider)
    this.collider.radius = 0.12
    this.collider.height = 1
    this.collider.material = LilliputAssetMgr.getPhyMtl('player')
    this.collider.direction = CylinderCollider.Axis.Y_AXIS

    this.collider.on('onCollisionEnter', this.onCollisionEnter, this)
    this.collider.on('onCollisionStay', this.onCollisionStay, this)
    this.collider.on('onCollisionExit', this.onCollisionExit, this)

    this.collider.on('onTriggerEnter', this.onTriggerEnter, this)
    this.collider.on('onTriggerStay', this.onTriggerStay, this)
    this.collider.on('onTriggerExit', this.onTriggerExit, this)


    if (profile.prefab) {
      let prefab = LilliputAssetMgr.getCharacter(profile.prefab)
      if (prefab == null) {
        resources.load(`prefab/character/${profile.prefab}`, Prefab, (err, data) => {
          LilliputAssetMgr.addCharacter(profile.prefab, data)
          this._init(data)
        })
      } else {
        this._init(prefab)
      }
    }

    return this
  }

  private _init(prefab: Prefab) {
    // this.node.getChildByName('Debug').active = false
    this.character = instantiate(prefab)
    this.character.position = v3(0, -0.5, 0)
    this.node.addChild(this.character)
    this.animation = this.getComponentInChildren(SkeletalAnimation)
    this.meshRenderer = this.getComponentInChildren(SkinnedMeshRenderer)


    this.headProp = this.animation.sockets[0].target.getChildByName('HeadProp')
    this.leftProp = this.animation.sockets[1].target.getChildByName('LeftHandProp')
    this.rightProp = this.animation.sockets[2].target.getChildByName('RightHandProp')

    if (this.profile.skin) {
      let texture = LilliputAssetMgr.getTexture(this.profile.skin)
      if (texture == null) {
        resources.load(`texture/character/${this.profile.prefab}/${this.profile.skin}/texture`, Texture2D, (err, texture) => {
          LilliputAssetMgr.addTexture(this.profile.skin, texture)
          this.meshRenderer.material.setProperty('mainTexture', texture)
        })
      } else {
        this.meshRenderer.material.setProperty('mainTexture', texture as Texture2D)
      }
    }
  }

  onAction(msg: Game.PlayerMsg) {
    this.dstPos.set(Vec3.NEG_ONE)
    this.dstForward.set(Vec3.NEG_ONE)
    this.dstState = Game.CharacterState.None
    switch (msg.state) {
      case Game.CharacterState.Run:
      case Game.CharacterState.Swim:
      case Game.CharacterState.Idle:
      case Game.CharacterState.TreadWater:
        this.dstPos.set(msg.pos.x, msg.pos.y, msg.pos.z)
        this.dstForward.set(msg.dir.x, msg.dir.y, msg.dir.z)
        this.dstState = msg.state
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

  private onCollisionEnter(event: ICollisionEvent) {
    switch (this._state) {
      case Game.CharacterState.JumpUp:
      case Game.CharacterState.Climb:
        break
      default:
        this.rigidBody.clearState()
        break
    }
  }

  private onCollisionExit(event: ICollisionEvent) { }

  private onCollisionStay(event: ICollisionEvent) {
    switch (this._state) {
      case Game.CharacterState.JumpUp:
      case Game.CharacterState.Climb:
      case Game.CharacterState.JumpLand:
        break
      default:
        this.rigidBody.clearState()
        break
    }
  }

  protected onTriggerEnter(event: ITriggerEvent) {
    let name = event.otherCollider.node.name
    if (name == 'Water') {
      this._inWater = true
      return
    }
    this.updateInteractObj(event, true)
  }

  protected onTriggerStay(event: ITriggerEvent) {
    let name = event.otherCollider.node.name
    if (name == 'Water') {
      this.v3_pos.set(this.node.position)
      this.v3_pos.y = event.otherCollider.node.position.y - 0.2
      this.node.position = this.v3_pos
      this._inWater = true
    }
  }

  protected onTriggerExit(event: ITriggerEvent) {
    if (event.otherCollider.node.name == 'Water') this._inWater = false
    this.updateInteractObj(event, false)
  }

  protected updateInteractObj(event: ITriggerEvent, enter: boolean) {
    if (this._islandMgr == null) {
      this._interactObj = null
      return
    }
    let name = event.otherCollider.node.name

    let clazz = PropMgrs.has(name) ? PropMgrs.get(name) : TerrainItemMgr
    let mgr: TerrainItemMgr = event.otherCollider.node.getComponent(clazz)

    if (mgr == null) return

    this._tmpTriggers.set(mgr.index, name)

    if (enter) {
      this._tmpTriggers.set(mgr.index, name)
    } else {
      this._tmpTriggers.delete(mgr.index)
    }

    let distance = 100, curTrriger = Number.MIN_VALUE, canClimb = false
    for (let [idx, item] of this._tmpTriggers) {
      mgr = this._islandMgr.mapInfo(idx)
      if (mgr == null) continue
      curTrriger = distance > Vec3.distance(this.node.position, mgr.node.position) ? idx : curTrriger
    }

    this._interactObj = this._islandMgr.mapInfo(curTrriger)
    if (this._interactObj == null || this._interactObj.config.interaction == null) {
      this._canClimb = false
    } else {
      this._canClimb = this._interactObj.config.interaction.findIndex((it) => it == Terrain.InteractType.Climb) != -1
    }
  }

  protected runTo() {
    if (Vec3.NEG_ONE.equals(this.dstPos)) return

    if (this.dstPos.equals(this.node.position, 0.1)) {
      this.state = this.dstState
      if (this._state == Game.CharacterState.Idle || this._state == Game.CharacterState.TreadWater) {
        this.node.forward = this.dstForward
      }

      this.dstPos.set(Vec3.NEG_ONE)
      this.dstForward.set(Vec3.NEG_ONE)
      this.dstState = Game.CharacterState.None
      return
    }

    // 当前位置与目标帧出现较大误差，直接跳帧
    if (Math.abs(this.node.position.y - this.dstPos.y) > 0.05) { // || BattleService.instance.playerFrameCount(this.profile.id) > 4) {
      this.node.position = this.dstPos
      this.state = this.dstState

      this.dstPos.set(Vec3.NEG_ONE)
      this.dstForward.set(Vec3.NEG_ONE)
      this.dstState = Game.CharacterState.None
    } else {
      this.state = this._inWater ? Game.CharacterState.Swim : Game.CharacterState.Run
      Vec3.subtract(this.v3_dir, this.dstPos, this.node.position)
      this.v3_dir.y = 0
      Quat.fromViewUp(this.q_rotation, this.v3_dir.normalize())

      if (Vec3.angle(this.node.forward.negative(), this.v3_dir) > MAX_RAIDUS) {
        this.node.rotation = this.node.rotation.slerp(this.q_rotation, 0.2)
        if (!this.node.up.equals(Vec3.UNIT_Y, 0.02)) {
          let forward = this.node.forward.negative()
          this.v3_dir.set(forward.x, 0, forward.z)
          Quat.fromViewUp(this.q_rotation, this.v3_dir.normalize())
          this.node.rotation = this.q_rotation
          this.q_rotation.set(QuatNeg)
        }
      }
    }
  }

  protected jump() {
    this.state = Game.CharacterState.JumpUp
    setTimeout(() => {
      this.rigidBody.useGravity = true
      let v3Impluse = v3(0, 6, 0)

      if (!Vec2.ZERO.equals(this._curDir)) {
        v3Impluse.x = this.node.forward.negative().x * 1
        v3Impluse.z = this.node.forward.negative().z * 1
      }

      this.rigidBody.applyImpulse(v3Impluse, Vec3.ZERO)
    }, 500)
  }

  protected lift() {
    this.state = Game.CharacterState.Lift
    // this.curInteractProp.getComponent(TerrainItemMgr).beenCollected()
    // this.propNode.removeAllChildren()
    // this.propNode.addChild(this.curInteractProp)
  }

  protected pickUp() {

  }

  protected throw() {
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
    // Vec3.subtract(this.v3_dir, this.curInteractProp.position, this.node.position)
    Quat.fromViewUp(this.node.rotation, this.v3_dir)

    this.state = Game.CharacterState.Kick
  }

  protected climb() {
    if (!this._canClimb) return
    if (this._interactObj == null) return

    // let ladderMgr = this._interactObj.getComponent(LadderMgr)
    Vec3.subtract(this.v3_dir, this.node.position, this._interactObj.node.position)
    let rotation = quat()
    Quat.rotateY(rotation, rotation, (this._interactObj.info.angle - 180) * Math.PI / 180)
    this.node.rotation = rotation

    this.v3_pos.set((this._interactObj as LadderMgr).ladderPos)
    this.v3_pos.y = this.node.position.y
    this.node.position = this.v3_pos
    this.state = Game.CharacterState.Climb
  }

  protected grab() {
    this.state = Game.CharacterState.Grab
    if (this._interactObj) {
      this.headProp.removeAllChildren()
      // let prop = instantiate(this._interactObj)
      // prop.getComponent(RigidBody).enabled = false
      // prop.getComponent(BoxCollider).enabled = false
      // prop.position = v3()
      // this.headProp.addChild(prop)
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
    this.state = Game.CharacterState.Sit
  }

  protected shot() {

  }

  protected set state(state: Game.CharacterState) {
    // same state, not work
    if (this._state == state) return
    // on action ongoing, can not break except idle or run
    if (!BreakableStates.includes(this._state) && this.animState()) return

    if (state == Game.CharacterState.None) {
      this._state = this._inWater ? Game.CharacterState.TreadWater : Game.CharacterState.Idle
    } else {
      this._state = state
    }

    this.animation?.crossFade(StateAnim.get(this._state), 0)
    this.rigidBody.useGravity = true
    this.v3_pos.set(0, -0.5, 0)
    this.character.position = this.v3_pos
    switch (this._state) {
      case Game.CharacterState.Idle:
        this.rigidBody.getLinearVelocity(this.v3_speed)
        this.v3_speed.set(0, this.v3_speed.y, 0)
        this.rigidBody.setLinearVelocity(this.v3_speed)
        this.dstPos.set(Vec3.NEG_ONE)
        break
      case Game.CharacterState.TreadWater:
        this.rigidBody.useGravity = false
        this.rigidBody.setLinearVelocity(Vec3.ZERO)
        break
      case Game.CharacterState.Swim:
        this.v3_pos.set(0, -0.5, -0.3)
        this.character.position = this.v3_pos
        this.rigidBody.useGravity = false
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

