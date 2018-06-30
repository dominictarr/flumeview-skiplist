var Flume = require('flumedb')
var Log = require('flumelog-offset')
var Index = require('../')
var codec = require('flumecodec')

var decodes = 0, time = 0
var codec = {
  encode: function (o) {
    var s = JSON.stringify(o)
    return s
  },
  decode: function (s) {
    decodes ++
//    var start = Date.now()
    var start = process.hrtime()
    var v = JSON.parse(s.toString())
    time += process.hrtime(start)[1]
  //  time += Date.now()-start
    return v
  },
  buffer: false,
}

require('test-flumeview-index/bench')(function (file, seed) {
  return Flume(Log(file+'/log.offset', 1024, codec))
    .use('index', Index(1, function (a, b) {
      return a.key < b.key ? -1 : a.key > b.key ? 1 : 0
    }))
})


process.on('exit', function () {
  console.log('decodes', decodes, time/1000000000)
})
