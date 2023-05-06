import { Asset } from "cc"


class MafiaAssetMgr {


  private static _instance:MafiaAssetMgr
  private textures: Map<string, Asset> = new Map()

  static instance() {
    if (MafiaAssetMgr._instance == null) return new MafiaAssetMgr()
    else return MafiaAssetMgr._instance
  }

  private constructor() {
     
    MafiaAssetMgr._instance = this
  }

  hasTexture(name: string) { return this.textures.has(name) }
  getTexture(name: string) { return this.textures.get(name) }
  addTexture(name: string, asset: Asset) { this.textures.set(name, asset) }

  
}