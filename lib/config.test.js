// Packages
const { loadConfig } = require('./config')

// Mock Robot Context
let ctx

beforeEach(() => {
  ctx = {
    repo: jest.fn(),
    log: { info: jest.fn(), warn: jest.fn() },
    github: {
      repos: {
        getContent: jest
          .fn()
          .mockReturnValueOnce(Promise.reject(null))
          .mockReturnValue({
            data: {
              // when:
              //   ci/circleci: success
              //   wip: success
              //
              // label: ready-for-review
              content:
                'd2hlbjoKICBjaS9jaXJjbGVjaTogc3VjY2VzcwogIHdpcDogc3VjY2Vzcwo' +
                'K\nbGFiZWw6IHJlYWR5LWZvci1yZXZpZXcK\n'
            }
          })
      }
    }
  }
})

test('Returns `null` when errors occur', async () => {
  const config = await loadConfig(ctx)
  expect(ctx.github.repos.getContent).toBeCalled()
  expect(config).toBe(null)
})

test('Get file content via GitHub API', async () => {
  await loadConfig(ctx)
  const config = await loadConfig(ctx)
  expect(ctx.github.repos.getContent).toBeCalled()
  expect(config).not.toBe({
    when: { 'ci/circleci': 'success', wip: 'success' },
    label: 'ready-for-review'
  })
})
