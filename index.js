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

    process.on('exit', function () {
      console.log('skiplist_mem:', buffer.readUInt32LE(0))
    })

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
            var key = value.key + '!'+seq
            var c = ll.insertString(buffer, start, key)
            since.set(seq)
            read(null, next)
          })
        }
      },
      get: function (key, cb) {
        var ptr = ll.findString(
          buffer, start,
          key, null, compare
        )
        if(ptr) {
          var sptr = buffer.readUInt32LE(ptr)
          var str = buffer.toString('utf8', sptr+4, sptr+4+buffer.readUInt32LE(sptr))
          log.get(+str.split('!')[1], cb)
        }
      },
      methods: { get: 'async'}
    }
  }
}

