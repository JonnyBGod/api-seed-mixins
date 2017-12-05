'use strict'
const debug = require('debug')('mixins:vote-system')
const IncludeThrough = require('loopback-include-through-mixin')

const defaultOptions = {
  voteModel: {
    model: 'Vote',
    as: 'votes'
  },
  userModel: {
    model: 'user',
    as: 'reports'
  }
}

module.exports = function(Model, options) {
  options = Object.assign({}, defaultOptions, options)

  Model.on('attached', () => {
    if (typeof Model.app.models[options.voteModel.model] === 'undefined') {
      Model.app.loopback.getModel(options.voteModel.model).on('attached', () => {
        init(Model, options)
      })
    } else {
      init(Model, options)
    }
  })
}

function init(Model, options) {
  if (typeof Model.app.models[options.userModel.model].scopes[options.voteModel.as] === 'undefined') {
    Model.app.models[options.userModel.model].hasMany(Model.app.models[options.voteModel.model], {
      as: options.voteModel.as
    })
    Model.app.models[options.voteModel.model].belongsTo(Model.app.models[options.userModel.model])
  }

  Model.hasMany(Model.app.models[options.voteModel.model], {
    as: options.voteModel.as,
    foreignKey: Model.definition.name.toLowerCase() + 'Id'
  })
  Model.app.models[options.voteModel.model].belongsTo(Model)

  Model.disableRemoteMethodByName('prototype.__create__' + options.voteModel.as)
  Model.disableRemoteMethodByName('prototype.__delete__' + options.voteModel.as)
  Model.disableRemoteMethodByName('prototype.__destroyById__' + options.voteModel.as)
  Model.disableRemoteMethodByName('prototype.__updateById__' + options.voteModel.as)

  Model.settings.acls.push({
    accessType: '*',
    principalType: 'ROLE',
    principalId: '$everyone',
    permission: 'ALLOW',
    property: [
      '__count__' + options.voteModel.as,
      '__get__' + options.voteModel.as,
      '__findById__' + options.voteModel.as
    ]
  })

  Model.settings.acls.push({
    accessType: '*',
    principalType: 'ROLE',
    principalId: '$authenticated',
    permission: 'ALLOW',
    property: ['__create__' + options.voteModel.as, '__updateById__' + options.voteModel.as]
  })

  IncludeThrough(Model, {
    relations: [options.voteModel.as],
    fields: {
      [options.voteModel.as]: 'type'
    }
  })
}
