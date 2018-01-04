'use strict'
const debug = require('debug')('mixins:Invite')

module.exports = function(Invite) {
  Invite.setup = function() {
    Invite.base.setup.call(this)
  }
}
