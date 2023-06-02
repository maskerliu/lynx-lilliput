import { Island } from '.'
import { RemoteAPI } from './api.const'
import { get, post } from './base.api'


export namespace IslandApi {

  export function getIsland(islandId?: string, owner?: string) {
    return get<Island.Island>(RemoteAPI.Island.BasePath + RemoteAPI.Island.Info, { islandId, owner })
  }

  export function saveIsland(owner: string, mapInfo: Array<Island.MapItem>) {
    return post<Island.Island>(RemoteAPI.Island.BasePath + RemoteAPI.Island.Update, { owner, map: mapInfo })
  }

  export function enter(islandId: string) {
    return get<Island.Island>(RemoteAPI.Island.BasePath + RemoteAPI.Island.Enter, { islandId })
  }

  export function leave() {
    return post<Island.Island>(RemoteAPI.Island.BasePath + RemoteAPI.Island.Leave)
  }
}