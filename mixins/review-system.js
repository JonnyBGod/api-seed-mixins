'use strict'
var debug = require('debug')('mixins:review-system')

/**
 * "ReviewSystem": true
 * or
 * "ReviewSystem": {
 *   "reviewModel": {"model": "Review","as": "reviews",
 *     "relation": "hasMany"
 *   },
 *   "userModel": {
 *     "model": "user",
 *     "as": "reviews",
 *     "relation": "hasMany"
 *   }
 * }
 */
const defaultOptions = {
  reviewModel: {
    model: 'Review',
    as: 'reviews',
    relation: 'hasMany'
  },
  userModel: {
    model: 'user',
    as: 'reviews',
    relation: 'hasMany'
  }
}

module.exports = function(Model, options) {
  options = Object.assign({}, defaultOptions, options)

  Model.on('attached', () => {
    if (
      typeof Model.app.models[options.reviewModel.model] === 'undefined' ||
      typeof Model.app.models[options.userModel.model] === 'undefined'
    ) {
      if (typeof Model.app.models[options.reviewModel.model] === 'undefined') {
        Model.app.loopback.getModel(options.reviewModel.model).on('attached', () => {
          if (typeof Model.app.models[options.userModel.model] !== 'undefined') {
            init(Model, options)
          }
        })
      }
      if (typeof Model.app.models[options.userModel.model] === 'undefined') {
        Model.app.loopback.getModel(options.userModel.model).on('attached', () => {
          if (typeof Model.app.models[options.reviewModel.model] !== 'undefined') {
            init(Model, options)
          }
        })
      }
    } else {
      init(Model, options)
    }
  })
}

function init(Model, options) {
  if (typeof Model.app.models[options.userModel.model].scopes[options.reviewModel.as] === 'undefined') {
    Model.app.models[options.userModel.model][options.reviewModel.relation](
      Model.app.models[options.reviewModel.model],
      {
        as: options.reviewModel.as
      }
    )
    Model.app.models[options.reviewModel.model].belongsTo(Model.app.models[options.userModel.model])
  }

  Model[options.userModel.relation](Model.app.models[options.reviewModel.model], {
    as: options.userModel.as
  })
  Model.app.models[options.reviewModel.model].belongsTo(Model)
}
