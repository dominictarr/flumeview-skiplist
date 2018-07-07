var ll = require('skiplist')
var ll_wasm = require('skiplist/wasm')

var d = require('skiplist/debug')
var Cache = require('lru_cache').LRUCache
var Obv = require('obv')
module.exports = function (version, compare) {

  return function (log, name) {
    var since = Obv()
    since.set(-1)
    //var buffer = Buffer.alloc(1024*1024*2)
    var buffer = ll_wasm.grow(32) //Buffer.alloc(1024*1024*2)
    var l = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    var start = d.item(buffer, 0, l)

    function get (offset, cb) {
      log.get(offset-1, function (err, value) {
        cb(err, value)
      })
    }

    return {
      since: since,
      createSink: function (cb) {
        return function (read) {
          read(null, function next (err, data) {
            var seq = data.seq
            var value = data.value
            var key = value.key + '!'+seq
            var c = ll.insertString(buffer, start, key)
            since.set(seq)
            read(null, next)
          })
        }
      },
      get: function (key, cb) {
        var ptr = ll_wasm.findString(start, key, l.length - 1)
        if(ptr) {
          var sptr = buffer.readUInt32LE(ptr)
          if(sptr === 0) return cb(new Error('not found:'+key))
          var str = buffer.toString('utf8', sptr+4, sptr+4+buffer.readUInt32LE(sptr))
          log.get(+str.split('!')[1], cb)
        }
      },
      methods: { get: 'async'}
    }
  }
}

