import { Event } from 'cc'

export namespace Lilliput {

  export class UIEvent extends Event {

    static Name = 'UIEvent'

    static Type = {
      UserInfoBind: 'OnUserInfoBind',
    }

    customData: any

    constructor(type: string, data?: any) {
      super(UIEvent.Name, true)
      this.type = type
      this.customData = data
    }
  }
}