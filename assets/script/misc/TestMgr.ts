import { BatchingUtility, Component, Node, _decorator } from 'cc'

const { ccclass, property } = _decorator

@ccclass('TestMgr')
export default class TestMgr extends Component {

  @property(Node)
  staticNode: Node

  @property(Node)
  dstNode: Node

  protected onLoad(): void {

    BatchingUtility.batchStaticModel(this.staticNode, this.dstNode)
  }

}