// Packages
const { loadConfig } = require('./lib/config')
const { handle } = require('./lib/handle')

/**
 * App starting point
 *
 * @param {Robot} robot
 */
const app = robot => {
  robot.on('status', async ctx => {
    // Load config from GitHub
    const config = await loadConfig(ctx)

    // Invalid config?
    if (!config) return

    return handle(ctx, config)
  })
}

module.exports = app
