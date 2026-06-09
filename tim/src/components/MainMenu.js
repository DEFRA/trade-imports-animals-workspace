import { createElement, useState } from 'react'
import { useApp } from 'ink'
import { SCREENS } from '../constants/menuConfig.js'
import { useWorkspaceFeature } from './features/workspace/useWorkspaceFeature.js'
import { useMainMenuFeature } from './features/mainMenu/useMainMenuFeature.js'
import LoadingScreen from './common/screens/LoadingScreen.js'
import ErrorScreen from './common/screens/ErrorScreen.js'

const MainMenu = ({ initialScreen = SCREENS.MAIN, workspaceRoot } = {}) => {
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

  const mainMenu = useMainMenuFeature({
    setScreen,
    setScreenData,
    workspace,
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

  const routes = { ...workspace.routes, ...mainMenu.routes }
  const route = routes[screen]
  if (!route) return null
  const props =
    typeof route.props === 'function' ? route.props(screenData) : route.props
  return createElement(route.component, props)
}

export default MainMenu
