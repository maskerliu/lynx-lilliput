import { Button, Component, Node, Prefab, Sprite, SpriteAtlas, _decorator, instantiate, tween, v3 } from 'cc'

const { ccclass, property } = _decorator


@ccclass('ChatMessagesMgr')
export default class ChatMessagesMgr extends Component {

  private v3_pos = v3()

  @property(Node)
  private showBtn: Node

  @property(Prefab)
  private msgPrefab: Prefab

  @property(SpriteAtlas)
  private uiAtlas: SpriteAtlas

  private messages: Array<Node> = []

  protected onLoad(): void {
    this.showBtn.on(Button.EventType.CLICK, this.show, this)

    for (let i = 0; i < 8; ++i) {
      let msg = instantiate(this.msgPrefab)
      this.messages.push(msg)
    }
    this.v3_pos.set(this.node.position)
    this.v3_pos.x = 290
    this.node.position = this.v3_pos
    this.show()
  }

  private show() {
    this.v3_pos.set(this.node.position)
    if (this.node.position.x == 290) {
      this.v3_pos.x = -250
      tween(this.node).to(0.5, { position: this.v3_pos }, {
        easing: 'bounceOut',
        onComplete: () => {
          this.v3_pos.set(300, 167, 0)
          this.showBtn.position = this.v3_pos
          this.showBtn.getChildByName('Icon').getComponent(Sprite).spriteFrame = this.uiAtlas.getSpriteFrame('larger')
        }
      }).start()
    } else {
      this.node.active = true
      this.showBtn.position = v3(198, 167, 0)
      this.showBtn.getChildByName('Icon').getComponent(Sprite).spriteFrame = this.uiAtlas.getSpriteFrame('smaller')
      this.v3_pos.x = 290
      tween(this.node).to(0.5, { position: this.v3_pos }, { easing: 'bounceOut' }).start()
    }
  }

}