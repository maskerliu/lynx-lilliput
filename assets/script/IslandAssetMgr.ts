import { Asset, Enum, instantiate, Material, Node, Prefab, resources, SpriteAtlas, SpriteFrame, Texture2D } from 'cc'

import TerrainGrassConfigs from './config/terrain.grass.config.json'
import TerrainSnowConfigs from './config/terrain.snow.config.json'
import TerrainDirtConfigs from './config/terrain.dirt.config.json'
import TerrainSkinnableConfigs from './config/trrain.skinnable.config.json'
import PropConfigs from './config/terrain.prop.config.json'
import { Game, Terrain } from './model'
import TextureConfigs from './config/textures.config.json'
export enum PhyEnvGroup {
  Default = 1 << 0,
  Terrain = 1 << 1,
  Prop = 1 << 2,
  Player = 1 << 3,
  Vehicle = 1 << 4,
  Test = 1 << 5,
}

Enum(PhyEnvGroup)

class IslandAssetMgr {
  private static _instance: IslandAssetMgr

  private configs: Map<string, Terrain.ModelConfig> = new Map()
  private prefabs: Map<string, Node> = new Map()
  private materials: Map<string, Material> = new Map()
  private textures: Map<string, Asset> = new Map()
  private mtlNames: Set<string> = new Set()

  private terrain: Node
  private props: Node

  static instance() {
    if (IslandAssetMgr._instance == null) return new IslandAssetMgr()
    else return IslandAssetMgr._instance
  }

  private constructor() {
    this.configs = new Map()
    TerrainGrassConfigs.forEach(it => {
      this.configs.set(it.name, it)
      it.material?.forEach(mtl => { this.mtlNames.add(mtl) })
    })
    TerrainDirtConfigs.forEach(it => {
      this.configs.set(it.name, it)
      it.material?.forEach(mtl => { this.mtlNames.add(mtl) })
    })
    TerrainSnowConfigs.forEach(it => {
      this.configs.set(it.name, it)
      it.material?.forEach(mtl => { this.mtlNames.add(mtl) })
    })
    TerrainSkinnableConfigs.forEach(it => {
      this.configs.set(it.name, it)
      it.material?.forEach(mtl => { this.mtlNames.add(mtl) })
    })
    PropConfigs.forEach(it => {
      this.configs.set(it.name, it)
      it.material?.forEach(mtl => { this.mtlNames.add(mtl) })
    })

    IslandAssetMgr._instance = this
  }

  get resouceCount() {
    return 2 + this.mtlNames.size * 2 //+ TextureConfigs.length
  }

  get preloadCount() {
    return this.materials.size + (this.props ? 1 : 0) + (this.terrain ? 1 : 0)//+ this.textures.size
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
    }
  }

  hasPrefab(name: string) { return this.prefabs.has(name) }
  getPrefab(name: string) {
    if (!this.configs.has(name)) return null

    let config = this.configs.get(name)
    switch (config.type) {
      case Terrain.ModelType.Prop:
        return this.props.getChildByName(name)
      case Terrain.ModelType.BlockDirt:
      case Terrain.ModelType.BlockGrass:
      case Terrain.ModelType.BlockSnow:
      case Terrain.ModelType.Skinnable:
        return this.terrain.getChildByName(name)
    }
  }

  hasMaterial(name: string) { return this.materials.has(name) }
  addMaterial(name: string, material: Material) { this.materials.set(name, material) }
  getMaterial(name: string) { return this.materials.get(name) }

  hasTexture(name: string) { return this.textures.has(name) }
  getTexture(name: string) { return this.textures.get(name) }
  addTexture(name: string, asset: Asset) { this.textures.set(name, asset) }


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

    let timestamp = new Date().getTime()
    resources.load('prefab/terrain/props', Prefab, (err, prefab) => {
      this.props = instantiate(prefab)
      console.log(`props cost:`, new Date().getTime() - timestamp)
    })

    resources.load('prefab/terrain/terrain', Prefab, (err, prefab) => {
      this.terrain = instantiate(prefab)
      console.log(`terrain cost:`, new Date().getTime() - timestamp)
    })

    resources.loadDir('material/env', Material, (err, assets) => {
      assets.forEach(it => { this.addMaterial(it.name, it) })
      console.log(`material cost:`, new Date().getTime() - timestamp)
    })
  }
}

export default IslandAssetMgr.instance()