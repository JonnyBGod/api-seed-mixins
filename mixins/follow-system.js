'use strict'
const debug = require('debug')('mixins:follow-system')
const IncludeThrough = require('loopback-include-through-mixin')

const defaultOptions = {
  model: 'Follow',
  as: 'followers',
  asTo: 'following'
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
    foreignKey: 'followeeId',
    keyThrough: 'followerId',
    through: Model.app.models[options.model]
  })
  Model.hasMany(Model, {
    as: options.asTo,
    foreignKey: 'followerId',
    keyThrough: 'followeeId',
    through: Model.app.models[options.model]
  })

  Model.app.models[options.model].belongsTo(Model, { as: 'follower', foreignKey: 'followerId' })
  Model.app.models[options.model].belongsTo(Model, { as: 'followee', foreignKey: 'followeeId' })

  Model.disableRemoteMethodByName('prototype.__create__' + options.as)
  Model.disableRemoteMethodByName('prototype.__delete__' + options.as)
  Model.disableRemoteMethodByName('prototype.__destroyById__' + options.as)
  Model.disableRemoteMethodByName('prototype.__updateById__' + options.as)

  Model.disableRemoteMethodByName('prototype.__create__' + options.asTo)
  Model.disableRemoteMethodByName('prototype.__delete__' + options.asTo)
  Model.disableRemoteMethodByName('prototype.__destroyById__' + options.asTo)
  Model.disableRemoteMethodByName('prototype.__updateById__' + options.asTo)

  Model.settings.acls.push({
    accessType: '*',
    principalType: 'ROLE',
    principalId: '$everyone',
    permission: 'ALLOW',
    property: ['__count__' + options.as, '__get__' + options.as, '__findById__' + options.as]
  })
  Model.settings.acls.push({
    accessType: '*',
    principalType: 'ROLE',
    principalId: '$authenticated',
    permission: 'ALLOW',
    property: ['__create__' + options.as, '__updateById__' + options.as]
  })

  Model.settings.acls.push({
    accessType: '*',
    principalType: 'ROLE',
    principalId: '$everyone',
    permission: 'ALLOW',
    property: ['__count__' + options.asTo, '__get__' + options.asTo, '__findById__' + options.asTo]
  })
  Model.settings.acls.push({
    accessType: '*',
    principalType: 'ROLE',
    principalId: '$authenticated',
    permission: 'ALLOW',
    property: ['__create__' + options.asTo, '__updateById__' + options.asTo]
  })

  IncludeThrough(Model, {
    relations: [options.as, options.asTo],
    fields: {
      [options.as]: 'type',
      [options.asTo]: 'type'
    }
  })

  // TODO:
  // - Remote Method getMutualFriends
  // - Remote Method countMutualFriends
  // - Remote Method getFriendsDeep
  // - Remote Method countFriendsDeep
}
