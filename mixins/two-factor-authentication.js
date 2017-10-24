'use strict'
const debug = require('debug')('mixins:TwoFactorAuthentication')
const speakeasy = require('speakeasy')
const QRCode = require('qrcode')

module.exports = function(Model, options) {
  Model.on('attached', () => {
    if (typeof Model.app.models.TwoFactorAuthentication === 'undefined') {
      Model.app.loopback.getModel('TwoFactorAuthentication').on('attached', () => {
        init(Model, options)
      })
    } else {
      init(Model, options)
    }
  })
}

function init(Model, options) {
  const TwoFactorAuthentication = Model.app.models.TwoFactorAuthentication
  Model.hasOne(TwoFactorAuthentication, {
    as: 'twoFactorAuthentication',
    foreignKey: Model.definition.name.toLowerCase() + 'Id'
  })
  TwoFactorAuthentication.belongsTo(Model)

  TwoFactorAuthentication.observe('before save', function(ctx, next) {
    if (ctx.isNewInstance && ctx.instance) {
      ctx.instance.secret = speakeasy.generateSecret()
      QRCode.toDataURL(ctx.instance.secret.otpauth_url, function(err, data_url) {
        if (err) return next(err)

        ctx.instance.qrcode = data_url
        next()
      })
    } else {
      next()
    }
  })

  Model.observe('before save', function(ctx, next) {
    if (ctx.isNewInstance && ctx.instance) {
      ctx.instance.twoFactorAuthentication.create({}, err => next(err))
    } else {
      next()
    }
  })

  Model.prototype.verifyTwoFactorAuthentication = function(token, fn) {
    this.twoFactorAuthentication((err, twoFactorAuthentication) => {
      if (err) return fn(err)

      const verified = speakeasy.totp.verify({
        secret: twoFactorAuthentication.secret.base32,
        encoding: 'base32',
        token: token
      })

      if (verified) {
        fn()
      } else {
        let err = new Error('Invalid token: ' + token)
        err.statusCode = 400
        err.code = 'INVALID_TOKEN'
        fn(err)
      }
    })
  }

  Model.app.loopback.remoteMethod(Model.prototype.verifyTwoFactorAuthentication, {
    description: 'Verify a two-factor-authentication token',
    accessType: 'WRITE',
    accepts: [{arg: 'token', type: 'string', required: true}],
    http: {verb: 'get', path: '/verifyTwoFactorAuthentication'}
  })
}
