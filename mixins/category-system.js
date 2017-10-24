'use strict'
var debug = require('debug')('mixins:category-system')

module.exports = function(Model, options) {
  Model.on('attached', () => {
    if (typeof Model.app.models.Category === 'undefined') {
      Model.app.loopback.getModel('Category').on('attached', () => {
        init(Model, options)
      })
    } else {
      init(Model, options)
    }
  })
}

function init(Model, options) {
  const camelCasedName = Model.definition.name[0].toLowerCase() + Model.definition.name.slice(1)

  Model.hasAndBelongsToMany(Model.app.models.Category, {as: 'categories'})
  Model.app.models.Category.hasAndBelongsToMany(Model, {as: camelCasedName + 's'})

  Model.disableRemoteMethodByName('prototype.__create__categories')
  Model.disableRemoteMethodByName('prototype.__delete__categories')
  Model.disableRemoteMethodByName('prototype.__destroyById__categories')
  Model.disableRemoteMethodByName('prototype.__updateById__categories')

  Model.app.models.Category.disableRemoteMethodByName(
    'prototype.__destroyById__' + camelCasedName + 's'
  )
  Model.app.models.Category.disableRemoteMethodByName('prototype.__link__' + camelCasedName + 's')
  Model.app.models.Category.disableRemoteMethodByName('prototype.__unlink__' + camelCasedName + 's')
  Model.app.models.Category.disableRemoteMethodByName('prototype.__exists__' + camelCasedName + 's')
  Model.app.models.Category.disableRemoteMethodByName('prototype.__create__' + camelCasedName + 's')
  Model.app.models.Category.disableRemoteMethodByName('prototype.__delete__' + camelCasedName + 's')
  Model.app.models.Category.disableRemoteMethodByName(
    'prototype.__updateById__' + camelCasedName + 's'
  )
}
