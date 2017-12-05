'use strict'
var debug = require('debug')('mixins:share-system')

const defaultOptions = {
  shareModel: {
    model: 'Share',
    as: 'shared'
  },
  userModel: {
    model: 'user',
    as: 'shares'
  }
}

module.exports = function(Model, options) {
  options = Object.assign({}, defaultOptions, options)

  Model.on('attached', () => {
    if (
      typeof Model.app.models[options.shareModel.model] === 'undefined' ||
      typeof Model.app.models[options.userModel.model] === 'undefined'
    ) {
      if (typeof Model.app.models[options.shareModel.model] === 'undefined') {
        Model.app.loopback.getModel(options.shareModel.model).on('attached', () => {
          if (typeof Model.app.models[options.userModel.model] !== 'undefined') {
            init(Model, options)
          }
        })
      }
      if (typeof Model.app.models[options.userModel.model] === 'undefined') {
        Model.app.loopback.getModel(options.userModel.model).on('attached', () => {
          if (typeof Model.app.models[options.shareModel.model] !== 'undefined') {
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
  Model.app.models[options.userModel.model].hasMany(Model, {
    as: options.userModel.as,
    foreignKey: 'postId',
    keyThrough: 'userId',
    through: Model.app.models[options.shareModel.model]
  })
  Model.hasMany(Model.app.models[options.userModel.model], {
    as: options.shareModel.as,
    foreignKey: 'userId',
    keyThrough: 'postId',
    through: Model.app.models[options.shareModel.model]
  })

  Model.app.models[options.shareModel.model].belongsTo(Model.app.models[options.userModel.model], { as: 'user' })
  Model.app.models[options.shareModel.model].belongsTo(Model, { as: 'post' })

  Model.app.models[options.userModel.model].disableRemoteMethodByName('prototype.__create__' + options.userModel.as)
  Model.app.models[options.userModel.model].disableRemoteMethodByName('prototype.__delete__' + options.userModel.as)
  Model.app.models[options.userModel.model].disableRemoteMethodByName(
    'prototype.__destroyById__' + options.userModel.as
  )
  Model.app.models[options.userModel.model].disableRemoteMethodByName('prototype.__updateById__' + options.userModel.as)

  Model.disableRemoteMethodByName('prototype.__create__' + options.shareModel.as)
  Model.disableRemoteMethodByName('prototype.__delete__' + options.shareModel.as)
  Model.disableRemoteMethodByName('prototype.__destroyById__' + options.shareModel.as)
  Model.disableRemoteMethodByName('prototype.__updateById__' + options.shareModel.as)
}
