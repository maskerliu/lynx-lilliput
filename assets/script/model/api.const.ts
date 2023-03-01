export namespace RemoteAPI {

  export const Common = {
    BasePath: '/common',
    AppConfig: '/appConfig',
    DBMgrDBs: '/dbmgr/dbs',
    DBMgrDBDocs: '/dbmgr/doc/all',
    DBMgrDBDocUpdate: '/dbmgr/doc/update',
    DBMgrDBDocDelete: '/dbmgr/doc/delete',
  }

  export const User = {
    BasePath: '/user',
    Login: '/login',
    Register: '/register',
    Contact: '/contact',
    Search: '/search',
    ProfileSave: '/profile/save',
    ProfileInfo: '/profile/info',
    ProfileSearch: '/profile/search',
    GradeConfig: '/grade/config',
    UserGrade: '/grade/info',
  }

  export const IOT = {
    BasePath: '/iot',
    DeviceSearch: '/device/search',
    DeviceInfo: '/device/info',
    DeviceSave: '/device/save',
    DeviceDelete: '/device/remove',
  }

  export const Organization = {
    BasePath: '/organization',
    CompanySearch: '/company/search',
    CompanyInfo: '/company/info',
    CompanySave: '/company/save',
    RoleAll: '/company/role/all',
    RoleSave: '/company/role/save',
    RoleDelete: '/company/role/delete',
    PagedOperators: '/company/operator/paged',
    Operator: '/company/operator/info',
    OperatorSave: '/company/operator/save',
    OperatorDelete: '/company/operator/delete',
  }

  export const IM = {
    BasePath: '/im',
    MyEmojis: '/myEmojis',
    EmojiAdd: '/emoji/add',
    EmojiDel: '/emoji/del',
    EmojiReorder: '/emoji/reorder',
    SyncFrom: '/sync/get',
    BulkSyncFrom: '/sync/bulkGet',
    SyncTo: '/sync/save',
    SendMsg: '/sendMsg',
    GetOfflineMessages: '/sync/messages',
    CreateRedPacket: '/redpacket/create',
    ClaimRedPacket: '/redpacket/claim',
    ClaimedRedPackets: '/redpacket/claimed'
  }

  export const Chatroom = {
    BasePath: '/room',
    MyRooms: '/myRooms',
    RoomInfo: '/info', // 房间基础信息
    RoomSave: '/save',
    RoomDelete: '/delete',
    SeatRequests: '/seatRequests',
    SeatReq: '/seatReq',
    SeatMgr: '/seatMgr', // 抱上麦
    Collect: '/collect', // （取消）收藏频道
    Emojis: '/emojis',
    Gifts: '/gifts', // 礼物信息
    Enter: '/enter',
    Leave: '/leave',
    Reward: '/reward',
    SendMsg: '/sendMsg',
    PropStore: '/propStore',
    BuyProp: '/propStore/buy',
    UseProp: '/useProp',
    MyProps: '/myProps',
  }

  export const Timeline = {
    BasePath: '/timeline',
    Posts: '/posts',
    PostPub: '/post/pub',
    PostDel: '/post/del',
    Moments: '/moments',
    MomentPub: '/moment/pub',
    MomentDel: '/moment/del',
    MomentLike: '/moment/like',
    Comments: '/comments', // 评论
    CommentPub: '/comment/pub', // 发表评论
    CommentDel: '/comment/del', // 删除评论
  }

  export const Square = {
    BasePath: '/square',
    Recommend: '/recommend',
    MyCollections: '/myCollections',
  }

  export const Payment = {
    BasePath: '/payment',
    MyWallet: '/myWallet',
    RechargeConfig: '/rechargeConfig',
    Recharge: '/recharge', // 充值
    ExchangeConfig: '/exchangeConfig',
    Exchange: '/exchange', // 魅力值兑换钻石,
    PurseRecords: '/purseRecords'
  }

  export const VIP = {
    BasePath: '/vip',
    Config: '/config',
    MyVIP: '/my',
    Buy: '/buy'
  }

  export const Game = {
    BasePath: '/game',
    Config: '/config',
    Island: '/island',
    UserIsland: '/island/user',
    IslandSave: '/island/save',
    IslandEnter: '/island/enter',
    IslandLeave: '/island/leave',
    IslandAction: '/island/sync',
  }
}