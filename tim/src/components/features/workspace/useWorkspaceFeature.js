import { SCREENS } from '../../../constants/menuConfig.js'
import { collectStatuses } from '../../../commands/workspace/status.js'
import { resolveWorkspaceRoot } from '../../../env/workspace-root.js'
import MenuScreen from '../../common/screens/MenuScreen.js'
import StatusOutputScreen from './screens/StatusOutputScreen.js'

const WORKSPACE_ITEMS = [
  { label: 'Status', value: 'status' },
  { label: 'Back', value: 'back' }
]

export const useWorkspaceFeature = ({
  setScreen,
  setScreenData,
  setLoadingMessage,
  navigateToMain,
  workspaceRoot
}) => {
  const runStatus = async () => {
    setLoadingMessage('Reading git status for every repo…')
    setScreen(SCREENS.LOADING)
    try {
      const root = resolveWorkspaceRoot({ explicit: workspaceRoot })
      const statuses = await collectStatuses(root)
      setScreenData({ statuses })
      setScreen(SCREENS.WORKSPACE_STATUS_OUTPUT)
    } catch (error) {
      setScreenData({ error: error.message ?? String(error) })
      setScreen(SCREENS.ERROR)
    }
  }

  const handleWorkspaceSelect = (item) => {
    if (item.value === 'back') return navigateToMain()
    if (item.value === 'status') return runStatus()
  }

  const handleMainMenuSelect = () => setScreen(SCREENS.WORKSPACE_MENU)

  const routes = {
    [SCREENS.WORKSPACE_MENU]: {
      component: MenuScreen,
      props: {
        title: 'Workspace',
        subtitle: 'Choose a workspace action',
        items: WORKSPACE_ITEMS,
        onSelect: handleWorkspaceSelect
      }
    },
    [SCREENS.WORKSPACE_STATUS_OUTPUT]: {
      component: StatusOutputScreen,
      props: (screenData) => ({
        statuses: screenData.statuses ?? [],
        onReturn: navigateToMain
      })
    }
  }

  return { routes, handleMainMenuSelect }
}
