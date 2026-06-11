import { SCREENS } from '../../../constants/menuConfig.js'
import { collectStatuses } from '../../../commands/workspace/status.js'
import { buildInstallTasks } from '../../../commands/workspace/install.js'
import { buildLintTasks } from '../../../commands/workspace/lint.js'
import { buildTestTasks } from '../../../commands/workspace/test.js'
import { cleanAll } from '../../../commands/workspace/clean.js'
import { buildSetupTasks } from '../../../commands/workspace/setup.js'
import { buildUpdateTasks } from '../../../commands/workspace/update.js'
import { buildResetTasks } from '../../../commands/workspace/reset.js'
import { resolveWorkspaceRoot } from '../../../env/workspace-root.js'
import MenuScreen from '../../common/screens/MenuScreen.js'
import TaskResultsScreen from '../../common/screens/TaskResultsScreen.js'
import ParallelProgressScreen from '../../common/screens/ParallelProgressScreen.js'
import StatusOutputScreen from './screens/StatusOutputScreen.js'

const WORKSPACE_ITEMS = [
  { label: 'Status', value: 'status' },
  { label: 'Install', value: 'install' },
  { label: 'Lint', value: 'lint' },
  { label: 'Test', value: 'test' },
  { label: 'Clean', value: 'clean' },
  { label: 'Setup', value: 'setup' },
  { label: 'Update', value: 'update' },
  { label: 'Reset', value: 'reset' },
  { label: 'Back', value: 'back' }
]

const VERB_LABELS = {
  install: 'Install',
  lint: 'Lint',
  test: 'Test',
  clean: 'Clean',
  setup: 'Setup',
  update: 'Update',
  reset: 'Reset'
}

const DEFAULT_BUILDERS = {
  install: buildInstallTasks,
  lint: buildLintTasks,
  test: buildTestTasks,
  setup: buildSetupTasks,
  update: buildUpdateTasks,
  reset: buildResetTasks
}

const DEFAULT_CLEAN_RUNNER = cleanAll

const normaliseResult = (raw) =>
  raw.ok !== undefined ? raw : { ...raw, ok: raw.exitCode === 0 }

export const useWorkspaceFeature = ({
  setScreen,
  setScreenData,
  setLoadingMessage,
  navigateToMain,
  workspaceRoot,
  runners = DEFAULT_BUILDERS,
  cleanRunner = DEFAULT_CLEAN_RUNNER,
  statusCollector = collectStatuses
}) => {
  const runStatus = async () => {
    setLoadingMessage('Reading git status for every repo…')
    setScreen(SCREENS.LOADING)
    try {
      const root = resolveWorkspaceRoot({ explicit: workspaceRoot })
      const statuses = await statusCollector(root)
      setScreenData({ statuses })
      setScreen(SCREENS.WORKSPACE_STATUS_OUTPUT)
    } catch (error) {
      setScreenData({ error: error.message ?? String(error) })
      setScreen(SCREENS.ERROR)
    }
  }

  const runClean = async () => {
    setLoadingMessage('Removing node_modules in every Node.js repo…')
    setScreen(SCREENS.LOADING)
    try {
      const root = resolveWorkspaceRoot({ explicit: workspaceRoot })
      const raw = await cleanRunner(root)
      const results = raw.map(normaliseResult)
      setScreenData({ title: VERB_LABELS.clean, results })
      setScreen(SCREENS.WORKSPACE_TASK_RESULTS)
    } catch (error) {
      setScreenData({ error: error.message ?? String(error) })
      setScreen(SCREENS.ERROR)
    }
  }

  const runVerb = (verb) => {
    try {
      const root = resolveWorkspaceRoot({ explicit: workspaceRoot })
      const tasks = runners[verb](root)
      setScreenData({ title: VERB_LABELS[verb], tasks })
      setScreen(SCREENS.WORKSPACE_TASK_PROGRESS)
    } catch (error) {
      setScreenData({ error: error.message ?? String(error) })
      setScreen(SCREENS.ERROR)
    }
  }

  const handleWorkspaceSelect = (item) => {
    if (item.value === 'back') return navigateToMain()
    if (item.value === 'status') return runStatus()
    if (item.value === 'clean') return runClean()
    if (VERB_LABELS[item.value]) return runVerb(item.value)
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
    },
    [SCREENS.WORKSPACE_TASK_RESULTS]: {
      component: TaskResultsScreen,
      props: (screenData) => ({
        title: screenData.title ?? 'Workspace',
        results: screenData.results ?? [],
        onReturn: navigateToMain
      })
    },
    [SCREENS.WORKSPACE_TASK_PROGRESS]: {
      component: ParallelProgressScreen,
      props: (screenData) => ({
        title: screenData.title ?? 'Workspace',
        tasks: screenData.tasks ?? [],
        onReturn: navigateToMain
      })
    }
  }

  return { routes, handleMainMenuSelect }
}
