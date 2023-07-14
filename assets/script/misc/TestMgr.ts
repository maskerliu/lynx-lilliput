import { BatchingUtility, Component, Node, Prefab, Quat, UITransform, Vec3, _decorator, instantiate, quat, resources, v3 } from 'cc'
import info from '../lilliput.Island.json'
import LilliputAssetMgr from '../lilliput/LilliputAssetMgr'

const { ccclass, property } = _decorator

@ccclass('TestMgr')
export default class TestMgr extends Component {

  @property(Prefab)
  cubePrefab: Prefab

  @property(Prefab)
  groundPrefab: Prefab

  @property(Node)
  staticNode: Node

  @property(Node)
  dstNode: Node

  @property(Node)
  lighthouse: Node

  private v3_pos = v3()

  private prefabs: Map<number, Prefab> = new Map()

  private preloads = []
  private curPreload = -1

  protected onLoad(): void {
    // info.info.forEach(it => {
    //   if (!this.preloads.includes(it[0])) this.preloads.push(it[0])
    // })
    // console.log(this.preloads)
    // this.schedule(this.preload, 0.02)
    let arr = [5, 2, 8, 1, 4, 6, 11, 33, 3, 15]
    this.quickSort(arr, 0, arr.length - 1)
    console.log(arr)

    let treeNodes = []
    for (let i = 0; i < 5; ++i) {
      let node = new BinaryTreeNode(i)
      treeNodes.push(node)
    }

    treeNodes[0].left = treeNodes[1]
    treeNodes[1].right = treeNodes[2]
    treeNodes[1].left = treeNodes[3]
    treeNodes[3].right = treeNodes[4]

    console.log(this.treeHeight(treeNodes[0]))
    console.log(this.treeLevel(treeNodes[0]))

    // BatchingUtility.batchStaticModel(this.staticNode, this.dstNode)

    // console.log(this.lighthouse.worldPosition, this.lighthouse.position)
    // let pos = this.dstNode.getComponent(UITransform).convertToNodeSpaceAR(this.lighthouse.worldPosition)
    // console.log(pos)
    // this.lighthouse.parent = this.dstNode
    // this.lighthouse.position = pos
    let q = quat()

    Quat.rotateAround(q, this.lighthouse.rotation, v3(1, 0, 1).normalize(), Math.PI / 2)
    this.lighthouse.rotation = q

  }


  preload() {
    if (this.prefabs.size <= this.curPreload) return
    this.curPreload++
    if (this.curPreload == this.preloads.length) return
    let config = LilliputAssetMgr.instance.getModelConfig(this.preloads[this.curPreload])
    console.log(`load: ${config.name}[${this.curPreload}], cur prefabs: ${this.prefabs.size}`)
    resources.load(`prefab/terrain/env/${config.name}`, Prefab, (err, data) => {
      this.prefabs.set(config.id, data)
      if (this.prefabs.size == this.preloads.length) {
        console.log('finished', this.prefabs.size)
        this.initMap()
        this.unschedule(this.preload)
      }
    })
  }

  private exludes = [
    65,
    // 'fenceCorner',
    1,
    // 'bridge',
    // 'blockCurve',
    // 'platform',
    // 'tree',
    // 'blockCornerSmall',
    // 'poles',
    // 'doorLarge'
  ]

  private initMap() {
    for (let i = 0; i < info.info.length; ++i) {
      // if (this.exludes.includes(info.info[i][0]))
      this.addNode(this.prefabs.get(info.info[i][0]), i)
    }

    // BatchingUtility.batchStaticModel(this.staticNode, this.dstNode)

    // let mr = this.dstNode.getComponent(MeshRenderer)
    // console.log(mr)
  }

  private addNode(prefab: Prefab, i: number) {
    let cube = instantiate(prefab)
    cube.children[0].position = Vec3.ZERO
    this.v3_pos.set(info.info[i][1], info.info[i][2], info.info[i][3])
    cube.position = this.v3_pos
    this.staticNode.addChild(cube)
  }

  private partition(arr: Array<number>, left: number, right: number) {

    let midVal = arr[left]
    let tmp = 0
    let i = left + 1, j = right
    while (i < j) {
      while (i <= j && arr[i] <= midVal)
        ++i
      while (i <= j && arr[j] >= midVal)
        --j

      tmp = arr[i]
      arr[i] = arr[j]
      arr[j] = tmp
    }

    arr[left] = arr[j]
    arr[j] = midVal

    return j
  }

  quickSort(arr: Array<number>, left: number, right: number) {
    if (left < right) {
      let mid = this.partition(arr, left, right)
      this.quickSort(arr, left, mid - 1)
      this.quickSort(arr, mid + 1, right)
    }
  }

  treeHeight(tree: any) {
    if (tree == null) { return 0 }
    let rightHeight = 0, leftHeight = 0
    rightHeight = tree.right ? this.treeHeight(tree.right) : 0
    leftHeight = tree.left ? this.treeHeight(tree.left) : 0
    return Math.max(rightHeight, leftHeight) + 1
  }

  treeLevel(tree: BinaryTreeNode) {
    if (tree == null) return 0

    let level = 1
    let tmpArr = []
    tmpArr.push(tree)
    while (tmpArr.length > 0) {
      let node = tmpArr.pop()

      if (node.left || node.right) level++
      if (node.left) { tmpArr.push(node.left) }
      if (node.right) { tmpArr.push(node.right) }
    }

    return level
  }


  maxIsland(arr: Array<Array<number>>) {
    for (let i = 0; i < arr.length; ++i) {
      for (let j = 0; j < arr[i].length; ++j) {


      }
    }
  }

  private relative(arr: Array<Array<number>>, i: number, j: number) {

    if (arr[i + 1][j]) { this.relative(arr, i + 1, j) } // left
    if (arr[i - 1][j]) { this.relative(arr, i - 1, j) }
    if (arr[i][j + 1]) { this.relative(arr, i, j + 1) }
    if (arr[i][j - 1]) { this.relative(arr, i, j - 1) }
  }
}


class BinaryTreeNode {
  data: any
  left: BinaryTreeNode
  right: BinaryTreeNode

  constructor(data: any) { this.data = data }
}