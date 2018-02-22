// Packages
const { JSON_SCHEMA, safeLoad } = require('js-yaml')
const Joi = require('joi')

/**
 * Decodes and parses a YAML config file
 *
 * @param {string} content Base64 encoded YAML contents
 * @returns {object} The parsed YAML file as native object
 */
function parseConfig(content) {
  return (
    safeLoad(Buffer.from(content, 'base64').toString(), {
      schema: JSON_SCHEMA
    }) || {}
  )
}

/**
 * validates given configuration object. Returns `null` if invalid.
 *
 * @param {Object} config Configuration object
 * @returns
 */
function validateConfig(config) {
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
async function loadConfig(ctx) {
  const params = ctx.repo({ path: '.github/review-me.yml' })
  try {
    ctx.log.info('Attempting to load `.github/review-me.yml`')
    const res = await ctx.github.repos.getContent(params)

    let config = parseConfig(res.data.content)
    ctx.log.info('Configuration file loaded!')

    config = validateConfig(config)
    if (!config) ctx.log.warn('Invalid configuration found!')

    return config
  } catch (err) {
    return null
  }
}

module.exports = { loadConfig }
