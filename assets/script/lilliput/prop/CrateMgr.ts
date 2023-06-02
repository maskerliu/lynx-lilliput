import { BoxCollider, MeshRenderer, RigidBody, _decorator, v3 } from 'cc'
import { Game } from '../../model'
import LilliputAssetMgr from '../LilliputAssetMgr'
import TerrainItemMgr from '../TerrainItemMgr'

const { ccclass, property } = _decorator

@ccclass('CrateMgr')
export default class CrateMgr extends TerrainItemMgr {

  onLoad() {
    super.onLoad()

    this.rigidBody = this.getComponent(RigidBody)
    let collider = this.node.addComponent(BoxCollider)

    let minPos = v3(), maxPos = v3()
    this.node.getComponent(MeshRenderer).model.modelBounds.getBoundary(minPos, maxPos)
    collider.size = maxPos.subtract(minPos)
    collider.material = LilliputAssetMgr.getPhyMtl('propDynamic')
  }


  preview() {

  }

  interact(action: Game.CharacterState) {
    switch (action) {
      case Game.CharacterState.Lift:

        break
    }
  }

  // translucent(did: boolean) {
  // }
}

CrateMgr.ItemName = 'crate'