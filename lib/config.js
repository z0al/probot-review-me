// Packages
const Joi = require('joi')

const schema = Joi.object().keys({
  rules: Joi.array().items(
    Joi.object()
      .keys({
        // List of conditions
        when: Joi.object()
          .pattern(
            /.*/,
            Joi.string()
              .only('success', 'error', 'failure', 'pending')
              .required()
          )
          .required(),

        // The label to add
        label: Joi.string().required(),

        // The labels to remove
        remove: Joi.array()
          .items(Joi.string())
          .default([])
      })
      .unknown()
  )
})

/**
 * Loads and validates config from GitHub
 *
 * @param {Context} ctx A Probot context
 * @returns {object} The config object
 * @async
 */
async function loadConfig (ctx) {
  ctx.log.info('Loading configs from `.github/review-me.yml`')
  const yaml = await ctx.config('review-me.yml')

  if (!yaml) {
    ctx.log.warn('No configs found!')
    return null
  }

  // Run validation against the schema
  const config = Joi.validate(yaml, schema)

  if (config.error) {
    ctx.log.warn('Invalid configuration found!')
    return null
  }

  return config.value.rules
}

module.exports = { loadConfig }
