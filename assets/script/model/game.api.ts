import { Game } from '.'
import { RemoteAPI } from './api.const'
import { get, post } from './base.api'


export namespace GameApi {

  export function getConfig() {
    
  }

  export function getIsland(islandId: string) {
    return get<Game.Island>(RemoteAPI.Game.BasePath + RemoteAPI.Game.Island, { islandId })
  }

  export function getUserIsland(uid:string) {
    return get<Game.Island>(RemoteAPI.Game.BasePath + RemoteAPI.Game.UserIsland, { uid })
  }

  export function saveIsland(mapInfo: Array<Game.MapItem>) {
    return post<Game.Island>(RemoteAPI.Game.BasePath + RemoteAPI.Game.IslandSave, mapInfo)
  }

  export function enter(islandId: string) {
    return get<Game.Island>(RemoteAPI.Game.BasePath + RemoteAPI.Game.IslandEnter, { islandId })
  }

  export function leave() {
    return post<Game.Island>(RemoteAPI.Game.BasePath + RemoteAPI.Game.IslandLeave)
  }
}