'use strict'
const debug = require('debug')('mixins:Vote')

module.exports = function(Vote) {
  Vote.setup = function() {
    Vote.base.setup.call(this)
  }
}
