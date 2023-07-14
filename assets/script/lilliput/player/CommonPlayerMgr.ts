import {
  CylinderCollider, ICollisionEvent, ITriggerEvent, Node, PhysicsSystem, Prefab, Quat,
  RigidBody, SkeletalAnimation, SkinnedMeshRenderer, SphereCollider, Texture2D,
  Vec2, Vec3, geometry, instantiate, math, quat, resources, tween, v2, v3
} from 'cc'
import { BigWorld } from '../../common/BigWorld'
import { QuatNeg } from '../../misc/Utils'
import { Game, PlayerState, User } from '../../model'
import LilliputAssetMgr from '../LilliputAssetMgr'

export const Climb_Speed = 0.4
export const Roate_Speed = 8

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

const MAX_RAIDUS = math.toRadian(5)

export default abstract class CommonPlayerMgr extends BigWorld.PlayerMgr {

  rightProp: Node
  leftProp: Node
  headProp: Node

  protected _followCamera: Node
  set followCamera(node: Node) { this._followCamera = node }

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
  protected _triggers: Array<number> = []
  protected _curInteractObj: number = Number.MAX_VALUE
  protected _canClimb: boolean = false
  protected _inWater: boolean = false
  protected _islandMgr: BigWorld.IslandMgr
  protected _bombPrefab: Prefab
  private _ray: geometry.Ray = new geometry.Ray()
  private _frameCount = 0

  private debug: Node

  update(dt: number) {
    if (!this.animState) {
      if (this._state == Game.CharacterState.JumpUp) {
        this.state = Game.CharacterState.JumpLand
      } else {
        this.state = this._inWater ? Game.CharacterState.TreadWater : Game.CharacterState.Idle
      }
    }

    this.inWater()

    this.runTo()
    let radius = Vec3.angle(this.node.up, Vec3.UNIT_Y)

    if (Math.abs(radius) > 0.02) {
      let forward = this.node.forward.negative()
      this.v3_dir.set(forward.x, 0, forward.z)
      this.v3_dir.normalize()
      // console.log(this.node.rotation)
      // this.node.rotation = this.node.rotation.slerp(this.q_rotation, Roate_Speed * dt)
      this.node.rotation = Quat.fromViewUp(this.node.rotation, this.v3_dir)
    }
  }

  init(profile: User.Profile) {
    this._profile = profile

    this.rigidBody = this.addComponent(RigidBody)
    this.rigidBody.type = RigidBody.Type.DYNAMIC
    this.rigidBody.group = BigWorld.PhyEnvGroup.Player
    this.rigidBody.useGravity = true
    this.rigidBody.useCCD = true
    this.rigidBody.mass = 1
    this.rigidBody.setMask(BigWorld.PlayerMask)

    this.collider = this.addComponent(CylinderCollider)
    this.collider.radius = 0.12
    this.collider.height = 1
    this.collider.material = LilliputAssetMgr.instance.getPhyMtl('player')
    this.collider.direction = CylinderCollider.Axis.Y_AXIS

    this.collider.on('onCollisionEnter', this.onCollisionEnter, this)
    this.collider.on('onCollisionStay', this.onCollisionStay, this)
    this.collider.on('onCollisionExit', this.onCollisionExit, this)

    this.collider.on('onTriggerEnter', this.onTriggerEnter, this)
    this.collider.on('onTriggerStay', this.onTriggerStay, this)
    this.collider.on('onTriggerExit', this.onTriggerExit, this)


    if (profile.prefab) {
      let prefab = LilliputAssetMgr.instance.getCharacter(profile.prefab)
      if (prefab == null) {
        resources.load(`prefab/character/${profile.prefab}`, Prefab, (err, data) => {
          LilliputAssetMgr.instance.addCharacter(profile.prefab, data)
          this._init(data)
        })
      } else {
        this._init(prefab)
      }
    }
  }

  resume() {
    this.rigidBody.clearState()
    this.rigidBody.useGravity = true

    this.state = this._inWater ? Game.CharacterState.TreadWater : Game.CharacterState.Idle
    this.q_rotation.set(QuatNeg)
    this.v3_dir.set(Vec3.ZERO)
    this.v3_speed.set(Vec3.ZERO)

    this.dstPos.set(Vec3.NEG_ONE)
    this.dstForward.set(Vec3.NEG_ONE)
    this.dstState = Game.CharacterState.None

    this._curInteractObj = Number.MAX_VALUE
    this._canClimb = false
  }

  private _init(prefab: Prefab) {
    this.character = instantiate(prefab)

    this.debug = this.character.getChildByName('Debug')
    this.debug.removeFromParent()
    this.debug.position = Vec3.ZERO
    this.node.addChild(this.debug)

    this.v3_pos.set(0, -0.5, 0)
    this.character.position = this.v3_pos
    this.node.addChild(this.character)
    this.animation = this.getComponentInChildren(SkeletalAnimation)
    this.meshRenderer = this.getComponentInChildren(SkinnedMeshRenderer)

    this.headProp = this.animation.sockets[0].target.getChildByName('HeadProp')
    this.leftProp = this.animation.sockets[1].target.getChildByName('LeftHandProp')
    this.rightProp = this.animation.sockets[2].target.getChildByName('RightHandProp')

    if (this.profile.skin) {
      let texture = LilliputAssetMgr.instance.getTexture(this.profile.skin)
      if (texture == null) {
        resources.load(`texture/character/${this.profile.prefab}/${this.profile.skin}/texture`, Texture2D, (err, texture) => {
          LilliputAssetMgr.instance.addTexture(this.profile.skin, texture)
          this.meshRenderer.material.setProperty('mainTexture', texture)
        })
      } else {
        this.meshRenderer.material.setProperty('mainTexture', texture as Texture2D)
      }
    }

    this._bombPrefab = LilliputAssetMgr.instance.getTerrainPrefab('bomb')

    if (this._bombPrefab == null) {
      resources.load('prefab/terrain/env/bomb', Prefab, (err, data) => {
        LilliputAssetMgr.instance.addTerrainPrefab('bomb', data)
        this._bombPrefab = data
      })
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
        if (msg.pos) {
          console.log(this.node.name, msg.state)
          this.node.position = this.v3_pos.set(msg.pos.x, msg.pos.y, msg.pos.z)
          this.state = this._inWater ? Game.CharacterState.TreadWater : Game.CharacterState.Idle
        }
        if (msg.dir) {
          this.node.forward = this.v3_dir.set(msg.dir.x, msg.dir.y, msg.dir.z)
        }
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

  protected onTriggerEnter(event: ITriggerEvent) { this.updateInteractObj(event, true) }

  protected onTriggerStay(event: ITriggerEvent) { }

  protected onTriggerExit(event: ITriggerEvent) { this.updateInteractObj(event, false) }

  protected updateInteractObj(event: ITriggerEvent, enter: boolean) {
    if (this._islandMgr == null) {
      this._curInteractObj = Number.MAX_VALUE
      return
    }

    let mgr: BigWorld.MapItemMgr = event.otherCollider.node.getComponent(BigWorld.getPropMgr(event.otherCollider.node.name))
    if (mgr == null) return

    if (enter) {
      if (!this._triggers.includes(mgr.index)) this._triggers.push(mgr.index)
    } else {
      let idx = this._triggers.findIndex(it => it == mgr.index)
      if (idx != -1) this._triggers.splice(idx, 1)
    }

    let distance = 100, tmpDst = 0
    this._curInteractObj = Number.MAX_VALUE
    this._triggers.forEach(it => {
      mgr = this._islandMgr.mapInfo(it)
      if (mgr == null) return
      tmpDst = Vec3.distance(this.node.position, mgr.node.position)
      if (tmpDst < distance) {
        this._curInteractObj = it
        distance = tmpDst
      }
    })

    if (this._curInteractObj == Number.MAX_VALUE) { this._canClimb = false }
    else { this._canClimb = this._islandMgr.mapInfo(this._curInteractObj).canInteract(BigWorld.InteractType.Climb) }
  }

  protected inWater() {

    if (this._frameCount < 3) {
      this._frameCount++
      return
    }

    this._frameCount = 0

    if (this.node.position.y >= 0.5) {
      this._inWater = false
      return
    }

    if (this._state != Game.CharacterState.Idle &&
      this._state != Game.CharacterState.Run &&
      this._state != Game.CharacterState.TreadWater &&
      this._state != Game.CharacterState.Swim) {
      this._inWater = false
      return
    }

    geometry.Ray.set(this._ray, this.node.worldPosition.x, this.node.worldPosition.y - 0.4, this.node.worldPosition.z,
      this.node.worldPosition.x, this.node.worldPosition.y - 50.5, this.node.worldPosition.z)
    if (!PhysicsSystem.instance.raycastClosest(this._ray, BigWorld.PhyEnvGroup.Terrain)) {
      this._inWater = false
      return
    }
    let name = PhysicsSystem.instance.raycastClosestResult.collider.node.name
    if (name == 'Seabed') {
      this._inWater = true
      if (this._state != Game.CharacterState.TreadWater && this._state != Game.CharacterState.Swim) {
        this.state = Vec2.ZERO.equals(this._curDir) ? Game.CharacterState.TreadWater : Game.CharacterState.Swim
      }

      this.v3_pos.set(this.node.position)
      this.v3_pos.y = 0.34
      this.node.position = this.v3_pos
    } else {
      // console.log(PhysicsSystem.instance.raycastClosestResult.collider.node.name)
      this._inWater = false
      if (this.node.position.y < PhysicsSystem.instance.raycastClosestResult.hitPoint.y + 0.5) {
        this.v3_pos.set(this.node.position)
        this.v3_pos.y = PhysicsSystem.instance.raycastClosestResult.hitPoint.y + 0.5
        this.node.position = this.v3_pos
      }
      // this.state = Vec2.ZERO.equals(this._curDir) ? Game.CharacterState.Idle : Game.CharacterState.Run
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
        this.node.rotation = this.node.rotation.slerp(this.q_rotation, 0.16)
      }
    }
  }

  protected jump() {
    this.state = Game.CharacterState.JumpUp
    setTimeout(() => {
      this._state = Game.CharacterState.JumpUp
      this.rigidBody.useGravity = true
      let v3Impluse = v3(0, 6, 0)

      if (!Vec2.ZERO.equals(this._curDir)) {
        v3Impluse.x = this.node.forward.negative().x * 1
        v3Impluse.z = this.node.forward.negative().z * 1
      }

      this.rigidBody.applyImpulse(v3Impluse)
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

    let bomb = instantiate(this._bombPrefab)

    let rigidBody = bomb.addComponent(RigidBody)
    rigidBody.type = RigidBody.Type.DYNAMIC
    rigidBody.group = BigWorld.PhyEnvGroup.Prop
    rigidBody.setMask(BigWorld.PropMask)

    let collider = bomb.addComponent(SphereCollider)

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
    let interactObj = this._islandMgr.mapInfo(this._curInteractObj)
    console.log(this.node.name, interactObj)
    if (interactObj == null || !interactObj.canInteract(BigWorld.InteractType.Climb)) return
    console.log(this.node.name, 'can climb')
    this.q_rotation.set(0, 0, 0, 1)
    this.node.rotation = Quat.rotateY(this.q_rotation, this.q_rotation, math.toRadian((interactObj.info[4] - 180)))
    this.v3_pos.set(interactObj.modelPos)
    this.v3_pos.y = this.node.position.y
    this.node.position = this.v3_pos
    this.state = Game.CharacterState.Climb
  }

  protected grab() {
    this.state = Game.CharacterState.Grab
    if (this._curInteractObj == Number.MAX_VALUE) return
    let interactObj = this._islandMgr.mapInfo(this._curInteractObj)
    if (interactObj) {
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

  get state() { return this._state }
  protected set state(state: Game.CharacterState) {
    // same state, not work
    if (this._state == state) return
    // on action ongoing, can not break except idle or run
    if (!BreakableStates.includes(this._state) && this.animState) return

    if (state == Game.CharacterState.None) {
      state = this._inWater ? Game.CharacterState.TreadWater : Game.CharacterState.Idle
      this._state = state
    } else if (state == Game.CharacterState.JumpUp) {

    } else {
      this._state = state
    }

    this.animation?.crossFade(this.anim(state), 0)
    this.rigidBody.useGravity = true
    this.collider.direction = CylinderCollider.Axis.Y_AXIS
    this.v3_pos.set(0, -0.5, 0)
    this.q_rotation.set(0, 0, 0, 1)
    switch (this._state) {
      case Game.CharacterState.Idle:
        this.rigidBody.getLinearVelocity(this.v3_speed)
        this.v3_speed.set(0, this.v3_speed.y, 0)
        this.rigidBody.setLinearVelocity(Vec3.ZERO)
        this.dstPos.set(Vec3.NEG_ONE)
        break
      case Game.CharacterState.TreadWater:
        this.v3_pos.z = -0.1
        this.rigidBody.useGravity = false
        this.rigidBody.setLinearVelocity(Vec3.ZERO)
        break
      case Game.CharacterState.Swim:
        Quat.rotateX(this.q_rotation, this.q_rotation, Math.PI / 2)
        this.v3_pos.y = -0.3
        this.v3_pos.z = -0.1
        this.rigidBody.useGravity = false
        this.collider.direction = CylinderCollider.Axis.Z_AXIS
        break
      case Game.CharacterState.Lift:
      case Game.CharacterState.Throw:
      case Game.CharacterState.Kick:
      case Game.CharacterState.Climb:
      case Game.CharacterState.Attack:
        this.rigidBody.clearState()
        break

    }
    this.debug.rotation = this.q_rotation
    if (this.character) this.character.position = this.v3_pos
  }
}