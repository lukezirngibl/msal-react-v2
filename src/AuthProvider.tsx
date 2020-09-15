import React, { useEffect, ReactNode, useContext } from 'react'
import {
  PublicClientApplication,
  Configuration,
  AccountInfo,
} from '@azure/msal-browser'
import * as MicrosoftGraph from '@microsoft/microsoft-graph-client'

export enum AuthProviderState {
  Loading = 'Loading',
  Success = 'Success',
  Error = 'Error',
}

type RenderProps =
  | {
      account: AccountInfo
      state: AuthProviderState.Success
    }
  | {
      state: AuthProviderState.Loading
    }
  | {
      state: AuthProviderState.Error
    }

function onlyUnique(value: any, index: any, self: any) {
  return self.indexOf(value) === index
}

export const configureMsal = (params: {
  config: Configuration
  graphClientScopes?: Array<string>
  msalScopes?: Array<string>
}) => {
  const msalClient = new PublicClientApplication(params.config)
  const msalScopes = params.msalScopes || []
  const graphScopes = params.graphClientScopes || []

  const getAccessToken = async (scopes?: Array<string>) => {
    const account = msalClient.getAllAccounts()
    const { accessToken } = await msalClient.acquireTokenSilent({
      account: account[0],
      scopes: (scopes ? scopes : [...msalScopes, ...graphScopes]).filter(
        onlyUnique,
      ),
    })

    return accessToken
  }

  const useAccount = (): AccountInfo => {
    const account = useContext(Account)
    if (!account) {
      throw new Error(`PartnerSettings not found`)
    }
    return account
  }

  const Account = React.createContext<AccountInfo | null>(null)
  Account.displayName = 'PartnerSettings'

  const graphClient = MicrosoftGraph.Client.init({
    // Use the provided access token to authenticate
    // requests
    authProvider: (done: any) => {
      getAccessToken(graphScopes).then(token => {
        done(null, token)
      })
    },
  } as any)

  const AuthProvider = (props: {
    render: (params: RenderProps) => ReactNode
  }) => {
    const [authState, setAuthState] = React.useState(AuthProviderState.Loading)
    const [account, setAccount] = React.useState<AccountInfo>()

    const getUserProfile = async () => {
      // console.log('trying to get user profile')
      try {
        // Get the user's profile from Graph
        // const user = await graphClient.api('/me').get()
        // console.log('user: ', user)
        setAuthState(AuthProviderState.Success)
      } catch (err) {
        setAuthState(AuthProviderState.Error)
      }
    }

    const login = async () => {
      try {
        let tokenResponse = await msalClient.handleRedirectPromise()

        const accountObj = !!tokenResponse
          ? tokenResponse.account
          : msalClient.getAllAccounts()[0]

        if (accountObj && tokenResponse) {
          setAuthState(AuthProviderState.Success)
          setAccount(accountObj)
          // console.log('[AuthService.init] Got valid accountObj and tokenResponse')
        } else if (accountObj) {
          // console.log('[AuthService.init] User has logged in, but no tokens.')
          try {
            tokenResponse = await msalClient.acquireTokenSilent({
              account: msalClient.getAllAccounts()[0],
              scopes: msalScopes,
            })
          } catch (err) {
            await msalClient.acquireTokenRedirect({
              scopes: msalScopes,
            })
          }
        } else {
          // console.log(
          //   '[AuthService.init] No accountObject or tokenResponse present. User must now login.',
          // )
          await msalClient.loginRedirect({ scopes: msalScopes })
        }
      } catch (error) {
        setAuthState(AuthProviderState.Error)
        // console.error(
        //   '[AuthService.init] Failed to handleRedirectPromise()',
        //   error,
        // )
      }
    }

    useEffect(() => {
      const accounts = msalClient.getAllAccounts()

      // console.log('accounts: ', accounts)
      if (accounts && accounts.length > 0) {
        // Enhance user object with data from Graph
        setAccount(accounts[0])
        getUserProfile()
      } else {
        login()
      }
    }, [])

    if (!account) {
      return <>{props.render({ account, state: authState } as RenderProps)}</>
    }

    return (
      <Account.Provider value={account}>
        {props.render({ account, state: authState } as RenderProps)}
      </Account.Provider>
    )
  }

  return {
    msalClient,
    graphClient,
    AuthProvider,
    getAccessToken,
    msalScopes,
    graphScopes: params.graphClientScopes,
    useAccount,
  }
}
