// Packages
const { execute, run } = require('../lib/handle')

// Mock Robot Context
let ctx

beforeEach(() => {
  ctx = {
    issue: obj => ({ owner: 'user', repo: 'test', ...obj }),
    repo: obj => ({ owner: 'user', repo: 'test', ...obj }),
    payload: {
      sha: 'abcdefg'
    },
    log: { info: jest.fn(), warn: jest.fn() },
    github: {
      issues: {
        replaceAllLabels: jest.fn(),
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
  const pull = {
    number: 1,
    head: { sha: 'abcdefg' },
    labels: [{ name: 'Something' }]
  }

  test('Fetchs all PR statuses', async () => {
    const config = [{ when: {}, remove: [] }]
    await execute(ctx, pull, config)
    expect(ctx.github.repos.getStatuses).toBeCalledWith(
      expect.objectContaining({
        ref: pull.head.sha
      })
    )
  })

  test('Adds the label if all conditions pass', async () => {
    const config = [
      {
        when: { travis: 'success', dep: 'success' },
        remove: []
      }
    ]

    await execute(ctx, pull, config)
    expect(ctx.github.issues.replaceAllLabels).toBeCalled()
    expect(ctx.github.issues.removeLabel).not.toBeCalled()
  })

  test('Removes the label if a condition fails', async () => {
    const config = [
      {
        when: { travis: 'success', dep: 'pending' },
        remove: []
      }
    ]

    await execute(ctx, pull, config)
    expect(ctx.github.issues.removeLabel).toBeCalled()
    expect(ctx.github.issues.replaceAllLabels).not.toBeCalled()
  })

  test('Uses the label from the configs if specified', async () => {
    // addLabels
    let config = [
      {
        when: { travis: 'success' },
        label: 'my-label',
        remove: []
      }
    ]
    await execute(ctx, pull, config)

    expect(ctx.github.issues.replaceAllLabels).toBeCalledWith(
      expect.objectContaining({ labels: ['my-label', 'Something'] })
    )

    // removeLabel
    config = [
      {
        when: { travis: 'failure' },
        label: 'label2',
        remove: []
      }
    ]
    await execute(ctx, pull, config)

    expect(ctx.github.issues.removeLabel).toBeCalledWith(
      expect.objectContaining({ name: 'label2' })
    )
  })
})

describe('run', () => {
  test('paginates all open PRs', async () => {
    const config = [{ when: { travis: 'success' } }]
    await run(ctx, config)
    expect(ctx.github.paginate).toBeCalled()
    expect(ctx.github.pullRequests.getAll).toBeCalledWith(
      expect.objectContaining({ state: 'open' })
    )
  })
})
