'use strict'
var debug = require('debug')('mixins:reply-system')

const defaultOptions = {
  model: 'Reply',
  as: 'replies',
  asTo: 'replying'
}

module.exports = function(Model, options) {
  options = Object.assign({}, defaultOptions, options)

  Model.on('attached', () => {
    if (typeof Model.app.models[options.model] === 'undefined') {
      Model.app.loopback.getModel(options.model).on('attached', () => {
        init(Model, options)
      })
    } else {
      init(Model, options)
    }
  })
}

function init(Model, options) {
  Model.hasMany(Model, {
    as: options.as,
    foreignKey: 'replyingId',
    keyThrough: 'replyerId',
    through: Model.app.models[options.model]
  })
  Model.hasOne(Model, {
    as: options.asTo,
    foreignKey: 'replyerId',
    keyThrough: 'replyingId',
    through: Model.app.models[options.model]
  })

  Model.app.models[options.model].belongsTo(Model, { as: 'reply', foreignKey: 'replyerId' })
  Model.app.models[options.model].belongsTo(Model, { as: 'replying', foreignKey: 'replyingId' })

  Model.disableRemoteMethodByName('prototype.__create__' + options.as)
  Model.disableRemoteMethodByName('prototype.__delete__' + options.as)
  Model.disableRemoteMethodByName('prototype.__destroyById__' + options.as)
  Model.disableRemoteMethodByName('prototype.__updateById__' + options.as)

  Model.disableRemoteMethodByName('prototype.__create__' + options.asTo)
  Model.disableRemoteMethodByName('prototype.__delete__' + options.asTo)
  Model.disableRemoteMethodByName('prototype.__destroyById__' + options.asTo)
  Model.disableRemoteMethodByName('prototype.__updateById__' + options.asTo)
}
