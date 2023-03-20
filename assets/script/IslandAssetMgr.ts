import { Asset, Enum, Material, Prefab, resources, SpriteAtlas, SpriteFrame, Texture2D } from 'cc'

import TerrainGrassConfigs from './config/terrain.grass.config.json'
import TerrainSnowConfigs from './config/terrain.snow.config.json'
import TerrainDirtConfigs from './config/terrain.dirt.config.json'
import TerrainSkinnableConfigs from './config/trrain.skinnable.config.json'
import PropConfigs from './config/terrain.prop.config.json'
import { Terrain } from './model'
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
  private prefabs: Map<string, Prefab> = new Map()
  private materials: Map<string, Material> = new Map()
  private textures: Map<string, Asset> = new Map()
  private mtlNames: Set<string> = new Set()

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
    TerrainDirtConfigs.forEach(it=>{
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
    return this.configs.size + this.mtlNames.size * 2 + TextureConfigs.length
  }

  get preloadCount() {
    return this.prefabs.size + this.materials.size + this.textures.size
  }

  get isPreloaded() { return this.preloadCount == this.resouceCount }

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
  addPrefab(name: string, prefab: Prefab) { this.prefabs.set(name, prefab) }
  getPrefab(name: string) { return this.prefabs.get(name) }

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

    this.configs.forEach(it => {
      let path = ''
      switch (it.type) {
        case Terrain.ModelType.BlockDirt:
          path = 'dirt'
          break
        case Terrain.ModelType.BlockGrass:
          path = 'default'
          break
        case Terrain.ModelType.BlockSnow:
          path = 'snow'
          break
        case Terrain.ModelType.Skinnable:
          path = 'skinnable'
          break
        case Terrain.ModelType.Prop:
          path = 'prop'
          break
      }
      resources.load(`prefab/terrain/${path}/${it.name}`, Prefab, (err, prefab) => {
        this.addPrefab(it.name, prefab)
      })
    })

    this.mtlNames.forEach(it => {
      resources.load(`material/env/${it}`, Material, (err, mtl) => {
        this.addMaterial(it, mtl)
      })

      resources.load(`material/env/${it}-translucent`, Material, (err, mtl) => {
        this.addMaterial(`${it}-translucent`, mtl)
      })
    })


  }
}

export default IslandAssetMgr.instance()