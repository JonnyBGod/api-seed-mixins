'use strict'
var debug = require('debug')('mixins:review-system')

/**
 * "ReviewSystem": true
 * or
 * "ReviewSystem": {
 *   "reviewModel": {"model": "Review","as": "reviews",
 *     "relation": "hasMany"
 *   },
 *   "reviewerModel": {
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
  reviewerModel: {
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
      typeof Model.app.models[options.reviewerModel.model] === 'undefined'
    ) {
      if (typeof Model.app.models[options.reviewModel.model] === 'undefined') {
        Model.app.loopback.getModel(options.reviewModel.model).on('attached', () => {
          if (typeof Model.app.models[options.reviewerModel.model] !== 'undefined') {
            init(Model, options)
          }
        })
      }
      if (typeof Model.app.models[options.reviewerModel.model] === 'undefined') {
        Model.app.loopback.getModel(options.reviewerModel.model).on('attached', () => {
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
  if (typeof Model.app.models[options.reviewerModel.model].scopes.reviews === 'undefined') {
    Model.app.models[options.reviewerModel.model][options.reviewModel.relation](
      Model.app.models[options.reviewModel.model],
      {
        as: options.reviewModel.as
      }
    )
    Model.app.models[options.reviewModel.model].belongsTo(
      Model.app.models[options.reviewerModel.model]
    )
  }

  Model[options.reviewerModel.relation](Model.app.models[options.reviewModel.model], {
    as: options.reviewerModel.as
  })
  Model.app.models[options.reviewModel.model].belongsTo(Model)
}
