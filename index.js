var ll = require('skiplist')
var d = require('skiplist/debug')
var Cache = require('lru_cache').LRUCache
var Obv = require('obv')
module.exports = function (version, compare) {

  return function (log, name) {
    var since = Obv()
    since.set(-1)
    var buffer = Buffer.alloc(1024*1024*2)
    var l = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    var start = d.item(buffer, 0, l)

    var cache = new Cache(5000)
    var hits = {}

    function get (offset, cb) {
      var value = cache.get(offset.toString())

      if(value)
        cb(null, value)
      else {
        log.get(offset-1, function (err, value) {
          cache.set(offset.toString(), value)
          hits[offset] = true
          cb(err, value)
        })
      }
    }

    return {
      since: since,
      createSink: function (cb) {
        return function (read) {
          read(null, function next (err, data) {
            var seq = data.seq
            var value = data.value
            ll.insertAsync(
              buffer, get, start,
              value, seq+1, null,
              compare,
              function (err, ptr) {
                since.set(seq)
                read(null, next)
              }
            )
          })
        }
      },
      get: function (key, cb) {
        ll.findAsync(
          buffer, get, start,
          {key: key}, null, compare, cb
        )
      },
      methods: { get: 'async'}
    }
  }
}










