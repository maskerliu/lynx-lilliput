import { BoxCollider, Node, Quat, RigidBody, Vec3, _decorator, instantiate, math, tween, v3 } from 'cc'
import { BigWorld } from '../../common/BigWorld'
import { terrainItemIdx } from '../../misc/Utils'
import LilliputAssetMgr from '../LilliputAssetMgr'
import CommonPropMgr, { PreviewScale } from './CommonPropMgr'

const { ccclass, property } = _decorator

const CubeMatchs = [BigWorld.Cube_L, BigWorld.Cube_B, BigWorld.Cube_R, BigWorld.Cube_F]

@ccclass('BridgeMgr')
export default class BridgeMgr extends CommonPropMgr {

  private _matrix: number = 0b00000
  private gCenter: Node
  private gFences: Array<Node> = []
  private gRails: Array<Node> = []
  private gStands: Array<Node> = []
  init(info: number[], preview?: boolean) {
    this._info = Object.assign([], info)
    this._index = terrainItemIdx(this.info[1], this.info[2], this.info[3])

    CommonPropMgr.v3_pos.set(this._info[1], this._info[2], this._info[3])
    this.node.position = CommonPropMgr.v3_pos

    let gcPrefabe = LilliputAssetMgr.instance.getTerrainPrefab('bridgeTile')
    let btfPrefab = LilliputAssetMgr.instance.getTerrainPrefab('bridgeTileFence')
    let btrPrefab = LilliputAssetMgr.instance.getTerrainPrefab('bridgeTileRail')
    let tile: Node


    this.gCenter = instantiate(gcPrefabe)
    this.node.addChild(this.gCenter)

    BridgeMgr.v3_pos.set(Vec3.ZERO)
    for (let i = 0; i < 2; ++i) {
      BridgeMgr.v3_pos.z = i == 0 ? 0.53 : -0.53
      tile = instantiate(btfPrefab)
      tile.position = BridgeMgr.v3_pos
      this.node.addChild(tile)
      tile.active = false
      this.gFences.push(tile)
    }

    BridgeMgr.v3_pos.set(0.4, 0, 0.53)
    tile = instantiate(btrPrefab)
    tile.position = BridgeMgr.v3_pos
    this.node.addChild(tile)
    tile.active = false
    this.gRails.push(tile)

    BridgeMgr.v3_pos.set(0.4, 0, -0.53)
    tile = instantiate(btrPrefab)
    tile.position = BridgeMgr.v3_pos
    this.node.addChild(tile)
    tile.active = false
    this.gRails.push(tile)

    BridgeMgr.v3_pos.set(-0.4, 0, -0.53)
    tile = instantiate(btrPrefab)
    tile.position = BridgeMgr.v3_pos
    this.node.addChild(tile)
    tile.active = false
    this.gRails.push(tile)

    BridgeMgr.v3_pos.set(-0.4, 0, 0.53)
    tile = instantiate(btrPrefab)
    tile.position = BridgeMgr.v3_pos
    this.node.addChild(tile)
    tile.active = false
    this.gRails.push(tile)

    this.node.rotation = Quat.rotateY(this.node.rotation, this.node.rotation, math.toRadian(this._info[4]))

    this.initPhysical()

    this.preview(preview)

    this._loaded = true
  }

  preview(preview: boolean): void {
    if (this._animating) return
    this._animating = true

    if (preview) {
      this._preview = preview
      this.matrix = this._matrix
    }

    if (!preview && this._selected) {
      BridgeMgr.v3_pos.set(this._info[1], this._info[2], this._info[3])
      this.node.position = BridgeMgr.v3_pos
      this._selected = false
    }

    tween(this.node).to(0.5, { scale: preview ? PreviewScale : Vec3.ONE }, {
      easing:  'bounceOut',
      onComplete: () => {
        this._animating = false
        this._preview = preview
        this.matrix = this._matrix
      }
    }).start()
  }

  rotate(angle: number) {
    if (this._animating) return

    this._animating = true
    Quat.rotateY(CommonPropMgr.q_rotation, this.node.rotation, math.toRadian(angle))
    tween(this.node).to(0.3, { rotation: CommonPropMgr.q_rotation }, {
      easing: 'smooth',
      onComplete: () => {
        this._animating = false
        this._info[4] = this.angle(this._info[4] + angle)
      }
    }).start()
  }

  angle(oldAngle: number): number {
    let a = 0

    let sin = Math.sin(math.toRadian(oldAngle))
    if (sin == 1) { a = 90 }
    else if (sin == -1) { a = -90 }
    else { a = 0 }
    return a
  }

  set matrix(data: number) {
    this._matrix = data

    if (this._preview) {
      this.gCenter.active = true
      this.gFences.forEach(it => {
        it.active = true
        this.node.addChild(it)
      })
      this.gRails.forEach(it => {
        it.active = false
      })

      return
    }

    let sin = Math.sin(math.toRadian(this._info[4]))

    let l = 0, r = 0, uf = 0, ub = 0
    if (sin == 1) {
      l = BigWorld.Cube_B
      r = BigWorld.Cube_F
      uf = BigWorld.Cube_UL
      ub = BigWorld.Cube_UR
    } else if (sin == -1) {
      l = BigWorld.Cube_F
      r = BigWorld.Cube_B
      uf = BigWorld.Cube_UR
      ub = BigWorld.Cube_UL
    } else {
      l = BigWorld.Cube_L
      r = BigWorld.Cube_R
      uf = BigWorld.Cube_UF
      ub = BigWorld.Cube_UB
    }

    let arr = [l, r]
    for (let j = 0; j < arr.length; ++j) {
      if (this._matrix & arr[j]) {
        for (let i = 0; i < 2; ++i) {
          this.gRails[i + j * 2].active = false
          this.gRails[i + j * 2].removeFromParent()
        }
      } else {
        for (let i = 0; i < 2; ++i) {
          this.gRails[i + j * 2].active = true
          this.node.addChild(this.gRails[i + j * 2])
        }
      }
    }

    arr = [uf, ub]
    for (let i = 0; i < 2; ++i) {
      if (this._matrix & arr[i]) {
        this.gFences[i].active = false
        this.gFences[i].removeFromParent()
      } else {
        this.gFences[i].active = true
        this.node.addChild(this.gFences[i])
      }
    }
  }

  protected initPhysical(): void {
    this.rigidBody = this.node.addComponent(RigidBody)
    this.rigidBody.type = RigidBody.Type.STATIC
    this.rigidBody.group = BigWorld.PhyEnvGroup.Terrain
    this.rigidBody.setMask(BigWorld.GroundMask)

    let collider = this.node.addComponent(BoxCollider)
    collider.center = v3(0, 0.9, 0)
    collider.size = v3(1, 0.2, 1)
    collider.material = this.phyMtl()

    collider = this.node.addComponent(BoxCollider)
    collider.center = v3(0, 1.35, 0.53)
    collider.size = v3(1, 0.7, 0.14)
    collider.material = this.phyMtl()

    collider = this.node.addComponent(BoxCollider)
    collider.center = v3(0, 1.35, -0.53)
    collider.size = v3(1, 0.7, 0.14)
    collider.material = this.phyMtl()

    this.enablePhysic(false)
  }
}

BridgeMgr.ItemName = 'bridge'