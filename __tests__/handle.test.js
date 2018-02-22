// Packages
const { execute, handle } = require('../lib/handle')

// Mock Robot Context
let ctx

beforeEach(() => {
  ctx = {
    issue: obj => ({ owner: 'user', repo: 'test', ...obj }),
    repo: obj => ({ owner: 'user', repo: 'test', ...obj }),
    log: { info: jest.fn(), warn: jest.fn() },
    github: {
      issues: {
        addLabels: jest.fn(),
        removeLabel: jest.fn()
      },
      pullRequests: {
        getAll: jest.fn().mockReturnValue({
          data: [{ number: 1, head: { sha: 'abcdefg' } }]
        })
      },
      repos: {
        getStatuses: jest.fn().mockReturnValue({
          data: [
            { context: 'travis', state: 'success' },
            { context: 'dep', state: 'success' }
          ]
        })
      },
      paginate: jest.fn().mockImplementation((fn, cb) => cb(fn))
    }
  }
})

describe('execute', () => {
  const pull = { number: 1, head: { sha: 'abcdefg' } }

  test('Fetchs all PR statuses', async () => {
    await execute(ctx, pull, { when: {} })
    expect(ctx.github.repos.getStatuses).toBeCalledWith(
      expect.objectContaining({
        ref: pull.head.sha
      })
    )
  })

  test('Adds the label if all conditions pass', async () => {
    await execute(ctx, pull, { when: { travis: 'success', dep: 'success' } })
    expect(ctx.github.issues.addLabels).toBeCalled()
    expect(ctx.github.issues.removeLabel).not.toBeCalled()
  })

  test('Removes the label if a condition fails', async () => {
    await execute(ctx, pull, { when: { travis: 'success', dep: 'pending' } })
    expect(ctx.github.issues.removeLabel).toBeCalled()
    expect(ctx.github.issues.addLabels).not.toBeCalled()
  })

  test('Uses the label from the configs if specified', async () => {
    // addLabels
    await execute(ctx, pull, { when: { travis: 'success' }, label: 'my-label' })

    expect(ctx.github.issues.addLabels).toBeCalledWith(
      expect.objectContaining({ labels: ['my-label'] })
    )

    // removeLabel
    await execute(ctx, pull, { when: { travis: 'failure' }, label: 'label2' })

    expect(ctx.github.issues.removeLabel).toBeCalledWith(
      expect.objectContaining({ name: 'label2' })
    )
  })
})

describe('handle', () => {
  test('paginates all open PRs', async () => {
    await handle(ctx, { when: { travis: 'success' } })
    expect(ctx.github.paginate).toBeCalled()
    expect(ctx.github.pullRequests.getAll).toBeCalledWith(
      expect.objectContaining({ state: 'open' })
    )
  })
})
