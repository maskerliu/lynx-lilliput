import { ICollisionEvent, ITriggerEvent, Quat, _decorator, quat, v3 } from 'cc'
import TerrainItemMgr from '../TerrainItemMgr'

const { ccclass, property } = _decorator


@ccclass('FishPondMgr')
export default class FishPondMgr extends TerrainItemMgr {
  // private static ShowInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, true, [Terrain.ModelInteraction.Climb])
  // private static HideInteractEvent = new PropEvent(PropEvent.Type.ShowInteraction, false)

  private v3_dir = v3()
  private v3_pos = v3()
  private q_rotation = quat()

  // private fishes: Node[]


  private _frameCount = 0

  onLoad() {
    super.onLoad()
    // this.fishes = this.node.getChildByName('fishes').children

    // this.fishes.forEach(it => {
    //   it.getComponent(BoxCollider).on('onTriggerEnter', this.onTriggerEnter, this)
    // })
  }

  update(dt: number) {
    if (this._isSleep) return

    if (this._frameCount < 60) {
      this._frameCount++
    } else {
      this.updateFishRotation()
      this._frameCount = 0
    }

    // for (let i = 0; i < this.fishes.length; ++i) {
    //   this.v3_pos.set(this.fishes[i].position)
    //   this.v3_pos.add(this.fishes[i].forward.multiplyScalar(0.005))
    //   this.v3_pos.y = this.fishes[i].position.y
    //   this.fishes[i].position = this.v3_pos
    // }
  }


  protected lateUpdate(dt: number): void {
    
  }

  private onTriggerEnter(event: ITriggerEvent) {
    let fish = event.selfCollider.node

    if (event.otherCollider.node.name == 'buoy') {
      this.v3_pos = v3(Math.random() * 3, 0.06 + Math.random() * 0.4, Math.random() * 3)
      event.selfCollider.node.position = this.v3_pos
    }
    let angle = Quat.getAxisAngle(this.v3_dir, fish.rotation)
    Quat.fromAxisAngle(this.q_rotation, this.v3_dir, angle + Math.PI)
    fish.rotation = this.q_rotation

    // fish.forward = fish.forward.negative()

    // Quat.fromViewUp(this.q_rotation, fish.forward)
    // fish.rotation = this.q_rotation
    // fish.position = this.v3_pos
  }

  private onTriggerExit(event: ICollisionEvent) {
    if (event.otherCollider.node.name == 'myself') {
      // this.node.dispatchEvent(FishPondMgr.HideInteractEvent)
    }
  }

  private updateFishRotation() {
    // for (let i = 0; i < this.fishes.length; ++i) {
    //   let random = Math.random()
    //   let seed = Math.random() > 0.5 ? -1 : 1
    //   let angle = Quat.getAxisAngle(this.v3_dir, this.fishes[i].rotation)
    //   Quat.fromAxisAngle(this.q_rotation, this.v3_dir, angle + seed * random * 40 * Math.PI / 180)
    //   this.fishes[i].rotation = this.q_rotation
    //   // tween(this.fishes[i]).to(0.2, {rotation: this.q_rotation}).start()
    // }
  }
}

FishPondMgr.ItemName = 'fishPond'
