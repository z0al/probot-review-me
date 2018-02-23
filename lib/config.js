// Packages
const Joi = require('joi')

/**
 * validates given configuration object. Returns `null` if invalid.
 *
 * @param {Object} config Configuration object
 * @returns
 */
function validateConfig (config) {
  // Prepare schema
  const schema = Joi.object()
    .keys({
      // List of apps
      when: Joi.object()
        .pattern(
          /.*/,
          Joi.string()
            .only('success', 'error', 'failure', 'pending')
            .required()
        )
        .required(),
      // The label to add or remove. Default 'Review Me'
      label: Joi.string()
        .optional()
        .default('Review Me')
    })
    .unknown()

  // Run validation against the schema
  const res = Joi.validate(config, schema)

  // Error? return null
  if (res.error) return null

  return res.value
}

/**
 * Loads config from GitHub
 *
 * @param {Context} ctx A Probot context
 * @returns {object} The config object
 * @async
 */
async function loadConfig (ctx) {
  ctx.log.info('Loading configs from `.github/review-me.yml`')
  let config = await ctx.config('review-me.yml')

  config = validateConfig(config)
  if (!config) ctx.log.warn('Invalid configuration found!')

  return config
}

module.exports = { loadConfig }
