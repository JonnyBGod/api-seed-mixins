'use strict'
const debug = require('debug')('mixins:Reply')

module.exports = function(Reply) {
  Reply.setup = function() {
    Reply.base.setup.call(this)
  }
}
