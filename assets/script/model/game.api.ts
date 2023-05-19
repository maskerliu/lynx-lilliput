import { Game } from '.'
import { RemoteAPI } from './api.const'
import { get, post } from './base.api'


export namespace GameApi {

  export function getIsland(islandId?: string, owner?: string) {
    return get<Game.Island>(RemoteAPI.Island.BasePath + RemoteAPI.Island.Info, { islandId, owner })
  }

  export function saveIsland(owner: string, mapInfo: Array<Game.MapItem>) {
    return post<Game.Island>(RemoteAPI.Island.BasePath + RemoteAPI.Island.Update, { owner, map: mapInfo })
  }

  export function enter(islandId: string) {
    return get<Game.Island>(RemoteAPI.Island.BasePath + RemoteAPI.Island.Enter, { islandId })
  }

  export function leave() {
    return post<Game.Island>(RemoteAPI.Island.BasePath + RemoteAPI.Island.Leave)
  }
}