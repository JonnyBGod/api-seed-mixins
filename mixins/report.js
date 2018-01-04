'use strict'
const debug = require('debug')('mixins:Report')

module.exports = function(Report) {
  Report.setup = function() {
    Report.base.setup.call(this)
  }
}
