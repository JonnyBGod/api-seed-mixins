'use strict'
const debug = require('debug')('mixins:Review')

module.exports = function(Review) {
  Review.setup = function() {
    Review.base.setup.call(this)
  }
}
