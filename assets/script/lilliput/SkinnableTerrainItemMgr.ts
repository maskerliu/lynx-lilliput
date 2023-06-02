import { MeshRenderer, Node, Prefab, Vec3, _decorator, instantiate, resources } from 'cc'
import { Island } from '../model'
import LilliputAssetMgr from './LilliputAssetMgr'
import TerrainItemMgr from './TerrainItemMgr'


const { ccclass, property } = _decorator

@ccclass('SkinnableTerrainItemMgr')
export default class SkinnableTerrainItemMgr extends TerrainItemMgr {

  private ground: Node
  private groundMeshRenderer: MeshRenderer
  private groundMtls: string[]

  init(info: Island.MapItem) {
    super.init(info)
    this.updateSkin(this._info.skin)
    return this
  }

  updateSkin(skin?: Island.MapItemSkin) {

    if (this._info.skin == skin && this.ground) return

    this._info.skin = skin

    let prefabName = null
    switch (this._info.skin) {
      case Island.MapItemSkin.Dirt:
        break
      case Island.MapItemSkin.Snow:
        prefabName = this.config.skins.find((it) => it.includes('Snow'))
        break
      default:
        prefabName = this.config.skins.find((it) => it.includes('Grass'))
        break
    }

    if (this.ground) {
      this.ground.destroy()
      this.ground = null
    }

    if (prefabName == null) return

    let prefab = LilliputAssetMgr.getTerrainPrefab(prefabName)
    if (prefab == null) {
      resources.load(`prefab/terrain/env/${prefabName}`, Prefab, (err, data) => {
        LilliputAssetMgr.addTerrainPrefab(prefabName, data)
        this.initGround(prefabName, data)
      })
    } else {
      this.initGround(prefabName, prefab)
    }
  }

  private initGround(prefabName: string, prefab: Prefab) {

    if (prefab == null) {
      console.log(prefabName)
      return
    }
    this.ground = instantiate(prefab)
    this.ground.getChildByName(prefabName).position = Vec3.ZERO
    this.groundMeshRenderer = this.ground.getChildByName(prefabName).getComponent(MeshRenderer)
    this.groundMeshRenderer.materials.forEach(it => {
      LilliputAssetMgr.addMaterial(it.parent.uuid, it.parent)
    })
    this.groundMtls = this.groundMeshRenderer.materials.map(it => { return it.parent.uuid })
    for (let i = 0; i < this.groundMtls.length; ++i) {
      this.groundMeshRenderer.setMaterial(LilliputAssetMgr.getMaterial(this.groundMtls[i]), i)
    }

    this.node.getChildByName(this.info.prefab).addChild(this.ground)
  }

  translucent(did: boolean) {
    if (this.isTranslucent == did) return

    for (let i = 0; i < this.mtls.length; ++i) {
      let name = !this.isTranslucent && did ? 'translucent' : this.mtls[i]
      this.meshRenderer.setMaterial(LilliputAssetMgr.getMaterial(name), i)
    }

    for (let i = 0; i < this.groundMtls.length; ++i) {
      let name = !this.isTranslucent && did ? 'translucent' : this.groundMtls[i]
      this.groundMeshRenderer.setMaterial(LilliputAssetMgr.getMaterial(name), i)
    }

    this.isTranslucent = did
  }

}