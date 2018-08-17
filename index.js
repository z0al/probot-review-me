// Packages
const { loadConfig } = require('./lib/config')
const { run } = require('./lib/handle')

/**
 * App starting point
 *
 * @param {Robot} app
 */
const app = app => {
  app.on('status', async ctx => {
    // Load config from GitHub
    const config = await loadConfig(ctx)

    // Invalid config?
    if (!config) return

    // return run(ctx, config);
  })
}

module.exports = app
