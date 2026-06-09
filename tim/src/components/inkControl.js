import { render as inkRender } from 'ink'

let current = null

export const mount = (element, { render = inkRender } = {}) => {
  if (current) {
    current.unmount()
    current = null
  }
  current = render(element)
  return current
}

export const unmount = () => {
  if (!current) return
  current.unmount()
  current = null
}

export const getCurrent = () => current
