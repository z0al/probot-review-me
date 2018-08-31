/**
 * Checks the given Pull Request's head commit statuses and update its labels
 * accordingly.
 *
 * @param {Object} ctx A Probot context
 * @param {Object} pull GitHub Pull Request object
 * @param {object} config The App config object
 */
async function execute (ctx, pull, configsList) {
  // Necessary info
  const { github, log } = ctx
  const issue = ctx.issue({ number: pull.number })
  const repo = ctx.repo({ ref: pull.head.sha, per_page: 100 })

  // Find specific app status
  // States are returned in reverse chronological order. The first state
  // in the list will be the latest one.
  const findState = (term, list) => {
    return list.find(st => st.context.toLowerCase() === term.toLowerCase())
  }

  // Match configs with actual states
  const matchStates = async (config, states) => {
    for (const app in config.when) {
      const { state } = findState(app, states) || {}

      if (state !== config.when[app]) {
        log.warn(
          `Expected the state of "${app}" to be "${
            config.when[app]
          }" but it's "${state}"`
        )

        return github.issues.removeLabel({ ...issue, name: config.label })
      }
    }

    const labels = [config.label]

    // Remove labels
    pull.labels.forEach(obj => {
      const name = obj.name

      if (!config.remove.find(label => label === name)) {
        labels.push(name)
      }
    })

    log.info(`OK! Updating labels ..`)
    return github.issues.replaceAllLabels({ ...issue, labels })
  }

  // Iterate over configs
  return github.paginate(github.repos.getStatuses(repo), async page => {
    const states = page.data
    for (config of configsList) {
      await matchStates(config, states)
    }
  })
}

/**
 * Iterates over all open Pull Requests and calls `execute` against each.
 *
 * @param {Object} ctx A Probot context
 * @param {Object} config The App config object
 */
async function run (ctx, config) {
  // Extract necessary info
  const repo = ctx.repo()
  const { github } = ctx
  const { sha } = ctx.payload

  // Search for open PRs
  return github.paginate(
    github.pullRequests.getAll({ ...repo, state: 'open', per_page: 100 }),
    async page => {
      for (const pull of page.data) {
        // Only check related PRs (#4)
        if (pull.head.sha != sha) {
          continue
        }

        try {
          await execute(ctx, pull, config)
        } catch (err) {
          // Nothing needs to be done. Probably because of `removeLabel`.
        }
      }
    }
  )
}

module.exports = { run, execute }
