import { describe, test, expect, afterEach } from 'vitest'
import { createElement } from 'react'
import { render as inkTestRender } from 'ink-testing-library'
import { Text } from 'ink'
import { mount, unmount, getCurrent } from './inkControl.js'

const renderHello = (label) => createElement(Text, null, label)

afterEach(() => {
  unmount()
})

describe('inkControl', () => {
  test('mount renders the element and records the instance as current', () => {
    const instance = mount(renderHello('hello-one'), { render: inkTestRender })

    expect(getCurrent()).toBe(instance)
    expect(instance.lastFrame()).toContain('hello-one')
  })

  test('mounting a second time tears down the previous instance', () => {
    const first = mount(renderHello('first'), { render: inkTestRender })
    const second = mount(renderHello('second'), { render: inkTestRender })

    expect(getCurrent()).toBe(second)
    expect(getCurrent()).not.toBe(first)
    expect(second.lastFrame()).toContain('second')
  })

  test('unmount clears the current instance', () => {
    mount(renderHello('temp'), { render: inkTestRender })

    unmount()

    expect(getCurrent()).toBe(null)
  })

  test('unmount is a no-op when nothing is mounted', () => {
    unmount()

    expect(() => unmount()).not.toThrow()
    expect(getCurrent()).toBe(null)
  })
})
