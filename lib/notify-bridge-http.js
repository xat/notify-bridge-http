/*
 * notify-bridge-http
 * https://github.com/xat/notify-bridge-http
 *
 * Copyright (c) 2012 Simon Kusterer
 * Licensed under the MIT license.
 */

exports['notify-bridge-module'] = true;

var formidable = require('formidable');

var ERROR_CODES = {
  'OK'                  : '0',
  'MISSING_FIELDNAME'   : '1',
  'MISSING_METHOD'      : '2',
  'PARSE_ERROR'         : '3',
  'NOT_POST'            : '4'
};

var NotifyBridgeHttp = function(eventBus, program) {
  'use strict';

  var http = require('http'),
      auth = require('http-auth'),
      that = this,
      basic,
      app;

    this.eventBus = eventBus;

  if (program.httpAuth) {
    basic = auth({
      authRealm : "Private area.",
      authList : [program.httpUser + ':' + program.httpPassword]
    });
  }

  app = http.createServer(function(req, res) {
    if (req.method !== 'POST') {
      res.writeHead(400);
      res.end(ERROR_CODES.NOT_POST);
      return;
    }

    if (program.httpAuth) {
      basic.apply(req, res, function() {
        that._handleIncomingPost(req, res);
      });
    } else {
      that._handleIncomingPost(req, res);
    }
  });

  app.listen(program.httpPort, program.httpIp);
};

NotifyBridgeHttp.prototype._handleIncomingPost = function(req, res) {
  'use strict';

  var form = new formidable.IncomingForm(),
      that = this;

  form.on('error', function() {
    res.writeHead(400);
    res.end(ERROR_CODES.MISSING_FIELDNAME);
  });

  form.parse(req, function(err, fields) {
    that._parseRpc(fields.rpc, function(err, rpc) {
      if (err) {
        res.writeHead(400);
        res.end(err);
      } else {
        res.writeHead(200);
        res.end(ERROR_CODES.OK);
        that.eventBus.emit('rpc', rpc);
      }
    });
  });
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