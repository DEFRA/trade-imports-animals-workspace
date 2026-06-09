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

const PLACEHOLDER_LABELS = {
  docker: 'Docker',
  start: 'Start',
  auth: 'Auth',
  jira: 'Jira',
  github: 'GitHub',
  confluence: 'Confluence',
  gha: 'GitHub Actions'
}

export const useMainMenuFeature = ({
  setScreen,
  setScreenData,
  workspace,
  exit
}) => {
  const handleMainSelect = (item) => {
    if (item.value === 'quit') return exit()
    if (item.value === 'workspace') return workspace.handleMainMenuSelect()
    const label = PLACEHOLDER_LABELS[item.value]
    if (label) {
      setScreenData({
        error: `${label} isn't wired up in tim yet. Use the bash tooling under ../tools/ for now.`
      })
      setScreen(SCREENS.ERROR)
    }
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
