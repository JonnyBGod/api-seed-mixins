'use strict'
var debug = require('debug')('mixins:reply-system')

module.exports = function(Model, options) {
  Model.on('attached', () => {
    if (typeof Model.app.models.Reply === 'undefined') {
       Model.app.loopback.getModel('Reply').on('attached', () => {
        init(Model, options)
       })
    } else {
      init(Model, options)
    }
	})
}

function init(Model, options) {
  Model.hasMany(Model, {
  	as: 'replies',
  	foreignKey: 'replyingId',
  	keyThrough: 'replyerId',
  	through: Model.app.models.Reply
  })
	Model.hasOne(Model, {
		as: 'replying',
		foreignKey: 'replyerId',
		keyThrough: 'replyingId',
		through: Model.app.models.Reply
	})

	Model.app.models.Reply.belongsTo(Model, {as: 'reply', foreignKey: 'replyerId'})
	Model.app.models.Reply.belongsTo(Model, {as: 'replying', foreignKey: 'replyingId'})

  Model.disableRemoteMethodByName('prototype.__create__replies')
  Model.disableRemoteMethodByName('prototype.__delete__replies')
  Model.disableRemoteMethodByName('prototype.__destroyById__replies')
  Model.disableRemoteMethodByName('prototype.__updateById__replies')

  Model.disableRemoteMethodByName('prototype.__create__replying')
  Model.disableRemoteMethodByName('prototype.__delete__replying')
  Model.disableRemoteMethodByName('prototype.__destroyById__replying')
  Model.disableRemoteMethodByName('prototype.__updateById__replying')
}