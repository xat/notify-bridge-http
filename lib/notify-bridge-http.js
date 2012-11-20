/*
 * notify-bridge-http
 * https://github.com/xat/notify-bridge-http
 *
 * Copyright (c) 2012 Simon Kusterer
 * Licensed under the MIT license.
 */

exports['notify-bridge-module'] = true;

var ERROR_CODES = {
  'OK': '0',
  'MISSING_FIELDNAME': '1',
  'MISSING_METHOD': '2',
  'PARSE_ERROR': '3'
};

var NotifyBridgeHttp = function(eventBus, program) {
  'use strict';

  var express = require('express'),
      app = express(),
      that = this;

  app.use(express.bodyParser());

  if (program.httpAuth) {
    app.use(express.basicAuth(program.httpUser, program.httpPassword));
  }

  app.post('/', function(req, res) {
    that._parseRpc(req.body.rpc, function(err, rpc) {
      if (err) {
        res.send(err, 400);
      } else {
        res.send(ERROR_CODES.OK, 200);
        eventBus.emit('rpc', rpc);
      }
    });
  });

  app.listen(program.httpPort, program.httpIp);
};

NotifyBridgeHttp.prototype._parseRpc = function(raw, cb) {
  'use strict';

  if (typeof raw === 'undefined') {
    cb(ERROR_CODES.MISSING_FIELDNAME);
    return;
  }
  try {
    var rpc = JSON.parse(raw);
    if (typeof rpc.method === 'undefined') {
      cb(ERROR_CODES.MISSING_METHOD);
      return;
    }
    cb(null, rpc);
  } catch(e) {
    cb(ERROR_CODES.PARSE_ERROR);
  }
};


exports.init = function(eventBus, program) {
  'use strict';

  return new NotifyBridgeHttp(eventBus, program);
};