import { Camera, Color, Component, EventTouch, GeometryRenderer, Mesh, MeshRenderer, Node, PhysicsSystem, Vec3, _decorator, geometry, instantiate, math, v2, v3 } from 'cc'
import { BigWorld } from '../common/BigWorld'
import { MapCube, MapGrid, Vertex } from '../common/MapGrid'
import { Model, ModelMgr } from '../common/ModelMgr'
import LilliputAssetMgr from '../lilliput/LilliputAssetMgr'
const { ccclass, property, executeInEditMode } = _decorator

const v3_0 = v3()
const v3_00 = v3()
const v3_1 = v3()
const v3_11 = v3()

export class Slot extends Component {

  info: MapCube

  _lstMartix = 0b00000000

  meshRenderer: MeshRenderer

  private _gizmo: GeometryRenderer

  init(cube: MapCube, gizmo?: GeometryRenderer) {
    this.info = cube
    v3_0.set(this.info.vertexCenter.curPos)
    v3_0.y -= 0.5
    this.node.position = v3_0

    this.updateSlot()

    // let rigidBody = this.node.addComponent(RigidBody)
    // rigidBody.type = RigidBody.Type.STATIC
    // rigidBody.group = BigWorld.PhyEnvGroup.Terrain
    // rigidBody.setMask(BigWorld.GroundMask)

    // let collider = this.node.addComponent(SimplexCollider) // bottom
    // collider.shapeType = SimplexCollider.ESimplexType.TRIANGLE
    // collider.vertex0 = Vec3.subtract(collider.vertex0, cube.quad.vertices[0].curPos, cube.quad.vertexCenter.curPos)
    // collider.vertex1 = Vec3.subtract(collider.vertex1, cube.quad.vertices[1].curPos, cube.quad.vertexCenter.curPos)
    // collider.vertex2 = Vec3.subtract(collider.vertex2, cube.quad.vertices[2].curPos, cube.quad.vertexCenter.curPos)
    // collider.enabled = false
    // collider.enabled = true

    // collider = this.node.addComponent(SimplexCollider)
    // collider.shapeType = SimplexCollider.ESimplexType.TRIANGLE
    // collider.vertex0 = Vec3.subtract(collider.vertex0, cube.quad.vertices[0].curPos, cube.quad.vertexCenter.curPos)
    // collider.vertex1 = Vec3.subtract(collider.vertex3, cube.quad.vertices[3].curPos, cube.quad.vertexCenter.curPos)
    // collider.vertex2 = Vec3.subtract(collider.vertex2, cube.quad.vertices[2].curPos, cube.quad.vertexCenter.curPos)
    // collider.enabled = false
    // collider.enabled = true

    // collider = this.node.addComponent(SimplexCollider) // up
    // collider.vertex0 = Vec3.subtract(collider.vertex0, cube.vertices[0].curPos, cube.vertexCenter.curPos)
    // collider.vertex0.y += 1
    // collider.vertex1 = Vec3.subtract(collider.vertex1, cube.vertices[1].curPos, cube.vertexCenter.curPos)
    // collider.vertex1.y += 1
    // collider.vertex2 = Vec3.subtract(collider.vertex2, cube.vertices[2].curPos, cube.vertexCenter.curPos)
    // collider.vertex2.y += 1
    // collider.vertex3 = Vec3.subtract(collider.vertex3, cube.vertices[3].curPos, cube.vertexCenter.curPos)
    // collider.vertex3.y += 1
    // collider.enabled = false
    // collider.enabled = true

  }

  updateSlot() {
    if (this._lstMartix != this.info.martix) {
      this.node.children.forEach(it => it.destroy())
      let model = ModelMgr.instance.getModel(this.info.martix)[0]
      let modelNode = instantiate(model.prefab).getChildByName(model.prefab.name)
      modelNode.name = model.name
      v3_0.set(0, 0.5, 0)
      modelNode.position = v3_0
      this.node.addChild(modelNode)

      let out: Uint8Array
      this.meshRenderer = modelNode.getComponent(MeshRenderer)
      out = structuredClone(this.meshRenderer.mesh.data)
      console.log(model.name)
      this.transformMesh(out, model)

      let mesh = new Mesh()
      mesh.reset({ struct: this.meshRenderer.mesh.struct, data: out })
      mesh.initialize()
      this.meshRenderer.mesh = mesh
      this.meshRenderer.onGeometryChanged()
      this._lstMartix = this.info.martix
    }
  }

  transformMesh(data: Uint8Array, model: Model) {
    let stride = this.meshRenderer.mesh.struct.vertexBundles[0].view.stride
    let count = this.meshRenderer.mesh.struct.vertexBundles[0].view.count
    let offset = 0
    let wrapFloatData = new Float32Array(data.buffer)

    if (model.rotation != 0)
      for (let i = 0; i < count; ++i) {
        offset = i * stride / 4
        v3_0.set(wrapFloatData[offset], wrapFloatData[offset + 1], wrapFloatData[offset + 2])
        switch (model.axis) {
          case Model.Axis_X:
            Vec3.rotateX(v3_0, v3_0, Vec3.UNIT_X, math.toRadian(90 * model.rotation))
            break
          case Model.Axis_Y:
            Vec3.rotateY(v3_0, v3_0, Vec3.UNIT_Y, math.toRadian(90 * model.rotation))
            break
          case Model.Axis_Z:
            Vec3.rotateZ(v3_0, v3_0, Vec3.UNIT_Z, math.toRadian(90 * model.rotation))
            break
        }

        wrapFloatData[offset] = v3_0.x
        wrapFloatData[offset + 1] = v3_0.y
        wrapFloatData[offset + 2] = v3_0.z
      }

    // flip
    if (model.flip & Model.Axis_X) {
      for (let i = 0; i < count; ++i) {
        offset = i * stride / 4
        wrapFloatData[offset] = -wrapFloatData[offset]
      }
    }

    if (model.flip & Model.Axis_Y) {
      for (let i = 0; i < count; ++i) {
        offset = i * stride / 4
        wrapFloatData[offset + 1] = -wrapFloatData[offset + 1]
      }
    }

    if (model.flip & Model.Axis_Z) {
      for (let i = 0; i < count; ++i) {
        offset = i * stride / 4
        wrapFloatData[offset + 2] = -wrapFloatData[offset + 2]
      }
    }


    // deform
    // return
    for (let i = 0; i < count; ++i) {
      offset = i * stride / 4

      Vec3.subtract(v3_00, this.info.vertex(0).curPos, this.info.quad.vertexCenter.curPos)
      Vec3.subtract(v3_11, this.info.vertex(1).curPos, this.info.quad.vertexCenter.curPos)
      Vec3.lerp(v3_0, v3_00, v3_11, wrapFloatData[offset] + 0.5)

      Vec3.subtract(v3_00, this.info.vertex(2).curPos, this.info.quad.vertexCenter.curPos)
      Vec3.subtract(v3_11, this.info.vertex(3).curPos, this.info.quad.vertexCenter.curPos)
      Vec3.lerp(v3_1, v3_00, v3_11, wrapFloatData[offset] + 0.5)

      Vec3.lerp(v3_0, v3_1,v3_0,  wrapFloatData[offset + 2] + 0.5)

      wrapFloatData[offset] = v3_0.x
      wrapFloatData[offset + 2] = v3_0.z
    }

  }
}

@ccclass('GizmoMgr')
// @executeInEditMode(true)
export class GizmoMgr extends Component {

  @property(Camera)
  mainCamera: Camera

  @property(Node)
  ui: Node

  @property(Node)
  hitPoint: Node

  private cubes: Array<Node> = []

  private _ray = new geometry.Ray()
  private hexGrid: MapGrid

  private gizmoRenderer: GeometryRenderer

  private defMesh: Mesh

  private _lstTouch = v2()

  protected onLoad(): void {
    let node = instantiate(LilliputAssetMgr.instance.getTerrainPrefab('00001111'))
    this.node.addChild(node)
    this.defMesh = node.getComponent(MeshRenderer).mesh

  }

  start() {
    this.mainCamera?.camera.initGeometryRenderer()
    this.gizmoRenderer = this.mainCamera.camera.geometryRenderer
    this.hexGrid = new MapGrid(5)
    console.log(this.hexGrid.vertices)
    this.ui.on(Node.EventType.TOUCH_START, this.onTouchStart, this)
    this.ui.on(Node.EventType.TOUCH_END, this.onTouchEnd, this)
  }

  private onTouchStart(event: EventTouch) {

    this._lstTouch.set(event.touch.getLocation())
  }

  private onTouchEnd(event: EventTouch) {
    this._lstTouch.subtract(event.getLocation())
    if (Math.abs(this._lstTouch.x) > 10 || Math.abs(this._lstTouch.y) > 10) return

    this.mainCamera.screenPointToRay(event.touch.getLocationX(), event.touch.getLocationY(), this._ray)
    if (!PhysicsSystem.instance.raycastClosest(this._ray, BigWorld.PhyEnvGroup.Terrain)) {
      console.warn('no hit')
    }

    this.hitPoint.position = PhysicsSystem.instance.raycastClosestResult.hitPoint
    let vertex: Vertex = null, distance = -1, minDist = Number.MAX_VALUE
    for (let i = 0; i < this.hexGrid.vertices.length; ++i) {
      distance = Vec3.distance(this.hitPoint.position, this.hexGrid.vertices[i].curPos)
      if (minDist > distance) {
        minDist = distance
        vertex = this.hexGrid.vertices[i]
      }
    }
    if (vertex == null || vertex.isActive) return
    vertex.isActive = true
    vertex.cubes.forEach(it => {
      if (Math.abs(it.height - this.hitPoint.position.y) < 0.01) {
        it.updateMartix()
        let cube = this.node.getChildByName(`mapCube_${it.idx}`)
        let slot: Slot
        if (cube == null) {
          cube = new Node(`mapCube_${it.idx}`)
          this.node.addChild(cube)
          slot = cube.addComponent(Slot)
          slot.init(it, this.gizmoRenderer)
        } else {
          slot = cube.getComponent(Slot)
          slot.updateSlot()
        }
      }
    })

  }

  update(dt: number) {
    // this.hexGrid.vertices.forEach(it => {
    //   this.gizmoRenderer?.addCircle(it.curPos, 0.1, Color.RED, 20)
    // })

    // this.hexGrid.quads.forEach(it => {
    //   for (let i = 0; i < 4; ++i) {
    //     this.gizmoRenderer?.addLine(it.vertices[i].curPos, it.vertices[(i + 1) % 4].curPos, Color.BLUE)
    //   }
    //   it.edges.forEach(edge => {
    //     if (edge) this.gizmoRenderer?.addCross(edge.vertexCenter.curPos, 0.1, Color.BLUE)
    //   })
    //   this.gizmoRenderer?.addCross(it.vertexCenter.curPos, 0.1, Color.BLUE)
    // })

    // this.hexGrid.triangles.forEach(it => {
    //   for (let i = 0; i < 3; ++i) {
    //     this.gizmoRenderer?.addLine(it.vertices[i].curPos, it.vertices[(i + 1) % 3].curPos, Color.YELLOW)
    //   }
    //   it.edges.forEach(edge => {
    //     if (edge) this.gizmoRenderer?.addCross(edge.vertexCenter.curPos, 0.1, Color.YELLOW)
    //   })
    //   this.gizmoRenderer?.addCross(it.vertexCenter.curPos, 0.1, Color.YELLOW)
    // })

    this.hexGrid.subQuads.forEach(it => {
      for (let i = 0; i < 4; ++i) {
        this.gizmoRenderer?.addLine(it.vertices[i].curPos, it.vertices[(i + 1) % 4].curPos, Color.WHITE)
      }

      it.vertices.forEach(vertex => {
        if (vertex.isActive) this.gizmoRenderer?.addCircle(vertex.curPos, 0.1, Color.RED)
      })
    })

    // this.hexGrid.cubes.forEach(it => {
    // this.gizmoRenderer?.addCross(it.vertexCenter.curPos, 0.1, Color.YELLOW)

    // for (let i = 0; i < 4; ++i) {
    // this.v3_0.set(it.quad.vertices[i].curPos)
    // this.v3_0.y += it.height
    // this.v3_00.set(this.v3_0)
    // this.v3_00.y += 1
    // this.v3_1.set(it.quad.vertices[(i + 1) % 4].curPos)
    // this.v3_1.y += it.height
    // this.v3_11.set(this.v3_1)
    // this.v3_11.y += 1

    // this.gizmoRenderer?.addLine(this.v3_0, this.v3_00, Color.RED)
    // this.gizmoRenderer?.addLine(this.v3_1, this.v3_11, Color.RED)
    // this.gizmoRenderer?.addLine(this.v3_0, this.v3_1, Color.RED)
  }
  // })
  // }
}