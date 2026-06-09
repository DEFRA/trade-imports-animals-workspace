import { SCREENS } from '../../../constants/menuConfig.js'
import { createConfluenceClient } from '../../../clients/confluence-client.js'
import MenuScreen from '../../common/screens/MenuScreen.js'
import InputScreen from '../../common/screens/InputScreen.js'
import PageResultScreen from './screens/PageResultScreen.js'

const CONFLUENCE_ITEMS = [
  { label: 'Look up a page', value: 'page' },
  { label: 'Back', value: 'back' }
]

const defaultGetPage = (id) => createConfluenceClient().getPage(id)

export const useConfluenceFeature = ({
  setScreen,
  setScreenData,
  setLoadingMessage,
  navigateToMain,
  getPage = defaultGetPage
}) => {
  const fetchPage = async (id) => {
    setLoadingMessage(`Fetching Confluence page ${id}…`)
    setScreen(SCREENS.LOADING)
    try {
      const page = await getPage(id)
      setScreenData({ page })
      setScreen(SCREENS.CONFLUENCE_PAGE_RESULT)
    } catch (error) {
      setScreenData({ error: error.message ?? String(error) })
      setScreen(SCREENS.ERROR)
    }
  }

  const handleConfluenceSelect = (item) => {
    if (item.value === 'back') return navigateToMain()
    if (item.value === 'page') return setScreen(SCREENS.CONFLUENCE_PAGE_INPUT)
  }

  const handleMainMenuSelect = () => setScreen(SCREENS.CONFLUENCE_MENU)

  const routes = {
    [SCREENS.CONFLUENCE_MENU]: {
      component: MenuScreen,
      props: {
        title: 'Confluence',
        subtitle: 'Choose a Confluence action',
        items: CONFLUENCE_ITEMS,
        onSelect: handleConfluenceSelect
      }
    },
    [SCREENS.CONFLUENCE_PAGE_INPUT]: {
      component: InputScreen,
      props: {
        title: 'Confluence',
        subtitle: 'Look up a Confluence page',
        label: 'Page id',
        placeholder: '12345',
        onSubmit: fetchPage,
        onCancel: navigateToMain
      }
    },
    [SCREENS.CONFLUENCE_PAGE_RESULT]: {
      component: PageResultScreen,
      props: (screenData) => ({
        page: screenData.page ?? {},
        onReturn: navigateToMain
      })
    }
  }

  return { routes, handleMainMenuSelect }
}
