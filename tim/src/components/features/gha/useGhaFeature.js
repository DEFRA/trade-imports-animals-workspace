import { SCREENS } from '../../../constants/menuConfig.js'
import { createGhaClient } from '../../../clients/gha-client.js'
import MenuScreen from '../../common/screens/MenuScreen.js'
import InputScreen from '../../common/screens/InputScreen.js'
import RunsResultScreen from './screens/RunsResultScreen.js'
import RunStatusScreen from './screens/RunStatusScreen.js'
import WaitProgressScreen from './screens/WaitProgressScreen.js'

const GHA_ITEMS = [
  { label: 'Recent workflow runs for a repo', value: 'runs' },
  { label: 'Status of a single run', value: 'status' },
  { label: 'Wait for a run to finish', value: 'wait' },
  { label: 'Back', value: 'back' }
]

const defaultListRuns = (repo) => createGhaClient().listRuns(repo)
const defaultGetRunStatus = (repo, runId) =>
  createGhaClient().getRunStatus(repo, runId)
const defaultWaitForRun = (repo, runId) =>
  createGhaClient().waitForRun(repo, runId)

const parseError =
  "Enter a repo and a run id, separated by a space — e.g. 'trade-imports-animals-frontend 12345'."

const parseRepoAndRunId = (raw) => {
  const parts = raw.split(/\s+/).filter((part) => part !== '')
  if (parts.length < 2) return { error: parseError }
  const [repo, runIdRaw] = parts
  const runId = Number(runIdRaw)
  if (!Number.isInteger(runId) || runId <= 0) return { error: parseError }
  return { repo, runId }
}

export const useGhaFeature = ({
  setScreen,
  setScreenData,
  setLoadingMessage,
  navigateToMain,
  listRuns = defaultListRuns,
  getRunStatus = defaultGetRunStatus,
  waitForRun = defaultWaitForRun
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

  const fetchRunStatus = async (raw) => {
    const parsed = parseRepoAndRunId(raw)
    if (parsed.error) {
      setScreenData({ error: parsed.error })
      setScreen(SCREENS.ERROR)
      return
    }
    const { repo, runId } = parsed
    setLoadingMessage(`Fetching status for run ${runId} in ${repo}…`)
    setScreen(SCREENS.LOADING)
    try {
      const run = await getRunStatus(repo, runId)
      setScreenData({ repo, run })
      setScreen(SCREENS.GHA_STATUS_RESULT)
    } catch (error) {
      setScreenData({ error: error.message ?? String(error) })
      setScreen(SCREENS.ERROR)
    }
  }

  const startWait = async (raw) => {
    const parsed = parseRepoAndRunId(raw)
    if (parsed.error) {
      setScreenData({ error: parsed.error })
      setScreen(SCREENS.ERROR)
      return
    }
    const { repo, runId } = parsed
    setScreenData({ repo, runId, startTime: Date.now() })
    setScreen(SCREENS.GHA_WAIT_PROGRESS)
    try {
      const run = await waitForRun(repo, runId)
      setScreenData({ repo, run })
      setScreen(SCREENS.GHA_STATUS_RESULT)
    } catch (error) {
      setScreenData({ error: error.message ?? String(error) })
      setScreen(SCREENS.ERROR)
    }
  }

  const handleGhaSelect = (item) => {
    if (item.value === 'back') return navigateToMain()
    if (item.value === 'runs') return setScreen(SCREENS.GHA_RUNS_INPUT)
    if (item.value === 'status') return setScreen(SCREENS.GHA_STATUS_INPUT)
    if (item.value === 'wait') return setScreen(SCREENS.GHA_WAIT_INPUT)
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
    },
    [SCREENS.GHA_STATUS_INPUT]: {
      component: InputScreen,
      props: {
        title: 'GitHub Actions',
        subtitle: 'Status of a single run',
        label: 'repo runId',
        placeholder: 'trade-imports-animals-frontend 12345',
        onSubmit: fetchRunStatus,
        onCancel: navigateToMain
      }
    },
    [SCREENS.GHA_STATUS_RESULT]: {
      component: RunStatusScreen,
      props: (screenData) => ({
        repo: screenData.repo,
        run: screenData.run,
        onReturn: navigateToMain
      })
    },
    [SCREENS.GHA_WAIT_INPUT]: {
      component: InputScreen,
      props: {
        title: 'GitHub Actions',
        subtitle: 'Wait for a run to finish',
        label: 'repo runId',
        placeholder: 'trade-imports-animals-frontend 12345',
        onSubmit: startWait,
        onCancel: navigateToMain
      }
    },
    [SCREENS.GHA_WAIT_PROGRESS]: {
      component: WaitProgressScreen,
      props: (screenData) => ({
        repo: screenData.repo,
        runId: screenData.runId,
        startTime: screenData.startTime
      })
    }
  }

  return { routes, handleMainMenuSelect }
}
