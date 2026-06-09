import { createElement, useState } from 'react'
import { useApp } from 'ink'
import { SCREENS } from '../constants/menuConfig.js'
import { useWorkspaceFeature } from './features/workspace/useWorkspaceFeature.js'
import { useAuthFeature } from './features/auth/useAuthFeature.js'
import { useJiraFeature } from './features/jira/useJiraFeature.js'
import { useGithubFeature } from './features/github/useGithubFeature.js'
import { useConfluenceFeature } from './features/confluence/useConfluenceFeature.js'
import { useGhaFeature } from './features/gha/useGhaFeature.js'
import { useMainMenuFeature } from './features/mainMenu/useMainMenuFeature.js'
import LoadingScreen from './common/screens/LoadingScreen.js'
import ErrorScreen from './common/screens/ErrorScreen.js'

const MainMenu = ({
  initialScreen = SCREENS.MAIN,
  workspaceRoot,
  probe,
  getTicket,
  findPrsForTicket,
  getPage,
  listRuns
} = {}) => {
  const { exit } = useApp()
  const [screen, setScreen] = useState(initialScreen)
  const [screenData, setScreenData] = useState({})
  const [loadingMessage, setLoadingMessage] = useState('')

  const navigateToMain = () => {
    setScreen(SCREENS.MAIN)
    setScreenData({})
  }

  const workspace = useWorkspaceFeature({
    setScreen,
    setScreenData,
    setLoadingMessage,
    navigateToMain,
    workspaceRoot
  })

  const auth = useAuthFeature({
    setScreen,
    setScreenData,
    setLoadingMessage,
    navigateToMain,
    ...(probe ? { probe } : {})
  })

  const jira = useJiraFeature({
    setScreen,
    setScreenData,
    setLoadingMessage,
    navigateToMain,
    ...(getTicket ? { getTicket } : {})
  })

  const github = useGithubFeature({
    setScreen,
    setScreenData,
    setLoadingMessage,
    navigateToMain,
    ...(findPrsForTicket ? { findPrsForTicket } : {})
  })

  const confluence = useConfluenceFeature({
    setScreen,
    setScreenData,
    setLoadingMessage,
    navigateToMain,
    ...(getPage ? { getPage } : {})
  })

  const gha = useGhaFeature({
    setScreen,
    setScreenData,
    setLoadingMessage,
    navigateToMain,
    ...(listRuns ? { listRuns } : {})
  })

  const mainMenu = useMainMenuFeature({
    setScreen,
    setScreenData,
    workspace,
    auth,
    jira,
    github,
    confluence,
    gha,
    exit
  })

  if (screen === SCREENS.LOADING) {
    return createElement(LoadingScreen, { message: loadingMessage })
  }
  if (screen === SCREENS.ERROR) {
    return createElement(ErrorScreen, {
      error: screenData.error,
      onReturn: navigateToMain
    })
  }

  const routes = {
    ...workspace.routes,
    ...auth.routes,
    ...jira.routes,
    ...github.routes,
    ...confluence.routes,
    ...gha.routes,
    ...mainMenu.routes
  }
  const route = routes[screen]
  if (!route) return null
  const props =
    typeof route.props === 'function' ? route.props(screenData) : route.props
  return createElement(route.component, props)
}

export default MainMenu
