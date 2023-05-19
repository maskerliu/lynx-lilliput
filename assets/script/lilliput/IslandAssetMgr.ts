import {
  Asset, instantiate, Material, Node,
  Prefab, resources, SpriteAtlas, SpriteFrame, Texture2D
} from 'cc'
import { AssetMgr } from '../common/AssetMgr'
import { Terrain } from '../model'
import TerrainDirtConfigs from './config/terrain.dirt.config.json'
import TerrainGrassConfigs from './config/terrain.grass.config.json'
import MiscConfigs from './config/terrain.mis.config.json'
import PropConfigs from './config/terrain.prop.config.json'
import TerrainSnowConfigs from './config/terrain.snow.config.json'
import WeaponConfigs from './config/terrain.weapon.config.json'
import TextureConfigs from './config/textures.config.json'
import TerrainSkinnableConfigs from './config/trrain.skinnable.config.json'



class IslandAssetMgr implements AssetMgr {
  private static _instance: IslandAssetMgr

  private configs: Map<string, Terrain.ModelConfig> = new Map()
  private materials: Map<string | number, Material> = new Map()
  private textures: Map<string, Asset> = new Map()

  private _env: Node
  set env(val: Node) { this._env = val }

  private characters: Node

  static instance() {
    if (IslandAssetMgr._instance == null) return new IslandAssetMgr()
    else return IslandAssetMgr._instance
  }

  private constructor() {
    this.configs = new Map()
    TerrainGrassConfigs.forEach(it => {
      this.configs.set(it.name, it)
    })
    TerrainDirtConfigs.forEach(it => {
      this.configs.set(it.name, it)
    })
    TerrainSnowConfigs.forEach(it => {
      this.configs.set(it.name, it)
    })
    TerrainSkinnableConfigs.forEach(it => {
      this.configs.set(it.name, it)
    })
    PropConfigs.forEach(it => {
      this.configs.set(it.name, it)
    })
    WeaponConfigs.forEach(it => {
      this.configs.set(it.name, it)
    })

    MiscConfigs.forEach(it => { this.configs.set(it.name, it) })

    IslandAssetMgr._instance = this
  }

  get resouceCount() {
    return TextureConfigs.length + 1
  }

  get preloadCount() {
    return this.textures.size + (this.characters == null ? 0 : 1)
  }

  get isPreloaded() { return this.preloadCount >= this.resouceCount }

  getModelConfig(name: string) {
    return this.configs.get(name)
  }

  getModelCongfigs(type: Terrain.ModelType) {
    switch (type) {
      case Terrain.ModelType.BlockGrass:
        return TerrainGrassConfigs
      case Terrain.ModelType.BlockSnow:
        return TerrainSnowConfigs
      case Terrain.ModelType.BlockDirt:
        return TerrainDirtConfigs
      case Terrain.ModelType.Skinnable:
        return TerrainSkinnableConfigs
      case Terrain.ModelType.Prop:
        return PropConfigs
      case Terrain.ModelType.Weapon:
        return WeaponConfigs
    }
  }

  hasPrefab(name: string) { return this.configs.has(name) }
  getPrefab(name: string) {
    let config = this.configs.get(name)
    return this._env.getChildByName(name)
  }

  getCharacter(uid: string) {
    let name: string = null
    switch (uid) {
      case '8f4e7438-4285-4268-910c-3898fb8d6d96':
        name = 'puppet'
        // skin = null
        // skin = 'cyborgFemaleA'
        break
      case 'f947ed55-7e34-4a82-a9db-8a9cf6f2e608':
        name = 'hotdog'
        // skin = null
        // skin = 'criminalMaleA'
        break
      case '5ee13634-340c-4741-b075-7fe169e38a13':
        name = 'human'
        // skin = 'criminalMaleA'
        break
      case '4e6434d1-5910-46c3-879d-733c33ded257':
        name = 'hoboRat'
        // skin = 'humanMaleA'
        break
      case 'b09272b8-d6a4-438b-96c3-df50ac206706':
        name = 'human'
        // skin = 'skaterMaleA'
        break
      default:
        name = 'human'
        // skin = 'zombieA'
        break
    }
    return this.characters.getChildByName(name)

  }

  hasMaterial(name: number | string) { return this.materials.has(name) }
  addMaterial(name: number | string, material: Material) {
    if (this.materials.has(name)) return
    this.materials.set(name, material)
  }
  getMaterial(name: string | number) { return this.materials.get(name) }

  hasTexture(name: string) { return this.textures.has(name) }
  getTexture<T>(name: string) { return this.textures.get(name) as T }
  addTexture<T extends Asset>(name: string, asset: T) { this.textures.set(name, asset) }

  preload() {
    TextureConfigs.forEach(it => {
      switch (it.type) {
        case Terrain.AssetType.Texture:
          resources.load(`${it.path}${it.name}/texture`, Texture2D, (err, texture) => {
            this.textures.set(it.name, texture)
          })
          break
        case Terrain.AssetType.SpriteFrame:
          resources.load(`${it.path}${it.name}/spriteFrame`, SpriteFrame, (err, sprite) => {
            this.textures.set(it.name, sprite)
          })
          break
        case Terrain.AssetType.SpriteAtlas:
          resources.load(`${it.path}${it.name}`, SpriteAtlas, (err, sprite) => {
            this.textures.set(it.name, sprite)
          })
          break
      }
    })

    let timestamp = Date.now()

    // resources.load('prefab/terrain/env', Prefab, (err, prefab) => {
    //   this.env = instantiate(prefab)
    //   console.log(`env cost:`, Date.now() - timestamp)
    // })

    resources.load('prefab/character/characters', Prefab, (err, prefab) => {
      this.characters = instantiate(prefab)
      console.log(`characters cost:`, Date.now() - timestamp)
    })
  }
}

export default IslandAssetMgr.instance()