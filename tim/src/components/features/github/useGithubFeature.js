import { SCREENS } from '../../../constants/menuConfig.js'
import { createGithubClient } from '../../../clients/github-client.js'
import MenuScreen from '../../common/screens/MenuScreen.js'
import InputScreen from '../../common/screens/InputScreen.js'
import PrsResultScreen from './screens/PrsResultScreen.js'

const GITHUB_ITEMS = [
  { label: 'Find pull requests for a ticket', value: 'prs' },
  { label: 'Back', value: 'back' }
]

const defaultFindPrs = (id) => createGithubClient().findPrsForTicket(id)

export const useGithubFeature = ({
  setScreen,
  setScreenData,
  setLoadingMessage,
  navigateToMain,
  findPrsForTicket = defaultFindPrs
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

  const handleGithubSelect = (item) => {
    if (item.value === 'back') return navigateToMain()
    if (item.value === 'prs') return setScreen(SCREENS.GITHUB_PRS_INPUT)
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
    }
  }

  return { routes, handleMainMenuSelect }
}
