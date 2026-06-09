import { SCREENS } from '../../../constants/menuConfig.js'
import MenuScreen from '../../common/screens/MenuScreen.js'

const MAIN_ITEMS = [
  { label: 'Workspace', value: 'workspace' },
  { label: 'Docker', value: 'docker' },
  { label: 'Start', value: 'start' },
  { label: 'Auth', value: 'auth' },
  { label: 'Jira', value: 'jira' },
  { label: 'GitHub', value: 'github' },
  { label: 'Confluence', value: 'confluence' },
  { label: 'GitHub Actions', value: 'gha' },
  { label: 'Quit', value: 'quit' }
]

export const useMainMenuFeature = ({
  workspace,
  auth,
  jira,
  github,
  confluence,
  gha,
  docker,
  start,
  exit
}) => {
  const handleMainSelect = (item) => {
    if (item.value === 'quit') return exit()
    if (item.value === 'workspace') return workspace.handleMainMenuSelect()
    if (item.value === 'docker') return docker.handleMainMenuSelect()
    if (item.value === 'start') return start.handleMainMenuSelect()
    if (item.value === 'auth') return auth.handleMainMenuSelect()
    if (item.value === 'jira') return jira.handleMainMenuSelect()
    if (item.value === 'github') return github.handleMainMenuSelect()
    if (item.value === 'confluence') return confluence.handleMainMenuSelect()
    if (item.value === 'gha') return gha.handleMainMenuSelect()
  }

  const routes = {
    [SCREENS.MAIN]: {
      component: MenuScreen,
      props: {
        title: 'tim',
        subtitle: 'Trade Imports CLI — choose a command group',
        items: MAIN_ITEMS,
        onSelect: handleMainSelect
      }
    }
  }

  return { routes }
}
