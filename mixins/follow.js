'use strict'
const debug = require('debug')('mixins:Follow')

module.exports = function(Follow) {
  Follow.setup = function() {
    Follow.base.setup.call(this)
  }
}
