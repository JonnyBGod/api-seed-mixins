'use strict'
var slug = require('slugify')

module.exports = function(Model, opt) {
  var options = {
    separator: '-',
    slug: 'slug',
    fields: ['title'],
    lowercase: true
  }

  if (opt instanceof Object) {
    for (var item in opt) {
      options[item] = opt[item]
    }
  } else if (opt instanceof Function) {
    cb = opt
  }

  Model.defineProperty(options.slug, {type: String})

  Model.on('attached', function() {
    Model.observe('before save', createSlug)
    Model.observe('access', querySlug)
  })

  function querySlug(ctx, next) {
    if (ctx.query.where) {
      if (ctx.query.where.id) {
        if (!ctx.query.where.or) {
          ctx.query.where.or = []
        }
        ctx.query.where.or = [
          ...ctx.query.where.or,
          {
            id: ctx.query.where.id
          },
          {
            [options.slug]: ctx.query.where.id
          }
        ]
        delete ctx.query.where.id
      }
    }
    next()
  }

  function createSlug(ctx, cb) {
    if (ctx.currentInstance && !ctx.currentInstance.slug) {
    } else if (!ctx.isNewInstance) {
      return cb()
    }

    var auxdata = ctx.instance || ctx.data

    function make(newdata) {
      var strlug = ''
      options.fields.forEach(function(field) {
        strlug += options.separator + newdata[field]
      })

      // fix
      var startAt = options.separator.length
      if (startAt == 0) {
        strlug = strlug.replace(' ', '')
      }
      strlug = slug(strlug.substr(startAt), options.separator)

      if (options.lowercase) {
        strlug = strlug.toLowerCase()
      }
      strlug = slugify(strlug)
      newdata[options.slug] = newdata[options.slug] || ''
      var iof =
        newdata[options.slug].lastIndexOf(options.separator) == -1
          ? newdata[options.slug].length
          : newdata[options.slug].lastIndexOf(options.separator)

      if (
        !isNumber(parseInt(newdata[options.slug].substr(iof + 1, newdata[options.slug].length)))
      ) {
        iof = newdata[options.slug].length
      }

      //Deficiencia si la cadena tiene un numero al final.
      if (newdata[options.slug].substr(0, iof) == strlug && newdata[options.slug].length) {
        newdata[options.slug] = newdata[options.slug]
        return cb(null)
      } else {
        newdata[options.slug] = strlug
        var obj = {}
        obj[options['slug']] = new RegExp('^' + strlug + '($|' + options.separator + ')')
        Model.find(
          {
            where: obj
          },
          function(err, docs) {
            if (err) {
              return cb(err)
            } else if (!docs.length) {
              return cb(null)
            } else {
              var max = docs.reduce(function(mx, doc) {
                var docSlug = doc[options.slug]
                var count = 1
                if (docSlug != strlug) {
                  count = docSlug.match(new RegExp(strlug + options.separator + '([0-9]+)$'))
                  count = (count instanceof Array ? parseInt(count[1]) : 0) + 1
                }
                return count > mx ? count : mx
              }, 0)
              if (max == 1) {
                newdata[options.slug] = strlug + options.separator + (max + 1)
              } else if (max > 0) {
                newdata[options.slug] = strlug + options.separator + max
              } else {
                newdata[options.slug] = strlug
              }
              ctx.currentInstance = newdata
              return cb(null)
            }
          }
        )
      }
    }

    var band = false
    for (var field of options.fields) {
      if (!auxdata[field]) return cb(null)
    }

    if (ctx.currentInstance) {
      if (ctx.currentInstance.id) {
        band = true
      } else {
        auxdata = ctx.currentInstance
        return make(auxdata)
      }
    }

    if (band) {
      Model.findOne(
        {
          where: {
            id: ctx.currentInstance.id
          }
        },
        function(err, data) {
          if (err) return cb(err)
          if (!data) return cb(auxdata)
          for (var i in data) {
            if (!auxdata[i]) {
              if (data.hasOwnProperty(i)) auxdata[i] = data[i]
            }
          }
          auxdata[options.slug] = data[options.slug]
          make(auxdata)
        }
      )
    } else {
      if (auxdata.id) {
        Model.findOne(
          {
            where: {
              id: auxdata.id
            }
          },
          function(err, data) {
            if (err) return cb(err)
            if (!data) return cb(auxdata)
            for (var i in data) {
              if (!auxdata[i]) {
                if (data.hasOwnProperty(i)) auxdata[i] = data[i]
              }
            }
            auxdata[options.slug] = data[options.slug]
            make(auxdata)
          }
        )
      } else {
        make(auxdata)
      }
    }
  }
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n)
}

function slugify(str) {
  var from = 'ąàáäâãåæćęèéëêìíïîłńòóöôõøśùúüûñçżź',
    to = 'aaaaaaaaceeeeeiiiilnoooooosuuuunczz',
    regex = new RegExp('[' + from.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1') + ']', 'g')

  if (str == null) return ''

  str = String(str)
    .toLowerCase()
    .replace(regex, function(c) {
      return to.charAt(from.indexOf(c)) || '_'
    })

  return str
    .replace(/[^\w\s-]/g, '')
    .replace(/([A-Z])/g, '-$1')
    .replace(/[-_\s]+/g, '_')
    .toLowerCase()
}
