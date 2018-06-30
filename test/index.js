var Flume = require('flumedb')
var Log = require('flumelog-offset')
var Index = require('../')
var codec = require('flumecodec')

require('test-flumeview-index')(function (file, seed) {
  return Flume(Log(file+'/log.offset', 1024, codec.json))
    .use('index', Index(1, function (a, b) {
      return a.key < b.key ? -1 : a.key > b.key ? 1 : 0
    }))
})





