'use strict'

var https = require('https')

var dbname = 'recipes';
var credentials = { username: 'yourcloudantid', password: 'yourcloudantpassword' };

function createDb(dbname, credentials, cbfunc) {

  var options = {
    method: 'PUT',
    hostname: credentials.username + '.cloudant.com',
    path: '/' + dbname,
    auth: credentials.username + ':' + credentials.password,
    headers: { 'Accept': 'application/json' }
  }

  var req = https.request(options, function(res) {
    res.setEncoding('utf8')

    // get the entire result into body
    var body = "";
    res.on('data', function (chunk) {
      body += chunk;
    });

    res.on('end', function () {
      if (res.statusCode != 201) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers))
        cbfunc(null);
      } else {
        //var stuff = JSON.parse(body);
        //console.log(JSON.stringify(stuff, null, 4));
        cbfunc('success');
      }
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message)
    cbfunc(null);
  })

  req.end()
}

function createKey(credentials, cbfunc) {

  var options = {
    method: 'POST',
    hostname: credentials.username + '.cloudant.com',
    path: '/_api/v2/api_keys',
    auth: credentials.username + ':' + credentials.password,
    headers: { 'Accept': 'application/json' }
  }

  var req = https.request(options, function(res) {
    res.setEncoding('utf8')

    // get the entire result into body
    var body = "";
    res.on('data', function (chunk) {
      body += chunk;
    });

    res.on('end', function () {
      if (res.statusCode != 201) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers))
        cbfunc(null);
      } else {
        var keydoc = JSON.parse(body);
        //console.log(JSON.stringify(keydoc, null, 4));
        cbfunc(keydoc);
      }
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message)
    cbfunc(null);
  })

  req.end()
}

function setPermissions(dbname, key, credentials, cbfunc) {

  var permissions = { };
  permissions[key] =  [ "_reader", "_writer", "_replicator" ];
  var payload = JSON.stringify({"cloudant": permissions} , null, 4)

  var options = {
    method: 'PUT',
    hostname: credentials.username + '.cloudant.com',
    path: '/_api/v2/db/' + dbname + '/_security',
    auth: credentials.username + ':' + credentials.password,
    headers: {
      'Content-type': 'application/json',
      'Content-Length': payload.length,
      'Accept': 'application/json'
    }
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
        cbfunc(null);
      } else {
        var response = JSON.parse(body);
        //console.log(JSON.stringify(response, null, 4));
        cbfunc(response);
      }
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message)
    cbfunc(null);
  })

  req.write(payload)
  req.end()
}

function loadRecipes(dbname, credentials, cbfunc) {
  var recipes = require('./recipes.json')
  var payload = JSON.stringify({"docs": recipes}, null, 4)
  var len = Buffer.byteLength(payload, 'utf8')

  var options = {
    method: 'POST',
    hostname: credentials.username + '.cloudant.com',
    path: '/' + dbname + '/_bulk_docs',
    auth: credentials.username + ':' + credentials.password,
    headers: { 'Content-type': 'application/json',
               'Accept': 'application/json',
               'Content-Length': len }
  }

  var req = https.request(options, function(res) {
    res.setEncoding('utf8')

    // get the entire result into body
    var body = "";
    res.on('data', function (chunk) {
      body += chunk;
    });

    res.on('end', function () {
      if (res.statusCode != 201) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers))
        cbfunc(null);
      } else {
        var response = JSON.parse(body);
        //console.log(JSON.stringify(response, null, 4));
        cbfunc(response);
      }
    });
  })

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message)
    cbfunc(null);
  })

  req.write(payload)
  req.end()
}

createDb(dbname, credentials, function(response) {

  if (response) {
    createKey(credentials, function(keydoc) {
      if (keydoc) {
        setPermissions(dbname, keydoc.key, credentials, function(response) {
          if (response) {
            loadRecipes(dbname, credentials, function(response) {
              if (response) {
                console.log("createDb completed.");
                console.log("hostname = "+credentials.username+".cloudant.com");
                console.log("dbname = "+dbname);
                console.log("key = "+keydoc.key);
                console.log("password = "+keydoc.password);
              }
            });
          }
        });
      }
    }); 
  }

});
