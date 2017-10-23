'use strict'
const debug = require('debug')('mixins:follow-system')
const IncludeThrough = require('loopback-include-through-mixin')

module.exports = function(Model, options) {
  Model.on('attached', () => {
    if (typeof Model.app.models.Follow === 'undefined') {
       Model.app.loopback.getModel('Follow').on('attached', () => {
        init(Model, options)
       })
    } else {
      init(Model, options)
    }
	})
}

function init(Model, options) {
  Model.hasMany(Model, {
  	as: 'followers',
  	foreignKey: 'followeeId',
  	keyThrough: 'userId',
  	through: Model.app.models.Follow
  })
	Model.hasMany(Model, {
		as: 'following',
		foreignKey: 'userId',
		keyThrough: 'followeeId',
		through: Model.app.models.Follow
	})

	Model.app.models.Follow.belongsTo(Model, {as: 'user', foreignKey: 'userId'})
	Model.app.models.Follow.belongsTo(Model, {as: 'followee', foreignKey: 'followeeId'})

  Model.disableRemoteMethodByName('prototype.__create__followers')
  Model.disableRemoteMethodByName('prototype.__delete__followers')
  Model.disableRemoteMethodByName('prototype.__destroyById__followers')
  Model.disableRemoteMethodByName('prototype.__updateById__followers')

  Model.disableRemoteMethodByName('prototype.__create__following')
  Model.disableRemoteMethodByName('prototype.__delete__following')
  Model.disableRemoteMethodByName('prototype.__destroyById__following')
  Model.disableRemoteMethodByName('prototype.__updateById__following')

	Model.settings.acls.push({
    accessType: '*',
    principalType: 'ROLE',
    principalId: '$everyone',
    permission: 'ALLOW',
    property: [
      '__count__followers',
      '__get__followers',
      '__findById__followers'
    ]
  })
  Model.settings.acls.push({
    accessType: '*',
    principalType: 'ROLE',
    principalId: '$authenticated',
    permission: 'ALLOW',
    property: [
      '__create__followers',
      '__updateById__followers'
    ]
  })

  Model.settings.acls.push({
    accessType: '*',
    principalType: 'ROLE',
    principalId: '$everyone',
    permission: 'ALLOW',
    property: [
      '__count__following',
      '__get__following',
      '__findById__following'
    ]
  })
  Model.settings.acls.push({
    accessType: '*',
    principalType: 'ROLE',
    principalId: '$authenticated',
    permission: 'ALLOW',
    property: [
      '__create__following',
      '__updateById__following'
    ]
  })

  IncludeThrough(Model, {
    relations: [
      'followers',
      'following'
    ],
    fields: {
      followers: 'type',
      following: 'type'
    },
  })
}