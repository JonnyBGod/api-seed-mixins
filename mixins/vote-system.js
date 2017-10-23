'use strict'
const debug = require('debug')('mixins:vote-system')
const IncludeThrough = require('loopback-include-through-mixin')

module.exports = function(Model, options) {
  Model.on('attached', () => {
    if (typeof Model.app.models.Vote === 'undefined') {
       Model.app.loopback.getModel('Vote').on('attached', () => {
        init(Model, options)
       })
    } else {
      init(Model, options)
    }
  })
}

function init(Model, options) {
  Model.hasMany(Model.app.models.Vote, {
    as: 'votes',
    foreignKey: Model.definition.name.toLowerCase() + 'Id'
  })
  Model.app.models.Vote.belongsTo(Model)

  Model.disableRemoteMethodByName('prototype.__create__votes')
  Model.disableRemoteMethodByName('prototype.__delete__votes')
  Model.disableRemoteMethodByName('prototype.__destroyById__votes')
  Model.disableRemoteMethodByName('prototype.__updateById__votes')

  Model.settings.acls.push({
    accessType: '*',
    principalType: 'ROLE',
    principalId: '$everyone',
    permission: 'ALLOW',
    property: [
      '__count__votes',
      '__get__votes',
      '__findById__votes'
    ]
  })

  Model.settings.acls.push({
    accessType: '*',
    principalType: 'ROLE',
    principalId: '$authenticated',
    permission: 'ALLOW',
    property: [
      '__create__votes',
      '__updateById__votes'
    ]
  })

  IncludeThrough(Model, {
    relations: [
      'votes'
    ],
    fields: {
      votes: 'type'
    },
  })
}