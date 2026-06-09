import { SCREENS } from '../../../constants/menuConfig.js'
import { startService } from '../../../commands/start.js'
import { unmount } from '../../inkControl.js'
import MenuScreen from '../../common/screens/MenuScreen.js'

const START_ITEMS = [
  { label: 'Frontend (npm run dev)', value: 'frontend' },
  { label: 'Backend (mvn spring-boot:run)', value: 'backend' },
  { label: 'Admin (npm run dev)', value: 'admin' },
  { label: 'Back', value: 'back' }
]

const SERVICE_LABELS = {
  frontend: 'frontend dev server',
  backend: 'backend (Spring Boot)',
  admin: 'admin dev server'
}

const defaultLaunchService = async ({ workspaceRoot, service }) => {
  unmount()
  const result = await startService(workspaceRoot, service)
  process.exit(result.exitCode)
}

export const useStartFeature = ({
  setScreen,
  setScreenData,
  setLoadingMessage,
  navigateToMain,
  workspaceRoot,
  launchService = defaultLaunchService
}) => {
  const launch = async (service) => {
    setLoadingMessage(`Handing control to ${SERVICE_LABELS[service]}…`)
    setScreen(SCREENS.LOADING)
    try {
      await launchService({ workspaceRoot, service })
    } catch (error) {
      setScreenData({ error: error.message ?? String(error) })
      setScreen(SCREENS.ERROR)
    }
  }

  const handleStartSelect = (item) => {
    if (item.value === 'back') return navigateToMain()
    if (SERVICE_LABELS[item.value]) return launch(item.value)
  }

  const handleMainMenuSelect = () => setScreen(SCREENS.START_MENU)

  const routes = {
    [SCREENS.START_MENU]: {
      component: MenuScreen,
      props: {
        title: 'Start a service from source',
        subtitle: 'Choose a service — control passes to the running process',
        items: START_ITEMS,
        onSelect: handleStartSelect
      }
    }
  }

  return { routes, handleMainMenuSelect }
}
