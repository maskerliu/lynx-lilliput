import { RemoteAPI } from './api.const'
import { get, post } from './base.api'
import { Island } from './island.model'


export namespace IslandApi {

  export function getIsland(islandId?: string, owner?: string) {
    return get<Island.Island>(RemoteAPI.Island.BasePath + RemoteAPI.Island.Info, { islandId, owner })
  }

  export function save(info: Island.Island) {
    return post<Island.Island>(RemoteAPI.Island.BasePath + RemoteAPI.Island.Update, info)
  }

  export function enter(islandId: string) {
    return get<Island.Island>(RemoteAPI.Island.BasePath + RemoteAPI.Island.Enter, { islandId })
  }

  export function leave() {
    return post<Island.Island>(RemoteAPI.Island.BasePath + RemoteAPI.Island.Leave)
  }
}