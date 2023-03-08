import { Asset, Enum, Material, Prefab, resources, SpriteAtlas, SpriteFrame, Texture2D } from 'cc'
import PropConfigs from './config/prop.config.json'
import TerrainConfigs from './config/terrain.config.json'
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

class TerrainAssetMgr {
  private static _instance: TerrainAssetMgr

  private configs: Map<string, Terrain.ModelConfig> = new Map()
  private prefabs: Map<string, Prefab> = new Map()
  private materials: Map<string, Material> = new Map()
  private textures: Map<string, Asset> = new Map()
  private mtlNames: Set<string> = new Set()

  static instance() {
    if (TerrainAssetMgr._instance == null) return new TerrainAssetMgr()
    else return TerrainAssetMgr._instance
  }

  private constructor() {
    this.configs = new Map()
    TerrainConfigs.forEach(it => {
      this.configs.set(it.name, it)
      it.material?.forEach(mtl => { this.mtlNames.add(mtl) })
    })
    PropConfigs.forEach(it => {
      this.configs.set(it.name, it)
      it.material?.forEach(mtl => { this.mtlNames.add(mtl) })
    })

    TerrainAssetMgr._instance = this
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
    return type == Terrain.ModelType.Ground ? TerrainConfigs as Array<Terrain.ModelConfig> : PropConfigs as Array<Terrain.ModelConfig>
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
      resources.load(`prefab/terrain/${it.name}`, Prefab, (err, prefab) => {
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

export default TerrainAssetMgr.instance()