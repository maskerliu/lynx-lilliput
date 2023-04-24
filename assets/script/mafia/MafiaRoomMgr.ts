import { Camera, Component, MeshCollider, MeshRenderer, Node, RigidBody, _decorator, instantiate, v3 } from "cc"
import OrbitCamera from "../common/OrbitCamera"
import RockerMgr from "../common/RockerMgr"
import MafiaPlayerMgr from "./MafiaPlayerMgr"
import { PhyEnvGroup } from "../common/Misc"


const { ccclass, property } = _decorator

@ccclass('MafiaRoomMgr')
export default class MafiaRoomMgr extends Component {
  @property(Camera)
  private mainCamera: Camera

  @property(Node)
  private reactArea: Node

  @property(Node)
  private rocker: Node

  private orbitCamera: OrbitCamera

  private checkers = []

  private originX = 5.633
  private originZ = 1.899

  private originXX = 6.16
  private originZZ = 2.476


  private offsetX = 0
  private offsetZ = 0


  private rockerMgr: RockerMgr
  private playerMgr: MafiaPlayerMgr

  onLoad() {

    this.orbitCamera = this.mainCamera.getComponent(OrbitCamera)
    this.rockerMgr = this.rocker.getComponent(RockerMgr)
    this.playerMgr = this.getComponentInChildren(MafiaPlayerMgr)
    this.playerMgr.init(null)

    this.orbitCamera.reactArea = this.reactArea
    this.orbitCamera.target = this.playerMgr.node
    this.playerMgr.followCamera = this.orbitCamera.node
    this.rockerMgr.target = this.playerMgr

    this.offsetX = (this.originXX - this.originX) / 7
    this.offsetZ = (this.originZZ - this.originZ) / 7

    let checker = this.node.getChildByName('checker')

    for (let i = 0; i < 8; i++) {
      let blackChecker = instantiate(checker)
      blackChecker.position = v3(i * this.offsetX + this.originX, 0.580319, this.originZ)
      this.node.addChild(blackChecker)
      this.checkers.push(blackChecker)

      let redChecker = instantiate(checker)
      redChecker.position = v3(i * this.offsetX + this.originX, 0.580319, this.originZZ)

      let renderer = redChecker.getComponent(MeshRenderer)
      // renderer.setMaterial(IslandAssetMgr.getMaterial('heart'), 0)
      this.node.addChild(redChecker)
      this.checkers.push(redChecker)
    }

  }

  protected start(): void {
    this.init()

    console.log(this.node.getChildByName('handrail').getComponent(MeshRenderer).model)
  }


  init() {
    this.addMeshCollider('room')
    this.addMeshCollider('bar')
    this.addMeshCollider('cabinet')

    this.addMeshCollider('chair1')
    this.addMeshCollider('chair2')
    this.addMeshCollider('chair3')
    this.addMeshCollider('chair4')

    this.addMeshCollider('billiard')

    this.addMeshCollider('pokerTable')
    this.addMeshCollider('armchair1')
    this.addMeshCollider('armchair2')

    this.addMeshCollider('dice')

    this.addMeshCollider('swimmingPool')
  }


  private addMeshCollider(name: string) {
    let meshNode = this.node.getChildByName(name)

    meshNode.addComponent(RigidBody)
    let rigidBody = meshNode.getComponent(RigidBody)
    rigidBody.type = RigidBody.Type.STATIC
    rigidBody.group = PhyEnvGroup.Terrain
    rigidBody.setMask(PhyEnvGroup.Prop | PhyEnvGroup.Player | PhyEnvGroup.Vehicle)

    meshNode.addComponent(MeshCollider)
    let collider = meshNode.getComponent(MeshCollider)
    // collider.convex = true
    collider.mesh = meshNode.getComponent(MeshRenderer).mesh

    // meshNode.getComponent(MeshRenderer).mesh.struct


  }

}