import { Vec3, math, v3 } from 'cc'

export class MapGrid {
  public static CellSize: number = 1

  private _vertices = new Array<Vertex>()
  get vertices() { return this._vertices }

  private _triangles = new Array<MapTriangle>()
  get triangles() { return this._triangles }

  private _edges = new Array<MapEdge>()
  get edges() { return this._edges }

  private _quads = new Array<MapQuad>()
  get quads() { return this._quads }

  private _subQuads = new Array<MapQuad>()
  get subQuads() { return this._subQuads }

  private _cubes = new Array<MapCube>()
  get cubes() { return this._cubes }

  constructor(radius: number) {
    VertexHex.hex(this._vertices, radius)

    for (let i = 1; i <= radius; ++i) { MapTriangle.triangleRing(i, this._vertices, this._triangles, this._edges) }

    while (MapTriangle.hasNeighborTriangles(this._triangles)) { MapTriangle.randomMerge(this._triangles, this._quads) }

    this._triangles.forEach(it => this._subQuads.push(...it.subdivide(this._vertices)))
    this._quads.forEach(it => this._subQuads.push(...it.subdivide(this._vertices)))

    for (let i = 0; i < 50; ++i) {
      this._subQuads.forEach(it => {
        it.relaxOffset()
      })
    }

    for (let i = 0; i < 6; ++i) {
      this._subQuads.forEach(it => {
        it.updateCenter()
        this._cubes.push(new MapCube(it, i))
      })
    }
  }
}

export class MapCoord {
  q: number = 0
  r: number = 0
  s: number = 0
  readonly radius: number = 0

  constructor(q: number, r: number, s: number) {
    this.q = q
    this.r = r
    this.s = s

    this.radius = Math.max(q, r, s)
  }

  private static directions = [
    new MapCoord(0, 1, -1),
    new MapCoord(-1, 1, 0),
    new MapCoord(-1, 0, 1),
    new MapCoord(0, -1, 1),
    new MapCoord(1, -1, 0),
    new MapCoord(1, 0, -1)
  ]

  direction() { }

  add(coord: MapCoord) {
    return new MapCoord(this.q + coord.q, this.r + coord.r, this.s + coord.s)
  }

  scale(scale: number) {
    return new MapCoord(this.q * scale, this.r * scale, this.s * scale)
  }

  static ring(radius: number) {
    let result = new Array<MapCoord>()
    if (radius == 0) result.push(new MapCoord(0, 0, 0))
    else {
      let coord = MapCoord.directions[4].scale(radius)
      for (let i = 0; i < 6; ++i) {
        for (let j = 0; j < radius; ++j) {
          result.push(coord)
          coord = coord.neighbor(i)
        }
      }
    }
    return result
  }

  neighbor(direction: number) {
    return this.add(MapCoord.directions[direction])
  }

  static genHexGird(radius: number) {
    let result = new Array<MapCoord>()
    for (let i = 0; i <= radius; ++i) {
      result.push(...MapCoord.ring(i))
    }
    return result
  }
}

export class Vertex {
  protected _isActive: boolean = false
  get isActive() { return this._isActive }
  set isActive(active: boolean) { this._isActive = active }

  private _isBoundry = false

  private _initPos: Vec3

  get initPos() {
    this._initPos = this._initPos == null ? v3() : this._initPos
    return this._initPos
  }

  set initPos(pos: Vec3) {
    this.initPos.set(pos)
  }

  private _curPos: Vec3

  get curPos() {
    this._curPos = this._curPos == null ? v3() : this._curPos
    return this._curPos
  }

  set curPos(pos: Vec3) {
    this._curPos.set(pos)
  }

  private _offset: Vec3

  get offset() {
    this._offset = this._offset == null ? v3() : this._offset
    return this._offset
  }

  set offset(pos: Vec3) {
    this._offset.set(pos)
  }

  set(vertext: Vertex) {
    this.initPos.set(vertext.initPos)
    this.curPos.set(vertext.curPos)
    this.isActive = vertext.isActive
  }

  equals(vertex: Vertex) {
    return this.initPos.equals(vertex.initPos) && this.curPos.equals(vertex.curPos)
  }

  boundryCheck() {

  }

  private _cubes: Array<MapCube> = []
  get cubes() { return this._cubes }
  addCube(cube: MapCube) { this._cubes.push(cube) }

  relax() {
    Vec3.add(this.curPos, this.initPos, this.offset)
  }
}

export class VertexHex extends Vertex {
  private _coord: MapCoord

  constructor(coord: MapCoord) {
    super()
    this._coord = coord
    this.initPos.set((-coord.r - coord.q / 2) * 2, 0, coord.q * Math.sqrt(3))
    this.curPos.set(this.initPos)
  }

  static hex(vertices: Array<Vertex>, radius: number) {
    MapCoord.genHexGird(radius).forEach(it => {
      vertices.push(new VertexHex(it))
    })
  }

  static grabRing(radius: number) {
    if (radius == 0) return [0, 1]
    return [radius * (radius - 1) * 3 + 1, radius * 6]
  }
}

export abstract class MapShape {
  protected _vertices = new Array<Vertex>()
  get vertices() { return this._vertices }

  protected static v3_dir = v3()
  private static map_idx = new Map<number, number>()

  protected _vertexCenter: Vertex = new Vertex()
  get vertexCenter(): Vertex { return this._vertexCenter }

  readonly sortedIdx = []

  updateCenter() {

    this._vertexCenter.curPos.set(Vec3.ZERO)
    this.vertices.forEach(it => this._vertexCenter.curPos.add(it.curPos))
    this._vertexCenter.curPos.multiplyScalar(1 / this.vertices.length)
    this._vertexCenter.initPos.set(this._vertexCenter.curPos)

    MapShape.map_idx.clear()

    if (this._vertices.length < 3) return

    for (let i = 0; i < this._vertices.length; ++i) {
      Vec3.subtract(MapShape.v3_dir, this._vertices[i].curPos, this._vertexCenter.curPos)
      let angle = Vec3.angle(Vec3.UNIT_Z, MapShape.v3_dir.normalize())
      // console.log(angle, i)
      MapShape.map_idx.set(angle, i)
    }
    // console.log(MapShape.map_idx)
    let arr = Array.from(MapShape.map_idx.keys()).sort()
    this.sortedIdx.splice(0, this.sortedIdx.length)
    for (let i = 0; i < this._vertices.length; ++i) {
      if (MapShape.map_idx.get(arr[i]) == 0)
        this.sortedIdx.push(MapShape.map_idx.get(arr[i]))
      else
        this.sortedIdx.push(this._vertices.length - MapShape.map_idx.get(arr[i]))

    }

    // console.log('/////', this.sortedIdx)
  }

  vertex(idx: number) {
    return this._vertices[this.sortedIdx[idx]]
  }
}

export class MapEdge extends MapShape {

  constructor(a: Vertex, b: Vertex) {
    super()
    this._vertices.push(a, b)
    this.updateCenter()
  }

  static findEdge(a: Vertex, b: Vertex, edges: Array<MapEdge>) {
    return edges.findIndex(it => it._vertices.includes(a) && it._vertices.includes(b))
  }
}

export class MapTriangle extends MapShape {
  private _edges: Array<MapEdge> = new Array()
  get edges() { return this._edges }

  private constructor(a: Vertex, b: Vertex, c: Vertex) {
    super()
    this._vertices.push(a, b, c)
    this.updateCenter()
  }

  isNeighbor(target: MapTriangle) {
    if (target == this) return false
    for (let i = 0; i < this._edges.length; ++i) {
      if (target.edges.includes(this.edges[i])) return true
    }
    return false
  }

  neighbors(triangles: Array<MapTriangle>) {

    let neighbors = []
    for (let i = 0; i < triangles.length; ++i) {
      if (triangles[i] == this) continue
      if (this.isNeighbor(triangles[i])) neighbors.push(i)
    }
    return neighbors
  }

  neighborEdge(target: MapTriangle) {
    for (let i = 0; i < this._edges.length; ++i) {
      if (target.edges.includes(this.edges[i])) return this.edges[i]
    }
    return null
  }

  mergeNeighbor(target: MapTriangle, triangles: Array<MapTriangle>, quads: Array<MapQuad>) {
    let edge = this.neighborEdge(target)
    let myIsolateVIdx = this._vertices.findIndex(it => !edge.vertices.includes(it))
    let neighborIsolateVIdx = target._vertices.findIndex(it => !edge.vertices.includes(it))

    let a = this.vertices[myIsolateVIdx]
    let b = this.vertices[(myIsolateVIdx + 1) % 3]
    let c = target.vertices[neighborIsolateVIdx]
    let d = this.vertices[(myIsolateVIdx + 2) % 3]
    quads.push(new MapQuad(a, b, c, d))
    let idx = triangles.findIndex(it => it == this)
    triangles.splice(idx, 1)
    idx = triangles.findIndex(it => it == target)
    triangles.splice(idx, 1)
  }

  subdivide(vertices: Array<Vertex>) {
    this._edges.forEach(it => {
      let idx = vertices.findIndex(v => it.vertexCenter.equals(v))
      if (idx == -1) vertices.push(it.vertexCenter)
    })

    vertices.push(this.vertexCenter)

    return [
      new MapQuad(this._vertices[0], vertices.find(it => it.equals(this._edges[0].vertexCenter)), this.vertexCenter, vertices.find(it => it.equals(this._edges[1].vertexCenter))),
      new MapQuad(this._vertices[1], vertices.find(it => it.equals(this._edges[0].vertexCenter)), this.vertexCenter, vertices.find(it => it.equals(this._edges[2].vertexCenter))),
      new MapQuad(this._vertices[2], vertices.find(it => it.equals(this._edges[2].vertexCenter)), this.vertexCenter, vertices.find(it => it.equals(this._edges[1].vertexCenter))),
    ]
  }

  // 待优化
  static hasNeighborTriangles(triangles: Array<MapTriangle>) {
    for (let i = 0; i < triangles.length; ++i) {
      for (let j = 0; j < triangles.length; ++j) {
        if (triangles[i].isNeighbor(triangles[j])) return true
      }
    }
    return false
  }

  static triangleRing(radius: number, vertices: Array<Vertex>, triangles: Array<MapTriangle>, edges: Array<MapEdge>) {

    let [innerStart, innerLength] = VertexHex.grabRing(radius - 1)
    let [outerStart, outerLength] = VertexHex.grabRing(radius)

    for (let i = 0; i < 6; ++i)
      for (let j = 0; j < radius; ++j) {
        let a = vertices[i * radius + j + outerStart]
        let b = vertices[(i * radius + j + 1) % outerLength + outerStart]
        let c = vertices[(i * (radius - 1) + j) % innerLength + innerStart]
        // 创建两个顶点在外圈,一个顶点在内圈的三角形
        triangles.push(MapTriangle.newTriangle(a, b, c, edges))
        // 创建一个顶点在外圈，两个顶点在内圈的三角形
        if (j > 0) {
          let d = vertices[i * (radius - 1) + j - 1 + innerStart]
          triangles.push(MapTriangle.newTriangle(a, c, d, edges))
        }
      }
  }

  static randomMerge(triangles: Array<MapTriangle>, quads: Array<MapQuad>) {

    let idx = Math.ceil(Math.random() * (triangles.length - 1))
    let neighbors = triangles[idx].neighbors(triangles)
    if (neighbors.length > 0) {
      let target = Math.ceil(Math.random() * (neighbors.length - 1))
      triangles[idx].mergeNeighbor(triangles[neighbors[target]], triangles, quads)
    }
  }

  private static newTriangle(a: Vertex, b: Vertex, c: Vertex, edges: Array<MapEdge>) {

    let triangle = new MapTriangle(a, b, c)
    let idx = MapEdge.findEdge(a, b, edges)
    if (idx == -1) {
      let edge = new MapEdge(a, b)
      edges.push(edge)
      triangle.edges.push(edge)
    } else {
      triangle.edges.push(edges[idx])
    }

    idx = MapEdge.findEdge(a, c, edges)
    if (idx == -1) {
      let edge = new MapEdge(a, c)
      edges.push(edge)
      triangle.edges.push(edge)
    } else {
      triangle.edges.push(edges[idx])
    }

    idx = MapEdge.findEdge(b, c, edges)
    if (idx == -1) {
      let edge = new MapEdge(b, c)
      edges.push(edge)
      triangle.edges.push(edge)
    } else {
      triangle.edges.push(edges[idx])
    }

    return triangle
  }
}


export class MapQuad extends MapShape {

  private _edges = new Array<MapEdge>()
  get edges() { return this._edges }

  constructor(a: Vertex, b: Vertex, c: Vertex, d: Vertex) {
    super()

    this._vertices.push(a, b, c, d)
    this.updateCenter()

    for (let i = 0; i < this._vertices.length; ++i) {
      this._edges.push(new MapEdge(this._vertices[i], this._vertices[(i + 1) % this._vertices.length]))
    }
  }

  private stortVertices() {


    for (let i = 0; i < this._edges.length; ++i) {

      Vec3.subtract(MapShape.v3_dir, this.vertexCenter.curPos, this._edges[i].vertexCenter.curPos)

      MapShape.v3_dir.normalize()

    }

  }

  findTarget(pos: Vec3) {

    let distance = Vec3.distance(this._vertices[0].curPos, pos)
    let minDist = -1
    let idx = 0
    for (let i = 0; i < this._vertices.length; ++i) {
      distance = Vec3.distance(this._vertices[i].curPos, pos)
      if (minDist > distance) {
        minDist = distance
        idx = i
      }
    }

    this._vertices[idx].isActive = true

    return 1 << (4 - idx)


    // Vec3.add(v3_a, this._vertices[0].curPos, this._vertices[1].curPos)
    // v3_a.multiplyScalar(0.5)
    // Vec3.add(v3_b, this._vertices[1].curPos, this._vertices[2].curPos)
    // v3_b.multiplyScalar(0.5)
    // Vec3.add(v3_c, this._vertices[2].curPos, this._vertices[3].curPos)
    // v3_c.multiplyScalar(0.5)
    // Vec3.add(v3_d, this._vertices[0].curPos, this._vertices[3].curPos)
    // v3_d.multiplyScalar(0.5)
    // let abcd = (pos.z - v3_a.z) * (pos.x - v3_c.x) - (pos.z - v3_c.z) * (pos.x - v3_a.x)
    // let bcda = (pos.z - v3_b.z) * (pos.x - v3_d.x) - (pos.z - v3_d.z) * (pos.x - v3_b.x)

    // let abcd_a = (this._vertices[0].curPos.z - v3_a.z) * (this._vertices[0].curPos.x - v3_c.x) -
    //   (this._vertices[0].curPos.z - v3_c.z) * (this._vertices[0].curPos.x - v3_a.x)
    // let bcda_a = (this._vertices[0].curPos.z - v3_b.z) * (this._vertices[0].curPos.x - v3_d.x) -
    //   (this._vertices[0].curPos.z - v3_d.z) * (this._vertices[0].curPos.x - v3_b.x)

    // let onAD = abcd * abcd_a >= 0
    // let onAB = bcda * bcda_a >= 0

    // let martix = 0b0000
    // if (onAD && onAB) {
    //   martix = 0b1000
    // } else if (!onAD && onAB) {
    //   martix = 0b0100
    // } else if (!onAD && !onAB) {
    //   martix = 0b0010
    // } else {
    //   martix = 0b0001
    // }

    // if (onAD && onAB) {
    //   this._vertices[0].isActive = true
    // } else if (!onAD && onAB) {
    //   this._vertices[1].isActive = true
    // } else if (!onAD && !onAB) {
    //   this._vertices[2].isActive = true
    // } else {
    //   this._vertices[3].isActive = true
    // }

    // return martix
  }

  subdivide(vertices: Array<Vertex>) {

    this._edges.forEach(it => {
      let idx = vertices.findIndex(v => it.vertexCenter.equals(v))
      if (idx == -1) vertices.push(it.vertexCenter)
    })

    vertices.push(this.vertexCenter)

    return [
      new MapQuad(this._vertices[0], vertices.find(it => it.equals(this._edges[0].vertexCenter)), this.vertexCenter, vertices.find(it => it.equals(this._edges[3].vertexCenter))),
      new MapQuad(this._vertices[1], vertices.find(it => it.equals(this._edges[1].vertexCenter)), this.vertexCenter, vertices.find(it => it.equals(this._edges[0].vertexCenter))),
      new MapQuad(this._vertices[2], vertices.find(it => it.equals(this._edges[2].vertexCenter)), this.vertexCenter, vertices.find(it => it.equals(this._edges[1].vertexCenter))),
      new MapQuad(this._vertices[3], vertices.find(it => it.equals(this._edges[3].vertexCenter)), this.vertexCenter, vertices.find(it => it.equals(this._edges[2].vertexCenter))),
    ]
  }

  relaxOffset() {
    let vector = v3()
    let vector_0 = v3()

    vector_0.set(this._vertices[0].curPos)
    for (let i = 1; i < this._vertices.length; ++i) {
      Vec3.rotateY(vector, this._vertices[i].curPos, this._vertexCenter.curPos, math.toRadian(90 * i))
      vector_0.add(vector)
    }

    vector_0.multiplyScalar(1 / this._vertices.length)

    for (let i = 0; i < this._vertices.length; ++i) {
      Vec3.rotateY(vector, vector_0, this._vertexCenter.curPos, math.toRadian(-90 * i))
        .subtract(this._vertices[i].curPos)
        .multiplyScalar(0.1)
      this._vertices[i].offset.add(vector)
      this._vertices[i].relax()
    }
  }
}

export class MapCube extends MapShape {

  private _idx: string
  get idx() { return this._idx }
  private _quad: MapQuad
  private _y: number = 0.0
  private _martix = 0b00000000
  get martix() { return this._martix }

  constructor(quad: MapQuad, height: number) {
    super()
    this._quad = quad
    this._y = height
    this._idx = `${this._y}_${this._quad.vertexCenter.curPos.x}_${this._quad.vertexCenter.curPos.z}`

    this.updateCenter()

    quad.vertices.forEach(it => it.addCube(this))
  }

  get quad() { return this._quad }
  get height() { return this._y }

  updateCenter(): void {
    this._vertexCenter.set(this._quad.vertexCenter)
    this._vertexCenter.initPos.y = this._y + 0.5
    this._vertexCenter.curPos.y = this._y + 0.5
  }

  vertex(i: number) {
    return this._quad.vertex(i)
    // let vertex = this._quad.vertices.find(it => {
    //   switch (i) {
    //     case 0:
    //       return it.curPos.x - this._vertexCenter.curPos.x > 0 && it.curPos.z - this._vertexCenter.curPos.z > 0
    //     case 1:
    //       return it.curPos.x - this._vertexCenter.curPos.x < 0 && it.curPos.z - this._vertexCenter.curPos.z > 0
    //     case 2:
    //       return it.curPos.x - this._vertexCenter.curPos.x < 0 && it.curPos.z - this._vertexCenter.curPos.z < 0
    //     case 3:
    //       return it.curPos.x - this._vertexCenter.curPos.x > 0 && it.curPos.z - this._vertexCenter.curPos.z < 0
    //   }
    // })
    // if (vertex == null) console.log(i, this.quad.vertices, this._vertexCenter, vertex)
    // return vertex
  }

  updateMartix() {
    this._martix = 0
    console.log(this._quad.sortedIdx, this._quad.vertices.length)
    for (let i = 0; i < this._quad.sortedIdx.length; ++i) {
      this._martix |= this._quad.vertices[this._quad.sortedIdx[i]].isActive ? 1 << (3 - this._quad.sortedIdx[i]) : 0
    }

    // this._quad.vertices.forEach(it => {
    //   let offsetX = it.curPos.x - this._vertexCenter.curPos.x
    //   let offsetZ = it.curPos.z - this._vertexCenter.curPos.z

    //   let idx = 0
    //   if (offsetX > 0 && offsetZ > 0) idx = 0
    //   else if (offsetX < 0 && offsetZ > 0) idx = 1
    //   else if (offsetX < 0 && offsetZ < 0) idx = 2
    //   else if (offsetX > 0 && offsetZ < 0) idx = 3

    //   this._martix |= it.isActive ? 1 << (3 - idx) : 0
    // })
  }

}