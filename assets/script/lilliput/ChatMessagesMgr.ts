import { Component, Prefab, Node, _decorator, instantiate, Button, tween, v3, Sprite, SpriteAtlas } from 'cc'

const { ccclass, property } = _decorator


@ccclass('ChatMessagesMgr')
export default class ChatMessagesMgr extends Component {

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
  }

  private show() {
    let position = v3(this.node.position)
    if (position.x == 290) {
      position.x = -250
      tween(this.node).to(0.5, { position }, {
        easing: 'bounceOut',
        onComplete: () => {
          this.showBtn.position = v3(300, 167, 0)
          this.showBtn.getChildByName('Icon').getComponent(Sprite).spriteFrame = this.uiAtlas.getSpriteFrame('larger')
        }
      }).start()
    } else {
      this.showBtn.position = v3(198, 167, 0)
      this.showBtn.getChildByName('Icon').getComponent(Sprite).spriteFrame = this.uiAtlas.getSpriteFrame('smaller')
      position.x = 290
      tween(this.node).to(0.5, { position }, { easing: 'bounceOut' }).start()
    }
  }

}