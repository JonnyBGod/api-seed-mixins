'use strict'
const debug = require('debug')('mixins:invite-system')

module.exports = function(Model, options) {
  Model.on('attached', () => {
    if (Model.settings.base !== 'User' && Model.base.settings.base !== 'User') {
      throw new Error('Invite system can only be applied to User extended models!')
    }

    if (typeof Model.app.models.Invite === 'undefined') {
      Model.app.loopback.getModel('Invite').on('attached', () => {
        init(Model, options)
      })
    } else {
      init(Model, options)
    }
  })
}

function init(Model, options) {
  const Invite = Model.app.models.Invite

  Model.defineProperty('active', { type: 'boolean', default: false })

  Model.hasMany(Invite, {
    as: 'invites',
    foreignKey: Model.definition.name.toLowerCase() + 'Id'
  })
  Invite.belongsTo(Model)
  Invite.belongsTo(Model, { as: 'invitedUser', foreignKey: 'invitedUserId' })

  Model.disableRemoteMethodByName('prototype.__delete__invites')
  Model.disableRemoteMethodByName('prototype.__destroyById__invites')
  Model.disableRemoteMethodByName('prototype.__updateById__invites')

  Model.settings.acls.push({
    accessType: '*',
    principalType: 'ROLE',
    principalId: '$everyone',
    permission: 'ALLOW',
    property: ['__count__invites']
  })

  Model.settings.acls.push({
    accessType: '*',
    principalType: 'ROLE',
    principalId: '$authenticated',
    permission: 'ALLOW',
    property: [
      '__get__invites',
      '__findById__invites',
      '__create__invites',
      '__updateById__invites'
    ]
  })

  Model.settings.acls.push({
    accessType: '*',
    principalType: 'ROLE',
    principalId: '$owner',
    permission: 'DENY',
    property: ['adminInvite']
  })

  Model.settings.acls.push({
    accessType: '*',
    principalType: 'ROLE',
    principalId: 'admin',
    permission: 'ALLOW',
    property: ['adminInvite']
  })

  Model.observe('before save', function(ctx, next) {
    if (ctx.isNewInstance && ctx.instance) {
      Invite.findOne(
        {
          email: ctx.instance.email
        },
        (err, invite) => {
          if (err) return debug(err)

          if (invite) {
            ctx.instance.active = true
            invite.updateAttribute('used', true, () => {})
          }

          next()
        }
      )
    } else {
      next()
    }
  })

  Model.activate = function(uid, token, redirect, fn) {
    fn = fn || utils.createPromiseCallback()
    Model.findById(uid, (err, user) => {
      if (err) return fn(err)

      if (user) {
        Invite.find(
          {
            where: {
              invitedUserId: uid,
              user: true
            }
          },
          (err, invite) => {
            if (err) return fn(err)

            if (invite && invite.length > 0) {
              err = new Error('You can only use one invite.')
              err.statusCode = 404
              err.code = 'USER_ALREADY_ACTIVATED'
              fn(err)
            } else {
              Invite.findById(token, (err, invite) => {
                if (err) return fn(err)

                if (!invite || invite.used) {
                  err = new Error('Invalid token: ' + token)
                  err.statusCode = 400
                  err.code = 'INVALID_TOKEN'
                  fn(err)
                } else {
                  invite.used = true
                  invite.invitedUserId = user.id
                  invite.save(err => {
                    if (err) {
                      fn(err)
                    } else {
                      user.active = true
                      user.save(err => {
                        if (err) {
                          fn(err)
                        } else {
                          fn()
                        }
                      })
                    }
                  })
                }
              })
            }
          }
        )
      } else {
        err = new Error('User not found: ' + uid)
        err.statusCode = 404
        err.code = 'USER_NOT_FOUND'
        fn(err)
      }
    })
    return fn.promise
  }

  Model.remoteMethod('activate', {
    description: 'Activate a user registration with invite token.',
    accepts: [
      { arg: 'uid', type: 'string', required: true },
      { arg: 'token', type: 'string', required: true },
      { arg: 'redirect', type: 'string' }
    ],
    http: { verb: 'get', path: '/activate' }
  })

  Model.prototype.adminInvite = function(data, fn) {
    const entries = data.text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi)

    async.each(
      entries,
      (entry, callback) => {
        this.invites.create(
          {
            email: entry,
            admin: true
          },
          callback
        )
      },
      fn
    )
  }

  Model.remoteMethod('prototype.adminInvite', {
    description: 'Send multiple invites',
    accessType: 'WRITE',
    accepts: {
      arg: 'data',
      type: 'object',
      description: 'csv',
      http: {
        source: 'body'
      }
    },
    http: { verb: 'post', path: '/adminInvite' }
  })
}
