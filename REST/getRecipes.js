'use strict'

var https = require('https')
var async = require('async')

var config = {
        DBHOST: 'yourcloudantid.cloudant.com',
        DB: 'recipes',
        KEY: 'APIKEY',
        PW: 'APIPASSWORD'
}

function munge(row, callback) {
  var doc = row.doc
  delete doc['_rev']
  if (!doc._attachments) {
    callback(null, doc);
    return
  }

  // Only one attachment
  var attachmentName
  for (attachmentName in doc._attachments) { break }

  var options = {
    method: 'GET',
    hostname: config.DBHOST,
    path: '/' + config.DB + '/' + doc._id + '/' + attachmentName,
    auth: config.KEY + ':' + config.PW,
    headers: { 'Content-type': 'application/octet-stream' }
  }

  var req = https.request(options, function(res) {
    res.setEncoding('binary');

    // get the entire result into data
    var data = "";
    res.on('data', function (chunk) {
      data += chunk
    });

    res.on('end', function () {
      if (res.statusCode != 200) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers))
        callback("fail", null);
      } else {
        try {
          var base64 = new Buffer(data, 'binary').toString('base64');
          doc._attachments[attachmentName] = { content_type: 'application/octet-stream', data: base64 }
        } catch(err) {
          console.log(err.stack)
        }
        callback(null, doc);
      }
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message)
    callback("fail", null);
  });

  req.end();
}

var options = {
  method: 'GET',
  hostname: config.DBHOST,
  path: '/' + config.DB + '/_all_docs?include_docs=true',
  auth: config.KEY + ':' + config.PW,
  headers: { 'Content-Type': 'application/json' }
}

var req = https.request(options, function(res) {
  res.setEncoding('utf8')

  // get the entire result into body
  var body = "";
  res.on('data', function (chunk) {
    body += chunk;
  });

  res.on('end', function () {
    if (res.statusCode != 200) {
      console.log('STATUS: ' + res.statusCode);
      console.log('HEADERS: ' + JSON.stringify(res.headers))
      return;
    }

    var rows = JSON.parse(body).rows;
    async.map(rows, munge, function(err, results) {
      console.log(JSON.stringify(results, null, 4));
    });
  })
})

req.on('error', function(e) {
  console.log('problem with request: ' + e.message)
})

req.end()
