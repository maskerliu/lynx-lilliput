import { Asset, Material, PhysicMaterial, Prefab, resources } from 'cc'
import { AssetMgr } from '../common/AssetMgr'
import { Terrain } from '../common/Terrain'
import TerrainItemConfigs from './config/terrain.default.config.json'
import PropConfigs from './config/terrain.prop.config.json'
import WeaponConfigs from './config/terrain.weapon.config.json'

class LilliputAssetMgr implements AssetMgr {
  private static _instance: LilliputAssetMgr

  private _mtls: Map<string | number, Material> = new Map()
  private textures: Map<string, Asset> = new Map()

  private terrainItemConfigs: Array<Terrain.ModelInfo> = TerrainItemConfigs
  private propConfigs: Array<Terrain.ModelInfo> = PropConfigs
  private weaponConfigs: Array<Terrain.ModelInfo> = WeaponConfigs

  private _phyMtls: Map<string, PhysicMaterial> = new Map()
  private _terrains: Map<string, Prefab> = new Map()
  private _characters: Map<string, Prefab> = new Map()

  static instance() {
    if (LilliputAssetMgr._instance == null) return new LilliputAssetMgr()
    else return LilliputAssetMgr._instance
  }

  private constructor() {
    LilliputAssetMgr._instance = this
  }

  get preloaded() { return this._mtls.size + this._phyMtls.size >= (3 + 5) }

  getModelConfig(name: string) {
    for (let item of this.terrainItemConfigs) {
      if (item.name == name) return item
    }
    for (let item of this.propConfigs) {
      if (item.name == name) return item
    }
    for (let item of this.weaponConfigs) {
      if (item.name == name) return item
    }
  }

  getModelCongfigs(type: Terrain.ModelGroup) {
    switch (type) {
      case Terrain.ModelGroup.Ground:
        return TerrainItemConfigs
      case Terrain.ModelGroup.Prop:
        return PropConfigs
      case Terrain.ModelGroup.Weapon:
        return WeaponConfigs
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

    // resources.loadDir<Material>(`material/terrain`, (err, data) => {
    //   data.forEach(it => {
    //     this.materials.set(it.uuid, it)
    //   })
    // })
  }
}

export default LilliputAssetMgr.instance()