export namespace RemoteAPI {

  export const User = {
    BasePath: '/user',
    ValidCheck: '/validCheck',
    Login: '/login',
    SignUp: '/signUp',
    Profile: '/profile/info',
    ProfileSave: '/profile/save',
    ProfileSearch: '/profile/search',
  }

  export const Island = {
    BasePath: '/island',
    Info: '/info',
    Update: '/update',
    Enter: '/enter',
    Leave: '/leave',
    Action: '/sync',
  }
}