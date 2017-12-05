'use strict'
var debug = require('debug')('mixins:report-system')

const defaultOptions = {
  reportModel: {
    model: 'Report',
    as: 'reports',
    relation: 'hasMany'
  },
  userModel: {
    model: 'user',
    as: 'reports',
    relation: 'hasMany'
  }
}

module.exports = function(Model, options) {
  options = Object.assign({}, defaultOptions, options)

  Model.on('attached', () => {
    if (
      typeof Model.app.models[options.reportModel.model] === 'undefined' ||
      typeof Model.app.models[options.userModel.model] === 'undefined'
    ) {
      if (typeof Model.app.models[options.reportModel.model] === 'undefined') {
        Model.app.loopback.getModel(options.reportModel.model).on('attached', () => {
          if (typeof Model.app.models[options.userModel.model] !== 'undefined') {
            init(Model, options)
          }
        })
      }
      if (typeof Model.app.models[options.userModel.model] === 'undefined') {
        Model.app.loopback.getModel(options.userModel.model).on('attached', () => {
          if (typeof Model.app.models[options.reportModel.model] !== 'undefined') {
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
  if (typeof Model.app.models[options.userModel.model].scopes[options.reportModel.as] === 'undefined') {
    Model.app.models[options.userModel.model][options.reportModel.relation](
      Model.app.models[options.reportModel.model],
      {
        as: options.reportModel.as
      }
    )
    Model.app.models[options.reportModel.model].belongsTo(Model.app.models[options.userModel.model])
  }

  Model[options.userModel.relation](Model.app.models[options.reportModel.model], {
    as: options.userModel.as
  })
  Model.app.models[options.reportModel.model].belongsTo(Model)
}
