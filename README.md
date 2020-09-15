# MSAL React V2

MSAL V2 React integration helper. I made this library because:

1. I kept running into issues when trying to use react-aad-msal library in conjunction with the graphClient. Namely, I got the following error:
```
[ERROR] ClientAuthError: Token calls are blocked in hidden iframes
```
This was driving me crazy! I think this has something to do with the versioning mess between MSAL v1 and v2.

2. I had problems with MSAL's own tutorial implementation when using the loginRedirect functionality instead of loginPopup. The error I ran into was as follows:
```
interaction_in_progress: Interaction is currently in progress. Please ensure that this interaction has been completed before calling an interactive API.
```

The following approach has fixed these issues and made future implementations so much smoother!

### Install

```
yarn add msal-react-v2
```
```
npm install msal-react-v2
```

### Sample Usage

```ts

import { configureMsal, AuthProviderState } from 'msal-react-v2/lib/AuthProvider'

enum Scopes {
  OPEN_ID = 'openid',
  CUSTOM_SCOPE = 'api://XXXX-XXXX-XXXXXX-XXXXX/all',
  USER_READ = 'User.Read',
}

const config = {
  auth: {
    clientId: 'XXXXXX-XXXXXX-XXXXXX-XXXXX-XXXXX', // clientId or appId
    redirectUri: 'http://localhost:3000',         // redirectUri
    authority: undefined,                         // Optional
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  },
}

const {
  AuthProvider,   // Use once!
  getAccessToken, // Can use to inject access tokens elsewhere in your app
  msalClient,     // Use elsewhere for msalClient.logout() and other client functions
  graphClient,    // Use for graph client api calls
  useAccount,     // React Hook to give access to account info in child components
} = configureMsal({
  config,                                                // Required
  msalScopes: [Scopes.OPEN_ID, Scopes.CUSTOM_SCOPE],     // Optional (But Recommended)
  graphClientScopes: [                                   // Optional (But Recommended
    Scopes.USER_READ,
  ],
})

// I recommend having all the above ^^ in a separate MsalConfig.ts file

const App = () => (
  <AuthProvider
    render={({ state, account }) =>
      state === AuthProviderState.Success ? (
        <div>Logged in as {account.username} </div>
      ) : (
        <div>Loading..</div>
      )
    }
  />
);

```
