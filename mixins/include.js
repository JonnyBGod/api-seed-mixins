'use strict'

module.exports = function(Model, options) {
  Model.beforeRemote('findById', injectIncludes)
  Model.beforeRemote('findOne', injectIncludes)
  Model.beforeRemote('find', injectIncludes)

  function injectIncludes(ctx, unused, next) {
    if (ctx.args.filter) {
      if (Object.prototype.toString.call(ctx.args.filter) !== '[object Object]') {
        ctx.args.filter = JSON.parse(ctx.args.filter)
      }

      if (ctx.args.filter.include) {
        if (Object.prototype.toString.call(ctx.args.filter.include) === '[object Array]') {
          if (Object.prototype.toString.call(options) === '[object Array]') {
            ctx.args.filter.include.concat(options)
          } else {
            ctx.args.filter.include.push(options)
          }
        } else {
          var inc = [ctx.args.filter.include]

          if (Object.prototype.toString.call(options) === '[object Array]') {
            inc.concat(options)
          } else {
            inc.push(options)
          }

          ctx.args.filter.include = inc
        }
      } else {
        ctx.args.filter.include = options
      }
    } else {
      ctx.args.filter = {
        include: options
      }
    }

    next()
  }
}
