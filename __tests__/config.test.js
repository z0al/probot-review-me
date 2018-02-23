// Packages
const { loadConfig } = require('../lib/config')

// Mock Robot Context
let ctx

beforeAll(() => {
  ctx = {
    repo: jest.fn(),
    log: { info: jest.fn(), warn: jest.fn() },
    config: jest
      .fn()
      .mockReturnValueOnce({})
      .mockReturnValueOnce({ when: { travis: 'success' } })
      .mockReturnValue({
        when: {
          travis: 'success',
          wip: 'success'
        },
        label: 'ready-for-review'
      })
  }
})

test('Returns `null` when errors occur', async () => {
  const config = await loadConfig(ctx)
  expect(ctx.config).toBeCalled()
  expect(config).toBe(null)
})

test('Set default label', async () => {
  const config = await loadConfig(ctx)
  expect(ctx.config).toBeCalled()
  expect(config.label).toEqual('Review Me')
})

test('Get file content via GitHub API', async () => {
  const config = await loadConfig(ctx)
  expect(ctx.config).toBeCalled()
  expect(config).toEqual({
    when: { travis: 'success', wip: 'success' },
    label: 'ready-for-review'
  })
})
