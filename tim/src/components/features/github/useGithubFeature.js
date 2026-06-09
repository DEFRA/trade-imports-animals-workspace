import { SCREENS } from '../../../constants/menuConfig.js'
import { createGithubClient } from '../../../clients/github-client.js'
import MenuScreen from '../../common/screens/MenuScreen.js'
import InputScreen from '../../common/screens/InputScreen.js'
import PrsResultScreen from './screens/PrsResultScreen.js'
import PrDetailsScreen from './screens/PrDetailsScreen.js'
import DiffScreen from './screens/DiffScreen.js'

const GITHUB_ITEMS = [
  { label: 'Find pull requests for a ticket', value: 'prs' },
  { label: 'Open a single PR', value: 'pr' },
  { label: 'Show a PR diff', value: 'diff' },
  { label: 'Back', value: 'back' }
]

const PARSE_ERROR =
  "Enter a repo and a PR number, separated by a space — e.g. 'trade-imports-animals-frontend 42'."

const defaultFindPrs = (id) => createGithubClient().findPrsForTicket(id)
const defaultGetPr = (repo, number) => createGithubClient().getPr(repo, number)
const defaultGetPrDiff = (repo, number) =>
  createGithubClient().getPrDiff(repo, number)

const parseRepoAndNumber = (input) => {
  const parts = (input ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return null
  const [repo, numStr] = parts
  const number = Number.parseInt(numStr, 10)
  if (!Number.isFinite(number) || number <= 0) return null
  if (String(number) !== numStr) return null
  return { repo, number }
}

export const useGithubFeature = ({
  setScreen,
  setScreenData,
  setLoadingMessage,
  navigateToMain,
  findPrsForTicket = defaultFindPrs,
  getPr = defaultGetPr,
  getPrDiff = defaultGetPrDiff
}) => {
  const fetchPrs = async (id) => {
    setLoadingMessage(`Searching GitHub for PRs tagged ${id}…`)
    setScreen(SCREENS.LOADING)
    try {
      const prs = await findPrsForTicket(id)
      setScreenData({ ticketId: id, prs })
      setScreen(SCREENS.GITHUB_PRS_RESULT)
    } catch (error) {
      setScreenData({ error: error.message ?? String(error) })
      setScreen(SCREENS.ERROR)
    }
  }

  const fetchPr = async (input) => {
    const parsed = parseRepoAndNumber(input)
    if (!parsed) {
      setScreenData({ error: PARSE_ERROR })
      setScreen(SCREENS.ERROR)
      return
    }
    const { repo, number } = parsed
    setLoadingMessage(`Loading ${repo}#${number} from GitHub…`)
    setScreen(SCREENS.LOADING)
    try {
      const pr = await getPr(repo, number)
      setScreenData({ pr })
      setScreen(SCREENS.GITHUB_PR_RESULT)
    } catch (error) {
      setScreenData({ error: error.message ?? String(error) })
      setScreen(SCREENS.ERROR)
    }
  }

  const fetchDiff = async (input) => {
    const parsed = parseRepoAndNumber(input)
    if (!parsed) {
      setScreenData({ error: PARSE_ERROR })
      setScreen(SCREENS.ERROR)
      return
    }
    const { repo, number } = parsed
    setLoadingMessage(`Loading diff for ${repo}#${number}…`)
    setScreen(SCREENS.LOADING)
    try {
      const diff = await getPrDiff(repo, number)
      setScreenData({ repo, number, diff })
      setScreen(SCREENS.GITHUB_DIFF_RESULT)
    } catch (error) {
      setScreenData({ error: error.message ?? String(error) })
      setScreen(SCREENS.ERROR)
    }
  }

  const handleGithubSelect = (item) => {
    if (item.value === 'back') return navigateToMain()
    if (item.value === 'prs') return setScreen(SCREENS.GITHUB_PRS_INPUT)
    if (item.value === 'pr') return setScreen(SCREENS.GITHUB_PR_INPUT)
    if (item.value === 'diff') return setScreen(SCREENS.GITHUB_DIFF_INPUT)
  }

  const handleMainMenuSelect = () => setScreen(SCREENS.GITHUB_MENU)

  const routes = {
    [SCREENS.GITHUB_MENU]: {
      component: MenuScreen,
      props: {
        title: 'GitHub',
        subtitle: 'Choose a GitHub action',
        items: GITHUB_ITEMS,
        onSelect: handleGithubSelect
      }
    },
    [SCREENS.GITHUB_PRS_INPUT]: {
      component: InputScreen,
      props: {
        title: 'GitHub',
        subtitle: 'Find pull requests for a Jira ticket',
        label: 'Ticket id',
        placeholder: 'EUDPA-200',
        onSubmit: fetchPrs,
        onCancel: navigateToMain
      }
    },
    [SCREENS.GITHUB_PRS_RESULT]: {
      component: PrsResultScreen,
      props: (screenData) => ({
        ticketId: screenData.ticketId,
        prs: screenData.prs ?? [],
        onReturn: navigateToMain
      })
    },
    [SCREENS.GITHUB_PR_INPUT]: {
      component: InputScreen,
      props: {
        title: 'GitHub',
        subtitle: 'Open a single pull request',
        label: 'repo number',
        placeholder: 'trade-imports-animals-frontend 42',
        onSubmit: fetchPr,
        onCancel: navigateToMain
      }
    },
    [SCREENS.GITHUB_PR_RESULT]: {
      component: PrDetailsScreen,
      props: (screenData) => ({
        pr: screenData.pr,
        onReturn: navigateToMain
      })
    },
    [SCREENS.GITHUB_DIFF_INPUT]: {
      component: InputScreen,
      props: {
        title: 'GitHub',
        subtitle: 'Show a pull request diff',
        label: 'repo number',
        placeholder: 'trade-imports-animals-frontend 42',
        onSubmit: fetchDiff,
        onCancel: navigateToMain
      }
    },
    [SCREENS.GITHUB_DIFF_RESULT]: {
      component: DiffScreen,
      props: (screenData) => ({
        repo: screenData.repo,
        number: screenData.number,
        diff: screenData.diff ?? '',
        onReturn: navigateToMain
      })
    }
  }

  return { routes, handleMainMenuSelect }
}
