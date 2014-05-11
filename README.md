# proxy-keystone

A proxy for Keystone Service Catalog Endpoints built on top of http-proxy.

## Getting Started

Install the module with: `npm install proxy-keystone`

## Example Usage

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
      name:"swift"
      endpoints:[{
        "region":"RegionOne",
        "internalURL":"http://127.0.0.1:8080/v1/AUTH_1",
        "publicURL":"http://swift.publicinternets.com/v1/AUTH_1"
      }]
    }]
  };
  next();
});

app.all('/proxy/*', proxyKeystone();

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
      name:"swift"
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
});
```
