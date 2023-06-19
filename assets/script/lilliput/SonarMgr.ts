import { Collider, Component, ICollisionEvent, MeshRenderer, Node, Vec4, _decorator, director } from 'cc'

const { ccclass, property } = _decorator

// The number of rings that can be rendered at once.
// Must be the samve value as the array size in the shader.
const QueueSize = 20


@ccclass('SonarMgr')
export class SonarMgr extends Component {
  @property(Node)
  targets: Node = null!

  // All the renderers that will have the sonar data sent to their shaders.
  private ObjectRenderers: MeshRenderer[] = []

  // Throwaway values to set position to at the start.
  private static GarbagePosition: Vec4 = new Vec4(-5000, -5000, -5000, -5000)

  // Queue of start positions of sonar rings.
  // The xyz values hold the xyz of position.
  // The w value holds the time that position was started.
  private static positionsQueue: Vec4[] = []

  // Queue of intensity values for each ring.
  // These are kept in the same order as the positionsQueue.
  private static intensityQueue: Vec4[] = []

  // Make sure only 1 object initializes the queues.
  private static NeedToInitQueues = true

  start() {
    // Get renderers that will have effect applied to them
    this.ObjectRenderers = this.targets.getComponentsInChildren(MeshRenderer)

    if (SonarMgr.NeedToInitQueues) {
      SonarMgr.NeedToInitQueues = false
      // Fill queues with starting values that are garbage values
      for (let i = 0; i < QueueSize; i++) {
        SonarMgr.positionsQueue.push(SonarMgr.GarbagePosition)
        SonarMgr.intensityQueue.push(new Vec4(-5000))
      }
    }

    // 监听触发事件
    let collider = this.node.getComponent(Collider)
    collider.on('onCollisionEnter', this.OnCollisionEnter, this)
  }


  private OnCollisionEnter(event: ICollisionEvent) {
    let pos: Vec4 = new Vec4()
    event.contacts[0].getWorldPointOnA(pos)
    // Start sonar ring from the contact point
    this.sonarData(pos, 1.0)
  }

  private sonarData(position: Vec4, intensity: number) {

    // Put values into the queue
    position.w = director.root.cumulativeTime // (new Date()).getTime()
    SonarMgr.positionsQueue.splice(SonarMgr.positionsQueue.length - 1, 1)
    SonarMgr.positionsQueue.unshift(position)
    SonarMgr.intensityQueue.splice(SonarMgr.intensityQueue.length - 1, 1)
    SonarMgr.intensityQueue.unshift(new Vec4(intensity))

    // Send updated queues to the shaders
    this.ObjectRenderers.forEach(r => {
      r.material.setProperty("_hitPts", SonarMgr.positionsQueue)
      r.material.setProperty("_Intensity", SonarMgr.intensityQueue)
    })
  }
}


