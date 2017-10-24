'use strict'
var debug = require('debug')('mixins:share-system')

module.exports = function(Model, options) {
  Model.on('attached', () => {
    if (
      typeof Model.app.models.Share === 'undefined' ||
      typeof Model.app.models.user === 'undefined'
    ) {
      if (typeof Model.app.models.Share === 'undefined') {
        Model.app.loopback.getModel('Share').on('attached', () => {
          if (typeof Model.app.models.user !== 'undefined') {
            init(Model, options)
          }
        })
      }
      if (typeof Model.app.models.user === 'undefined') {
        Model.app.loopback.getModel('user').on('attached', () => {
          if (typeof Model.app.models.Share !== 'undefined') {
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
  Model.app.models.user.hasMany(Model, {
    as: 'shares',
    foreignKey: 'postId',
    keyThrough: 'userId',
    through: Model.app.models.Share
  })
  Model.hasMany(Model.app.models.user, {
    as: 'shared',
    foreignKey: 'userId',
    keyThrough: 'postId',
    through: Model.app.models.Share
  })

  Model.app.models.Share.belongsTo(Model.app.models.user, {as: 'user'})
  Model.app.models.Share.belongsTo(Model, {as: 'post'})

  Model.app.models.user.disableRemoteMethodByName('prototype.__create__shares')
  Model.app.models.user.disableRemoteMethodByName('prototype.__delete__shares')
  Model.app.models.user.disableRemoteMethodByName('prototype.__destroyById__shares')
  Model.app.models.user.disableRemoteMethodByName('prototype.__updateById__shares')

  Model.disableRemoteMethodByName('prototype.__create__shared')
  Model.disableRemoteMethodByName('prototype.__delete__shared')
  Model.disableRemoteMethodByName('prototype.__destroyById__shared')
  Model.disableRemoteMethodByName('prototype.__updateById__shared')
}
