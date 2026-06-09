import { SCREENS } from '../../../constants/menuConfig.js'
import { createJiraClient } from '../../../clients/jira-client.js'
import MenuScreen from '../../common/screens/MenuScreen.js'
import InputScreen from '../../common/screens/InputScreen.js'
import TicketResultScreen from './screens/TicketResultScreen.js'

const JIRA_ITEMS = [
  { label: 'Look up a ticket', value: 'ticket' },
  { label: 'Back', value: 'back' }
]

const defaultGetTicket = (id) => createJiraClient().getTicket(id)

export const useJiraFeature = ({
  setScreen,
  setScreenData,
  setLoadingMessage,
  navigateToMain,
  getTicket = defaultGetTicket
}) => {
  const fetchTicket = async (id) => {
    setLoadingMessage(`Looking up ${id}…`)
    setScreen(SCREENS.LOADING)
    try {
      const ticket = await getTicket(id)
      setScreenData({ ticket })
      setScreen(SCREENS.JIRA_TICKET_RESULT)
    } catch (error) {
      setScreenData({ error: error.message ?? String(error) })
      setScreen(SCREENS.ERROR)
    }
  }

  const handleJiraSelect = (item) => {
    if (item.value === 'back') return navigateToMain()
    if (item.value === 'ticket') return setScreen(SCREENS.JIRA_TICKET_INPUT)
  }

  const handleMainMenuSelect = () => setScreen(SCREENS.JIRA_MENU)

  const routes = {
    [SCREENS.JIRA_MENU]: {
      component: MenuScreen,
      props: {
        title: 'Jira',
        subtitle: 'Choose a Jira action',
        items: JIRA_ITEMS,
        onSelect: handleJiraSelect
      }
    },
    [SCREENS.JIRA_TICKET_INPUT]: {
      component: InputScreen,
      props: {
        title: 'Jira',
        subtitle: 'Look up a Jira ticket',
        label: 'Ticket id',
        placeholder: 'EUDPA-200',
        onSubmit: fetchTicket,
        onCancel: navigateToMain
      }
    },
    [SCREENS.JIRA_TICKET_RESULT]: {
      component: TicketResultScreen,
      props: (screenData) => ({
        ticket: screenData.ticket ?? {},
        onReturn: navigateToMain
      })
    }
  }

  return { routes, handleMainMenuSelect }
}
