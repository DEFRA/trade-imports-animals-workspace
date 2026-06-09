import { SCREENS } from '../../../constants/menuConfig.js'
import { createGhaClient } from '../../../clients/gha-client.js'
import MenuScreen from '../../common/screens/MenuScreen.js'
import InputScreen from '../../common/screens/InputScreen.js'
import RunsResultScreen from './screens/RunsResultScreen.js'

const GHA_ITEMS = [
  { label: 'Recent workflow runs for a repo', value: 'runs' },
  { label: 'Back', value: 'back' }
]

const defaultListRuns = (repo) => createGhaClient().listRuns(repo)

export const useGhaFeature = ({
  setScreen,
  setScreenData,
  setLoadingMessage,
  navigateToMain,
  listRuns = defaultListRuns
}) => {
  const fetchRuns = async (repo) => {
    setLoadingMessage(`Fetching recent workflow runs for ${repo}…`)
    setScreen(SCREENS.LOADING)
    try {
      const runs = await listRuns(repo)
      setScreenData({ repo, runs })
      setScreen(SCREENS.GHA_RUNS_RESULT)
    } catch (error) {
      setScreenData({ error: error.message ?? String(error) })
      setScreen(SCREENS.ERROR)
    }
  }

  const handleGhaSelect = (item) => {
    if (item.value === 'back') return navigateToMain()
    if (item.value === 'runs') return setScreen(SCREENS.GHA_RUNS_INPUT)
  }

  const handleMainMenuSelect = () => setScreen(SCREENS.GHA_MENU)

  const routes = {
    [SCREENS.GHA_MENU]: {
      component: MenuScreen,
      props: {
        title: 'GitHub Actions',
        subtitle: 'Choose a GitHub Actions query',
        items: GHA_ITEMS,
        onSelect: handleGhaSelect
      }
    },
    [SCREENS.GHA_RUNS_INPUT]: {
      component: InputScreen,
      props: {
        title: 'GitHub Actions',
        subtitle: 'Recent workflow runs for a repo',
        label: 'Repo name',
        placeholder: 'trade-imports-animals-frontend',
        onSubmit: fetchRuns,
        onCancel: navigateToMain
      }
    },
    [SCREENS.GHA_RUNS_RESULT]: {
      component: RunsResultScreen,
      props: (screenData) => ({
        repo: screenData.repo,
        runs: screenData.runs ?? [],
        onReturn: navigateToMain
      })
    }
  }

  return { routes, handleMainMenuSelect }
}
