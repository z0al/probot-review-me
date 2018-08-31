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
      .mockReturnValueOnce([])
      .mockReturnValue({
        rules: [
          {
            when: {
              travis: 'success',
              wip: 'success'
            },
            label: 'ready-for-review'
          }
        ]
      })
  }
})

test('Returns `null` when errors occur', async () => {
  const config = await loadConfig(ctx)
  expect(ctx.config).toBeCalled()
  expect(config).toBe(null)
})

test('Get file content via GitHub API', async () => {
  const config = await loadConfig(ctx)
  expect(ctx.config).toBeCalled()
  expect(config[0]).toEqual(
    expect.objectContaining({
      label: 'ready-for-review'
    })
  )
})
