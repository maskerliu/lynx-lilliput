import { Asset, Material } from 'cc'


export interface AssetMgr {

  hasMaterial(name: string): boolean
  addMaterial(name: string, material: Material): void
  getMaterial(name: string): Material

  hasTexture(name: string): boolean
  getTexture<T>(name: string): T
  addTexture<T extends Asset>(name: string, asset: T): void

  preload(): void
}