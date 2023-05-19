import { BoxCollider, Camera, Component, CylinderCollider, EventTouch, ICollisionEvent, ITriggerEvent, MeshCollider, MeshRenderer, Node, PhysicMaterial, PhysicsSystem, Prefab, RigidBody, SphereCollider, Vec2, Vec3, _decorator, geometry, instantiate, tween, v2, v3 } from 'cc'
import { PhyEnvGroup } from '../common/Misc'
import OrbitCamera from '../common/OrbitCamera'
import ArcadePlayerMgr from './ArcadePlayerMgr'
import CourtUIMgr from './CourtUIMgr'


const { ccclass, property } = _decorator


const K_Gournd = 'ground'
const K_Net = 'basketballNet'
const K_Wall = 'wall'

const BasketballStandMtl = new PhysicMaterial()
BasketballStandMtl.setValues(0.2, 0, 0, 0.6)

const BasketballMtl = new PhysicMaterial()
BasketballMtl.setValues(0.2, 0, 0, 0.8)

const StandOffsetHorizontal = 0.8
const StandOffsetVertial = 0.3

@ccclass('CourtMgr')
export class CourtMgr extends Component {

  @property(Camera)
  camera: Camera

  @property(Prefab)
  private playerPrefab: Prefab

  private court: Node
  private stands: Node
  private ground: Node

  private idx = 0
  private standsPos = v3()
  private left = true
  private randomPos = v3()
  private basketballs: Array<Node> = []

  @property(Prefab)
  private charactersPrefab: Prefab

  private characters: Node

  private _dir = v3()
  private _picked = false
  private _pickPos = v2()

  private uiMgr: CourtUIMgr

  private orbitCamera: OrbitCamera
  private _ray: geometry.Ray = new geometry.Ray()

  protected onLoad(): void {
    PhysicsSystem.instance.gravity = v3(0, -10, 0)


    this.characters = instantiate(this.charactersPrefab)

    this.uiMgr = this.getComponentInChildren(CourtUIMgr)
    this.orbitCamera = this.camera.node.addComponent(OrbitCamera)
    this.orbitCamera.reactArea = this.uiMgr.reactArea

    this.court = this.node.getChildByName('ArcadeCourt')
    this.stands = this.court.getChildByName('stands')
    this.ground = this.court.getChildByName('ground')
    let prefab = this.court.getChildByName('basketball')
    let luckyball = this.court.getChildByName('beachball')

    for (let i = 0; i < 6; i++) {
      let ball = i == 5 ? instantiate(luckyball) : instantiate(prefab)
      this.court.addChild(ball)
      this.basketballs.push(ball)
    }
  }

  protected start(): void {
    this.registEvent()
    this.initStands()
    this.initGround()
    this.initPlayer()

    this.basketballs.forEach(it => {
      let rigidBody = it.addComponent(RigidBody)
      rigidBody.type = RigidBody.Type.DYNAMIC
      rigidBody.group = PhyEnvGroup.Prop
      rigidBody.setMask(PhyEnvGroup.Terrain | PhyEnvGroup.Player)
      rigidBody.mass = 0.6
      rigidBody.useCCD = true
      rigidBody.useGravity = false
      rigidBody.sleep()
      it.active = false

      let collider = it.addComponent(SphereCollider)
      collider.radius = 0.215
      collider.material = BasketballMtl
    })

    this.randomBall()
  }

  protected update(dt: number): void {
    if (this.left) {
      if (this.standsPos.z > -StandOffsetHorizontal) {
        this.standsPos.z -= Math.random() * dt * 0.4
      } else {
        this.left = false
      }
    } else {
      if (this.standsPos.z < StandOffsetHorizontal) {
        this.standsPos.z += Math.random() * dt * 0.4
      } else {
        this.left = true
      }
    }
    this.stands.position = this.standsPos
  }

  private randomBall() {
    setTimeout(() => {
      if (this.idx == this.basketballs.length - 1) {
        this.idx = 0
      } else {
        this.idx++
      }

      this.randomPos.set(8, 1, Math.random() / 2)
      this.randomPos.z = Math.random() > 0.5 ? this.randomPos.z : - this.randomPos.z
      let rigidBody = this.basketballs[this.idx].getComponent(RigidBody)
      rigidBody.clearState()
      rigidBody.useGravity = false
      this.basketballs[this.idx].position = this.randomPos
      this.basketballs[this.idx].active = true
    }, 800)
  }


  private initPlayer() {
    let player = instantiate(this.playerPrefab)
    player.scale = v3(1.5, 1.5, 1.5)
    player.position = v3(8, 0.75, 0)
    let playerMgr = player.addComponent(ArcadePlayerMgr)
    playerMgr.init(null, this.characters.getChildByName('human'))
    this.court.addChild(player)
    playerMgr.followCamera = this.orbitCamera.node

    this.orbitCamera.target = player

    this.uiMgr.rockerTarget = playerMgr
  }

  private initStands() {
    this.standsPos.set(14, -1, 0)
    this.stands.position = this.standsPos
    let rigidBody = this.stands.addComponent(RigidBody)
    rigidBody.type = RigidBody.Type.STATIC
    rigidBody.group = PhyEnvGroup.Terrain
    rigidBody.setMask(PhyEnvGroup.Prop | PhyEnvGroup.Player)

    let collider = this.stands.addComponent(MeshCollider)
    collider.mesh = this.stands.getComponent(MeshRenderer).mesh
    collider.material = BasketballStandMtl

    let net = this.stands.getChildByName('net')
    rigidBody = net.addComponent(RigidBody)
    rigidBody.type = RigidBody.Type.STATIC
    rigidBody.group = PhyEnvGroup.Terrain
    rigidBody.setMask(PhyEnvGroup.Player | PhyEnvGroup.Prop)

    let cyCollider = net.addComponent(CylinderCollider)
    cyCollider.isTrigger = true
    cyCollider.radius = 0.2
    cyCollider.height = 0.01
    cyCollider.on('onTriggerEnter', this.onTriggerEnter, this)
  }

  private initGround() {
    let rigidBody = this.ground.addComponent(RigidBody)
    rigidBody.type = RigidBody.Type.STATIC
    rigidBody.group = PhyEnvGroup.Terrain
    rigidBody.setMask(PhyEnvGroup.Prop | PhyEnvGroup.Player)

    let model = this.ground.getComponent(MeshRenderer).model
    let minPos = v3(), maxPos = v3()
    model.modelBounds.getBoundary(minPos, maxPos)
    maxPos.subtract(minPos)
    let collider = this.ground.addComponent(BoxCollider)
    collider.size = maxPos
    collider.center = model.modelBounds.center
    collider.material = BasketballStandMtl
  }

  private registEvent() {
    this.uiMgr.reactArea.on(Node.EventType.TOUCH_START, this.onTouchStart, this)
    this.uiMgr.reactArea.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
    this.uiMgr.reactArea.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)
    this.uiMgr.reactArea.on(Node.EventType.TOUCH_END, this.onTouchEnd, this)
    this.uiMgr.reactArea.on(Node.EventType.MOUSE_MOVE, this.onTouchMove, this)
  }

  private onTriggerEnter(event: ITriggerEvent) {

    let name = event.otherCollider.node.name

    switch (name) {
      case 'BasketballTrigger':
        this.uiMgr.showEnterGameMenu()
        break
      case 'basketball':
        this.uiMgr.score = 2
        break
      case 'beachball':
        this.uiMgr.score = Math.floor(1 + Math.random() * 4)
        break
    }

    // let offset = 0
    // this.uiMgr.score = name == 'beachball' ? Math.floor(1 + Math.random() * 4) : 2
    // let x = this.camera.node.position.x
    // let y = this.camera.node.position.y
    // let z = this.camera.node.position.z
    // tween(this.camera.node).sequence(
    //   tween(this.camera.node).to(0.018, { position: v3(x + (0.5 + offset), y, + (offset + .7)) }),
    //   tween(this.camera.node).to(0.018, { position: v3(x + (0.6 + offset), y, + (offset + .7)) }),
    //   tween(this.camera.node).to(0.018, { position: v3(x + (1.3 + offset), y, z + (offset + .3)) }),
    //   tween(this.camera.node).to(0.018, { position: v3(x + (0.3 + offset), y, z - (offset + .6)) }),
    //   tween(this.camera.node).to(0.018, { position: v3(x + (0.5 + offset), y, z + (offset + .5)) }),
    //   tween(this.camera.node).to(0.018, { position: v3(x + (0.2 + offset), y, z - (offset + .8)) }),
    //   tween(this.camera.node).to(0.018, { position: v3(x + (0.8 + offset), y, z - (offset + 1)) }),
    //   tween(this.camera.node).to(0.018, { position: v3(x + (0.3 + offset), y, z + (offset + 1)) }),
    //   tween(this.camera.node).to(0.018, { position: v3(x + (0 + offset), y, z + (offset + 0)) }),
    // ).start()

  }

  private onCollisionEnter(event: ICollisionEvent) {
    let name = event.otherCollider.node.name
    switch (name) {
      case K_Gournd:

        break
    }
  }

  private onTouchStart(touch: EventTouch) {
    this.camera.screenPointToRay(touch.getLocationX(), touch.getLocationY(), this._ray)

    if (!PhysicsSystem.instance.raycast(this._ray, 0xffffffff, 20)) {
      this._picked = false
      return
    }
    for (let i = 0; i < PhysicsSystem.instance.raycastResults.length; i++) {
      let node = PhysicsSystem.instance.raycastResults[i].collider.node
      if (node.name == 'basketball' || node.name == 'beachball') {
        this._picked = true
        let rigidBody = node.getComponent(RigidBody)
        rigidBody.useGravity = false

        this._pickPos.set(touch.getLocation())
      }
    }
  }

  private onTouchMove(touch: EventTouch) {

    let delta = touch.getDelta()
  }

  private onTouchEnd(touch: EventTouch) {

    if (this._picked) {
      let distance = Vec2.distance(this._pickPos, touch.getLocation()) / 200

      console.log(distance)
      // if (distance < 1) {
      //   console.log('大点力')
      //   return
      // }

      this._pickPos.subtract(touch.getLocation())
      this._dir.set(this.camera.node.forward.negative())
      Vec3.rotateY(this._dir, this._dir, Vec3.ZERO, -this._pickPos.signAngle(Vec2.UNIT_Y))
      this._dir.set(this._dir.normalize().multiplyScalar(distance))

      this._dir.y = 4.5 + Math.random()

      let rigidBody = this.basketballs[this.idx].getComponent(RigidBody)
      rigidBody.useGravity = true
      rigidBody.applyImpulse(this._dir)
      rigidBody.applyLocalTorque(v3(3, 2, 1))
      this._picked = false
      this.randomBall()
    }
  }
}