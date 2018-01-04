'use strict'
const debug = require('debug')('mixins:Share')

module.exports = function(Share) {
  Share.setup = function() {
    Share.base.setup.call(this)
  }
}
