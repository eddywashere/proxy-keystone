# Proxy-Keystone

A proxy for OpenStack Keystone service catalog endpoints built on top of http-proxy.

## Installation

```sh
npm install proxy-keystone
```

## [Example](https://passport-keystone-proxy.herokuapp.com/)

Check out the [live demo](https://passport-keystone-proxy.herokuapp.com/), source code [here](https://github.com/eddywashere/passport-keystone/tree/master/examples), to see an express app configured for authentication with the [Rackspace Cloud Identity Service](http://docs.rackspace.com/auth/api/v2.0/auth-client-devguide/content/QuickStart-000.html) and [Passport-Keystone](https://github.com/eddywashere/passport-keystone).

## Documentation

```javascript
var express = require('express');
var app = express();
var proxyKeystone = require('proxy-keystone');

// proxy-keystone requires you to bring your own authentication middleware
// it should set req.user with a token and service catalog
app.use(function(req, res, next) {
  req.user = {
    token: '12345678910',
    serviceCatalog:[{
      name:"swift",
      endpoints:[{
        "region":"RegionOne",
        "internalURL":"http://127.0.0.1:8080/v1/AUTH_1",
        "publicURL":"http://swift.publicinternets.com/v1/AUTH_1"
      }]
    }]
  };
  next();
});

app.all('/proxy/*', proxyKeystone());

var server = app.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});
```

### Custom Usage

Sometimes the `req` object is organized differently. The `options.token` and `options.catalog` values are used to read keys off the request object. In the following example the user identity is located at `req.current_user` and a custom user agent is supplied.

```javascript
// example middleware to set user on req object
app.use(function(req, res, next) {
  req.current_user = {
    key: '12345678910',
    catalog:[{
      name:"swift",
      endpoints:[{
        "region":"RegionOne",
        "internalURL":"http://127.0.0.1:8080/v1/AUTH_1",
        "publicURL":"http://swift.publicinternets.com/v1/AUTH_1"
      }]
    }]
  };
  next();
});

app.all('/proxy/*', proxyKeystone({
  token: 'current_user.key', // req.current_user.key
  catalog: 'current_user.catalog', // req.current_user.catalog
  userAgent: 'Custom Openstack Dashboard' // forwarded in proxy headers
}));
```
