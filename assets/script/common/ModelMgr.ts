import { Prefab } from 'cc'
import LilliputAssetMgr from '../lilliput/LilliputAssetMgr'
import LilliputMgr from '../lilliput/LilliputMgr'


export class Model {

  static Axis_X = 0b001
  static Axis_Y = 0b010
  static Axis_Z = 0b100


  name: string
  prefab: Prefab
  rotation: number
  axis: number
  flip: number

  constructor(name: string, prefab: Prefab, rotation: number, axis: number, flip: number) {
    this.name = name
    this.prefab = prefab
    this.rotation = rotation
    this.axis = axis
    this.flip = flip
  }
}

export class ModelMgr {

  private static _instance: ModelMgr
  static get instance() {
    if (ModelMgr._instance == null) { ModelMgr._instance = new ModelMgr() }
    return ModelMgr._instance
  }

  private models: Map<string, Array<Model>> = new Map()

  private constructor() {
    this.importModel()
  }

  importModel() {
    for (let i = 1; i < 255; ++i) {
      let key = ('00000000' + i.toString(2)).slice(-8)
      if (this.models.size == 254) break
      for (let flip = 0; flip <= 7; ++flip) {
        if (this.models.size == 254) break
        let keyFlip = this.flip(key, flip)
        for (let axis = 1; axis <= 8; axis <<= 1) {
          if (this.models.size == 254) break
          for (let rotate = 0; rotate < 4; ++rotate) {
            if (this.models.size == 254) break
            let keyRotate = this.rotate(keyFlip, rotate, axis)
            if (!this.models.has(keyRotate))
              this.models.set(keyRotate, [new Model(keyRotate, LilliputAssetMgr.instance.getTerrainPrefab(key), rotate, axis, flip)])
          }
        }
      }
    }

    // console.log(this.models)

    // this.models.forEach(it => {
    //   console.log(it[0].flip)
    // })

    // let dif = new Map<number, Set<string>>()
    // this.models.forEach(it => {
    //   try {
    //     let key = it[0].prefab.name.split('1').length - 1
    //     if (!dif.has(key)) { dif.set(key, new Set()) }
    //     let keys = dif.get(key)
    //     keys.add(it[0].prefab.name)
    //   } catch (err) {
    //     console.error(err, it)
    //   }

    // })
    // console.log(dif)
  }

  private rotate(name: string, rotation: number, axis: number) {
    let result = name
    if (rotation == 0) return result

    if (axis & LilliputMgr.Axis_Y) {
      result = name
    } else if (axis & LilliputMgr.Axis_X) {
      result = name[0] + name[3] + name[7] + name[4] + name[1] + name[2] + name[6] + name[5]
    } else if (axis & LilliputMgr.Axis_Z) {
      name[0] + name[4] + name[5] + name[1] + name[3] + name[7] + name[6] + name[2]
    }
    return result.substring(rotation, 4) + result.substring(0, rotation) + result.substring(rotation + 4, 8) + result.substring(4, rotation + 4)
  }

  private flip(name: string, axis: number) {
    let result: string = name
    if (axis & LilliputMgr.Axis_X) {
      result = result[1] + result[0] + result[3] + result[2] + result[5] + result[4] + result[7] + result[6]
    }

    if (axis & LilliputMgr.Axis_Z) {
      result = result[3] + result[2] + result[1] + result[0] + result[7] + result[6] + result[5] + result[4]
    }

    if (axis & LilliputMgr.Axis_Y) {
      result = result[4] + result[5] + result[6] + result[7] + result[0] + result[1] + result[2] + result[3]
    }

    return result
  }


  getModel(martix: number) {
    return this.models.get(('00000000' + martix.toString(2)).slice(-8))
  }
}

export class Slot {

}