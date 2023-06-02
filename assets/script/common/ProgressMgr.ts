import { Component, Node, Size, Sprite, SpriteAtlas, UITransform, Vec3, _decorator, size, v3 } from 'cc'

const { ccclass, property } = _decorator

const K_P_Low = 'squareRed'
const K_P_Mid = 'squareYellow'
const K_P_High = 'squareGreen'

@ccclass('ProgressMgr')
export default class ProgressMgr extends Component {


  @property(SpriteAtlas)
  private uiAtlas: SpriteAtlas

  private progressSize: Size = size()
  private indicator: Node
  private indicatorSize: Size = size()
  private indicatorPos: Vec3 = v3()


  private _progress = 0
  get progress() { return this._progress }
  set progress(val: number) {
    this._progress = val

    let fileName: string

    if (val / 100 < 0.4) {
      fileName = K_P_Low
    } else if (val / 100 < 0.7) {
      fileName = K_P_Mid
    } else {
      fileName = K_P_High
    }

    this.indicator.getComponent(Sprite).spriteFrame = this.uiAtlas.getSpriteFrame(fileName)

    this.indicatorSize.set(this.progressSize.width * val / 100, this.progressSize.height)
    this.indicatorPos.x = -this.progressSize.width / 2
    this.indicator.position = this.indicatorPos
    this.indicator.getComponent(UITransform).contentSize = this.indicatorSize
  }



  protected onLoad(): void {
    this.indicator = this.node.getChildByName('Indicator')
    this.indicator.getComponent(Sprite)
    this.progressSize = this.getComponent(UITransform).contentSize
  }
}