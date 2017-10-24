'use strict'
var debug = require('debug')('mixins:s3-file-storage')
var AWS = require('aws-sdk')
var async = require('async')

module.exports = function(Model, options) {
  var app, s3

  Model.on('attached', function() {
    app = Model.app
    s3 = new AWS.S3(
      options.AWS || {
        accessKeyId: app.get('awsAccessKeyId'),
        secretAccessKey: app.get('awsSecretAccessKey'),
        region: app.get('awsRegion')
      }
    )

    if (typeof Model.app.models.S3File === 'undefined') {
      Model.app.loopback.getModel('S3File').on('attached', () => {
        init()
      })
    } else {
      init()
    }
  })

  function init() {
    Model.prototype.s3PUTSignedUrl = function(key, opts, cb) {
      opts = opts || {}

      var params = {
        Bucket: opts.Bucket || options.Bucket || app.get('s3Bucket'),
        Key: key,
        ContentType: opts.fileType,
        CacheControl:
          opts.CacheControl ||
          options.CacheControl ||
          app.get('s3CacheControl') ||
          'max-age=86400, public',
        ACL: opts.ACL || options.ACL || app.get('s3ACL') || 'public-read',
        StorageClass:
          opts.StorageClass ||
          options.StorageClass ||
          app.get('s3StorageClass') ||
          'REDUCED_REDUNDANCY'
      }

      s3.getSignedUrl('putObject', params, cb)
    }

    Model.remoteMethod('s3PUTSignedUrl', {
      isStatic: false,
      description: 'Get a S3 Signed URL for direct file uploads.',
      accessType: 'WRITE',
      accepts: [{ arg: 'key', type: 'string' }, { arg: 'options', type: 'object' }],
      returns: { arg: 'url', type: 'string', root: true },
      http: { verb: 'get', path: '/s3PUTSignedUrl' }
    })

    Model.prototype.s3GETSignedUrl = function(key, cb) {
      s3.getSignedUrl(
        'getObject',
        {
          Bucket: opts.Bucket || options.Bucket || app.get('s3Bucket'),
          Key: key
        },
        cb
      )
    }

    Model.remoteMethod('s3GETSignedUrl', {
      isStatic: false,
      description: 'Get a S3 Signed URL for direct file access.',
      accessType: 'READ',
      accepts: [{ arg: 'key', type: 'string' }],
      returns: { arg: 'url', type: 'string', root: true },
      http: { verb: 'get', path: '/s3GETSignedUrl' }
    })

    var S3File = Model.app.models.S3File

    S3File.observe('before delete', function(ctx, next) {
      if (ctx.where.id) {
        S3File.findById(ctx.where.id, function(err, s3File) {
          if (err) return next(err)

          var params = {
            Bucket: opts.Bucket || options.Bucket || app.get('s3Bucket'),
            Key: s3File.key
          }
          s3.deleteObject(params, next)
        })
      } else {
        next()
      }
    })

    for (var relationName in options.relations) {
      var relation = options.relations[relationName]

      if (relation.type === 'embedsOne') {
        Model.embedsOne(S3File, {
          as: relationName,
          property: relation.property,
          options: {
            validate: false
          }
        })
      } else if (relation.type === 'embedsMany') {
        Model.embedsMany(S3File, {
          as: relationName,
          property: relation.property,
          options: {
            validate: false
          }
        })
      } else if (relation.type === 'hasOne') {
        Model.hasOne(S3File, {
          as: relationName,
          foreignKey: relation.foreignKey
        })
      } else if (relation.type === 'hasMany') {
        Model.hasMany(S3File, {
          as: relationName,
          foreignKey: relation.foreignKey
        })
      }
    }

    Model.observe('before delete', function(ctx, next) {
      var name = idName(Model)
      var hasInstanceId = ctx.instance && ctx.instance[name]
      var hasWhereId = ctx.where && ctx.where[name]

      if (!hasWhereId || !hasInstanceId) {
        debug('Skipping delete for ', Model.definition.name)
        return next()
      }

      var id = getIdValue(Model, ctx.instance || ctx.where)
      var where = {}
      where[idName(Model)] = id

      Model.findOne({
        where: where
      })
        .then(function(instance) {
          async.each(
            Object.keys(options.relations),
            function(relationName, callback) {
              var relation = options.relations[relationName]

              if (relation.type === 'embedsOne' || relation.type === 'hasOne') {
                instance[relationName].destroy(callback)
              } else {
                instance[relationName](function(err, s3Files) {
                  if (err) return next(err)

                  var params = {
                    Bucket: opts.Bucket || options.Bucket || app.get('s3Bucket'),
                    Delete: {
                      Objects: s3Files.map(function(s3File) {
                        return { Key: s3File.key }
                      }),
                      Quiet: true
                    }
                  }
                  s3.deleteObjects(params, function(err) {
                    if (err) console.log(err, err.stack)
                  })

                  instance[relationName].destroyAll(callback)
                })
              }
            },
            next
          )
        })
        .catch(function(err) {
          debug('Error fetching instance for delete', err)
          throw err
        })
    })
  }
}

function idName(m) {
  return m.definition.idName() || 'id'
}

function getIdValue(m, data) {
  return data && data[idName(m)]
}
