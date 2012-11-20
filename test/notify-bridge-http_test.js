var notify_bridge_http = require('../lib/notify-bridge-http.js');
var http = require('http');
var EventEmitter = require('events').EventEmitter;
var request = require('request');
var eventBus = new EventEmitter();

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

var bridgeHttp = notify_bridge_http.init(eventBus,
  {
    'httpIp': '127.0.0.1',
    'httpPort': '4440',
    'httpAuth': true,
    'httpUser': 'admin',
    'httpPassword': 'admin'
  }
);

exports['init'] = {

  setUp: function(done) {
    done();
  },

  'parsing': function(test) {

    bridgeHttp._parseRpc(undefined, function(err) {
      test.equal(err, '1', 'should be 1.');
    });

    bridgeHttp._parseRpc('nonvalidjson', function(err) {
      test.equal(err, '3', 'should be 3.');
    });

    bridgeHttp._parseRpc('{}', function(err) {
      test.equal(err, '2', 'should be 2.');
    });

    bridgeHttp._parseRpc('{"method":"xyz"}', function(err) {
      test.equal(err, undefined, 'should be undefined.');
    });

    test.done();
  },

  'wrong authentication': function(test) {

    request({
      uri:'http://127.0.0.1:4440',
      method: 'post',
      auth: 'admin:xyz'
    }, function(err, res, body) {
      test.equal(res.statusCode, 401, 'should deny access');
      test.done();
    });

  },

  'correct authentication / missing post field': function(test) {

    request({
      uri:'http://127.0.0.1:4440',
      method: 'post',
      auth: 'admin:admin'
    }, function(err, res, body) {
      test.equal(res.statusCode, 400, 'access should be granted');
      test.equal(body, '1', 'should return 1');
      test.done();
    });

  },

  'correct authentication / invalid json': function(test) {

    request({
      uri:'http://127.0.0.1:4440',
      method: 'post',
      auth: 'admin:admin',
      form: {rpc:'test'}
    }, function(err, res, body) {
      test.equal(res.statusCode, 400, 'access should be granted');
      test.equal(body, '3', 'should return 3');
      test.done();
    });

  },

  'correct authentication / missing method': function(test) {

    request({
      uri:'http://127.0.0.1:4440',
      method: 'post',
      auth: 'admin:admin',
      form: {rpc:'{}'}
    }, function(err, res, body) {
      test.equal(res.statusCode, 400, 'access should be granted');
      test.equal(body, '2', 'should return 2');
      test.done();
    });

  },

  'correct authentication / correct rpc': function(test) {

    eventBus.on('rpc', function(data) {
      test.deepEqual(data, {'method':'doSomething'}, 'should be the same object');
      test.done();
    });

    request({
      uri:'http://127.0.0.1:4440',
      method: 'post',
      auth: 'admin:admin',
      form: {rpc:'{"method":"doSomething"}'}
    }, function(err, res, body) {
      test.equal(res.statusCode, 200, 'access should be allowed');
      test.equal(body, '0', 'should return 0');
      test.done();
    });

  }
};
