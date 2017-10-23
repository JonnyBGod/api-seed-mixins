'use strict'
var debug = require('debug')('mixins:review-system')

module.exports = function(Model, options) {
  Model.on('attached', () => {
    if (typeof Model.app.models.Review === 'undefined' || typeof Model.app.models.user === 'undefined') {
      if (typeof Model.app.models.Review === 'undefined') {
        Model.app.loopback.getModel('Review').on('attached', () => {
          if (typeof Model.app.models.user !== 'undefined') {
             init(Model, options)
          }
        })
       }
       if (typeof Model.app.models.user === 'undefined') {
        Model.app.loopback.getModel('user').on('attached', () => {
          if (typeof Model.app.models.Review !== 'undefined') {
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
  if (typeof Model.app.models.user.scopes.reviews === 'undefined') {
    Model.app.models.user.hasMany(Model.app.models.Review, {
      as: 'reviews',
      foreignKey: 'userId'
    })
  }

  Model.hasMany(Model.app.models.Review, {
  	as: 'reviews'
  })
	Model.app.models.Review.belongsTo(Model)
}