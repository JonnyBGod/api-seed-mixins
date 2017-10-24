'use strict'
var debug = require('debug')('mixins:report-system')

module.exports = function(Model, options) {
  Model.on('attached', () => {
    if (
      typeof Model.app.models.Report === 'undefined' ||
      typeof Model.app.models.user === 'undefined'
    ) {
      if (typeof Model.app.models.Report === 'undefined') {
        Model.app.loopback.getModel('Report').on('attached', () => {
          if (typeof Model.app.models.user !== 'undefined') {
            init(Model, options)
          }
        })
      }
      if (typeof Model.app.models.user === 'undefined') {
        Model.app.loopback.getModel('user').on('attached', () => {
          if (typeof Model.app.models.Report !== 'undefined') {
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
  if (typeof Model.app.models.user.scopes.reports === 'undefined') {
    Model.app.models.user.hasMany(Model.app.models.Report, {
      as: 'reports',
      foreignKey: 'userId'
    })
  }

  Model.hasMany(Model.app.models.Report, {
    as: 'reports'
  })
  Model.app.models.Report.belongsTo(Model)
}
