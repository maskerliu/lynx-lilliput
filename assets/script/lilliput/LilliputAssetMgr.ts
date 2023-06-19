import { Asset, Material, PhysicMaterial, Prefab, resources } from 'cc'
import { AssetMgr } from '../common/AssetMgr'
import { BigWorld } from '../common/BigWorld'
import DecoratorConfigs from './config/terrain.decorator.config.json'
import GroundConfigs from './config/terrain.ground.config.json'
import PropConfigs from './config/terrain.prop.config.json'
import WeaponConfigs from './config/terrain.weapon.config.json'

export default class LilliputAssetMgr implements AssetMgr {
  private static _instance: LilliputAssetMgr

  private _mtls: Map<string | number, Material> = new Map()
  private textures: Map<string, Asset> = new Map()

  private groundConfigs: Array<BigWorld.ModelInfo> = GroundConfigs
  private propConfigs: Array<BigWorld.ModelInfo> = PropConfigs
  private weaponConfigs: Array<BigWorld.ModelInfo> = WeaponConfigs
  private decoratorConfigs: Array<BigWorld.ModelInfo> = DecoratorConfigs

  private _phyMtls: Map<string, PhysicMaterial> = new Map()
  private _terrains: Map<string, Prefab> = new Map()
  private _characters: Map<string, Prefab> = new Map()

  static get instance() {
    if (LilliputAssetMgr._instance == null) return new LilliputAssetMgr()
    else return LilliputAssetMgr._instance
  }

  private constructor() {
    LilliputAssetMgr._instance = this
  }

  get preloaded() { return this._mtls.size + this._phyMtls.size + this._terrains.size >= (3 + 5 + 2) }

  getModelConfig(id: number) {
    for (let item of this.groundConfigs) {
      if (item.id == id) return item
    }
    for (let item of this.propConfigs) {
      if (item.id == id) return item
    }
    for (let item of this.weaponConfigs) {
      if (item.id == id) return item
    }
    for (let item of this.decoratorConfigs) {
      if (item.id == id) return item
    }
  }

  getModelCongfigs(type: BigWorld.ModelGroup) {
    switch (type) {
      case BigWorld.ModelGroup.Ground:
        return GroundConfigs
      case BigWorld.ModelGroup.Prop:
        return PropConfigs
      case BigWorld.ModelGroup.Weapon:
        return WeaponConfigs
      case BigWorld.ModelGroup.Decorator:
        return DecoratorConfigs
    }
  }

  getTerrainPrefab(name: string) { return this._terrains.get(name) }
  addTerrainPrefab(name: string, prefab: Prefab) { this._terrains.set(name, prefab) }

  getCharacter(name: string) { return this._characters.get(name) }
  addCharacter(name: string, prefab: Prefab) { this._characters.set(name, prefab) }

  hasMaterial(name: number | string) { return this._mtls.has(name) }
  addMaterial(name: number | string, material: Material) {
    if (this._mtls.has(name)) return
    this._mtls.set(name, material)
  }
  getMaterial(name: string | number) { return this._mtls.get(name) }

  getPhyMtl(name: string) {
    return this._phyMtls.get(name)
  }

  hasTexture(name: string) { return this.textures.has(name) }
  getTexture<T>(name: string) { return this.textures.get(name) as T }
  addTexture<T extends Asset>(name: string, asset: T) { this.textures.set(name, asset) }

  preload() {

    resources.loadDir(`prefab/terrain/test`, Prefab, (err, assets) => {
      assets.forEach(it => { this._terrains.set(it.name, it) })
    })

    resources.load(`prefab/terrain/debug`, Prefab, (err, prefab) => {
      this._terrains.set('debug', prefab)
    })

    resources.load(`material/misc/translucent`, Material, (err, mtl) => {
      this._mtls.set('translucent', mtl)
    })

    resources.load(`material/misc/green`, Material, (err, mtl) => {
      this._mtls.set('green', mtl)
    })

    resources.load(`material/misc/heart`, Material, (err, mtl) => {
      this._mtls.set('heart', mtl)
    })

    resources.load(`material/physical/island`, PhysicMaterial, (err, mtl) => {
      this._phyMtls.set('island', mtl)
    })

    resources.load(`material/physical/terrain`, PhysicMaterial, (err, mtl) => {
      this._phyMtls.set('terrain', mtl)
    })

    resources.load(`material/physical/propDynamic`, PhysicMaterial, (err, mtl) => {
      this._phyMtls.set('propDynamic', mtl)
    })

    resources.load(`material/physical/propStatic`, PhysicMaterial, (err, mtl) => {
      this._phyMtls.set('propStatic', mtl)
    })

    resources.load(`material/physical/player`, PhysicMaterial, (err, mtl) => {
      this._phyMtls.set('player', mtl)
    })
  }
}