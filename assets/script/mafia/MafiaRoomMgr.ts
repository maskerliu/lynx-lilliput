import { Camera, Component, Node, Prefab, RigidBody, _decorator, instantiate, v3 } from "cc"
import { PhyEnvGroup } from "../common/Misc"
import OrbitCamera from "../common/OrbitCamera"
import MafiaBilliardMgr from "./MafiaBilliardMgr"
import MafiaCheckerMgr from "./MafiaCheckerMgr"
import MafiaDiceMgr from "./MafiaDiceMgr"
import MafiaPlayerMgr from "./MafiaPlayerMgr"
import MafiaPropMgr from "./MafiaPropMgr"
import MafiaUIMgr from "./MafiaUIMgr"


const { ccclass, property } = _decorator


const PropMap: Map<string, Object> = new Map()

PropMap.set(MafiaDiceMgr.PropName, MafiaDiceMgr)

@ccclass('MafiaRoomMgr')
export default class MafiaRoomMgr extends Component {


  @property(Prefab)
  private playerPrefab: Prefab

  @property(MafiaUIMgr)
  private uiMgr: MafiaUIMgr

  @property(OrbitCamera)
  private orbitCamera: OrbitCamera

  @property(Node)
  private hitNode: Node

  private mafiaRoom: Node

  onLoad() {
    this.mafiaRoom = this.node.getChildByName('MafiaRoom')

    let player = instantiate(this.playerPrefab)
    player.position = v3(0, 0.5, 0)
    let playerMgr = player.addComponent(MafiaPlayerMgr)
    playerMgr.init(null)
    playerMgr.followCamera = this.orbitCamera.node

    this.mafiaRoom.addChild(player)

    this.uiMgr.rockerTarget = playerMgr

    this.orbitCamera.reactArea = this.uiMgr.reactArea
    this.orbitCamera.target = playerMgr.node
  }

  protected start(): void {
    this.init()
    this.initChecker()
    this.initBilliard()
    // console.log(this.mafiaRoom.getChildByName('handrail').getComponent(MeshRenderer).model)
  }

  initChecker() {
    let checkerBoard = this.mafiaRoom.getChildByName('checkerBoard')
    let checkerMgr = checkerBoard.addComponent(MafiaCheckerMgr)
    checkerMgr.camera = this.orbitCamera.getComponent(Camera)
    checkerMgr.hitNode = this.hitNode
    checkerMgr.reactArea = this.uiMgr.reactArea
  }

  initBilliard() {
    let node = this.mafiaRoom.getChildByName('billiardTable')
    node.addComponent(MafiaBilliardMgr)
    let billiardMgr = node.getComponent(MafiaBilliardMgr)
    billiardMgr.camera = this.orbitCamera.getComponent(Camera)
  }


  init() {
    this.addMeshCollider('room', RigidBody.Type.STATIC, PhyEnvGroup.Terrain)
    this.addMeshCollider('bar', RigidBody.Type.STATIC, PhyEnvGroup.Prop)
    this.addMeshCollider('cabinet', RigidBody.Type.STATIC, PhyEnvGroup.Terrain)

    this.addMeshCollider('chair1', RigidBody.Type.STATIC, PhyEnvGroup.Prop)
    this.addMeshCollider('chair2', RigidBody.Type.STATIC, PhyEnvGroup.Prop)
    this.addMeshCollider('chair3', RigidBody.Type.STATIC, PhyEnvGroup.Prop)
    this.addMeshCollider('chair4', RigidBody.Type.STATIC, PhyEnvGroup.Prop)

    this.addMeshCollider('pokerTable', RigidBody.Type.STATIC, PhyEnvGroup.Prop)
    this.addMeshCollider('armchair1', RigidBody.Type.STATIC, PhyEnvGroup.Prop)
    this.addMeshCollider('armchair2', RigidBody.Type.STATIC, PhyEnvGroup.Prop)

    this.addMeshCollider('dice', RigidBody.Type.DYNAMIC, PhyEnvGroup.Prop)

    this.addMeshCollider('swimmingPool', RigidBody.Type.STATIC, PhyEnvGroup.Terrain)
  }


  private addMeshCollider(name: string, type: RigidBody.Type, group: PhyEnvGroup) {

    try {
      let node = this.mafiaRoom.getChildByName(name)
      let propMgr = node.addComponent(MafiaPropMgr)
      propMgr.init(type, group)
    } catch (err) {
      console.warn(name)
      throw err
    }


  }

}