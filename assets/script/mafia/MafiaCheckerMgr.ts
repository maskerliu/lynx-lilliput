import { Component, MeshRenderer, Node, Touch, PhysicsSystem, _decorator, instantiate, renderer, v3, geometry, Camera, EventTouch, Vec3, UITransform, RigidBody, BoxCollider, Mesh } from "cc"
import MafiaPropMgr from "./MafiaPropMgr"
import { PhyEnvGroup } from "../common/Misc"
const { ccclass, property } = _decorator

@ccclass('MafiaCheckerMgr')
export default class MafiaCheckerMgr extends Component {
  private _camera: Camera
  set camera(camera: Camera) { this._camera = camera }

  private boardModel: renderer.scene.Model
  private checkers: Node[] = []

  private _reactArea: Node
  set reactArea(node: Node) {
    this._reactArea = node

    if (this._reactArea) {
      this._reactArea.off(Node.EventType.TOUCH_START, this.onTouchStart, this)
      this._reactArea.off(Node.EventType.TOUCH_END, this.onTouchEnd, this)
      this._reactArea.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)

    }
    this._reactArea = node

    this._reactArea.on(Node.EventType.TOUCH_START, this.onTouchStart, this)
    this._reactArea.on(Node.EventType.TOUCH_END, this.onTouchEnd, this)
    this._reactArea.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)
  }

  private _v3Hit: Vec3 = v3()
  private _hitNode: Node
  set hitNode(node: Node) { this._hitNode = node }

  private offset = 0
  private offsetX = -0.286
  private offsetZ = -0.286

  private offsetXX = 0.286
  private offsetZZ = 0.286
  private boardBoundary: Vec3 = v3()

  private _ray: geometry.Ray = new geometry.Ray()

  onLoad() {

    this.node.addComponent(UITransform)

    let rigidBody = this.node.addComponent(RigidBody)
    rigidBody.type = RigidBody.Type.STATIC
    rigidBody.group = PhyEnvGroup.Prop
    rigidBody.addMask(PhyEnvGroup.Player | PhyEnvGroup.Terrain)
  }

  protected start(): void {
    this.boardModel = this.node.getComponent(MeshRenderer).model
    let minPos = v3(), maxPos = v3()
    this.boardModel.modelBounds.getBoundary(minPos, maxPos)

    Vec3.subtract(this.boardBoundary, maxPos, minPos)
    this.offset = (this.boardBoundary.x - 0.044) / 8

    let collider = this.node.addComponent(BoxCollider)

    let v3Tmp = v3()
    collider.isTrigger = true
    v3Tmp.set(this.boardModel.modelBounds.center)
    v3Tmp.y = (0.001)
    collider.center = v3Tmp
    v3Tmp.set(this.boardBoundary)
    v3Tmp.y = 0.002
    v3Tmp.x = v3Tmp.z = v3Tmp.z - 0.044
    collider.size = v3Tmp

    let checker = this.node.getChildByName('checker')

    let materials = checker.getComponent(MeshRenderer).materials
    console.log(materials)

    checker.active = false
    for (let i = 0; i < 8; i++) {
      let blackChecker = instantiate(checker)
      blackChecker.active = true
      blackChecker.position = v3(i * this.offset + this.offsetX, this.boardBoundary.y, this.offsetZ)
      this.node.addChild(blackChecker)
      this.checkers.push(blackChecker)

      let redChecker = instantiate(checker)
      redChecker.active = true
      redChecker.position = v3(i * this.offset + this.offsetX, this.boardBoundary.y, this.offsetZZ)
      this.node.addChild(redChecker)
      this.checkers.push(redChecker)
    }
  }

  private onTouchStart() {

  }

  private onTouchEnd(event: EventTouch) {
    this.selectGirdItem(event.touch)
  }


  private selectGirdItem(touch: Touch) {
    this._camera.screenPointToRay(touch.getLocationX(), touch.getLocationY(), this._ray)
    if (!PhysicsSystem.instance.raycast(this._ray, 0xffffffff, 500)) {
      console.warn('no hit')
      return
    }

    for (let i = 0; i < PhysicsSystem.instance.raycastResults.length; i++) {
      let item = PhysicsSystem.instance.raycastResults[i]


      if (item.collider.node.name == this.node.name) {

        let pos = this.node.getComponent(UITransform).convertToNodeSpaceAR(item.hitPoint)
        pos.x = Math.floor(pos.x / this.offset) * this.offset + this.offset / 2
        pos.y = 0
        pos.z = Math.floor(pos.z / this.offset) * this.offset + this.offset / 2

        this.node.getComponent(UITransform).convertToWorldSpaceAR(pos, pos)
        // console.log(pos)
        this._v3Hit.set(pos)
        this._v3Hit.y = this.node.position.y + this.boardBoundary.y + 0.005
        this._hitNode.position = this._v3Hit
        continue
      }

      if (item.collider.node.name == this._hitNode?.name) {
        console.log('checker')
      }

      // pos.x = Math.floor(pos.x + 0.5)
      // pos.y = Math.floor(this.curLayer)
      // pos.z = Math.floor(pos.z + 0.5)

    }

  }

}