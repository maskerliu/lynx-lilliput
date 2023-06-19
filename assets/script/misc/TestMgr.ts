import { Component, Node, Prefab, Vec3, _decorator, instantiate, resources, v3 } from 'cc'
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

  private v3_pos = v3()

  private prefabs: Map<number, Prefab> = new Map()

  private preloads = []
  private curPreload = -1

  protected onLoad(): void {

    info.info.forEach(it => {
      if (!this.preloads.includes(it[0])) this.preloads.push(it[0])
    })
    console.log(this.preloads)
    this.schedule(this.preload, 0.02)
    // 
  }


  preload() {
    if (this.prefabs.size <= this.curPreload) return
    this.curPreload++
    if (this.curPreload == this.preloads.length) return
    let config = LilliputAssetMgr.instance.getModelConfigById(this.preloads[this.curPreload])
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
}