'use strict';

var Url = require('url'),
httpProxy = require('http-proxy'),
_ = require('lodash'),
proxy = new httpProxy.createProxyServer(),
options = {
  token: 'user.token',
  catalog: 'user.serviceCatalog',
  userAgent: ''
},
ProxyKeystone = {};

ProxyKeystone.getValueByString = function (o, s) {
  var a = s.split('.');
  while (a.length) {
    var n = a.shift();
    if (n in o) {
        o = o[n];
    } else {
        return false;
    }
  }
  return o;
};

ProxyKeystone.setOptions = function (defaults, custom) {
  for(var i in custom){
    defaults[i] = custom[i];
  }
};

ProxyKeystone.parseService = function (service) {
  var segments = service.split(',');

  if (segments.length === 2) {
    return {
      name: segments[0],
      region: segments[1]
    };
  }

  return {
    name: segments[0],
  };
};

ProxyKeystone.getServiceByName = function (name, catalog) {
  return _.find(catalog, function(item) {
    return name === item.name;
  });
};

ProxyKeystone.findEndpoint = function (serviceInfo, service) {
  if (serviceInfo.region){
    return _.find(service.endpoints, function(endpoint) {
      return serviceInfo.region === endpoint.region;
    });
  } else {
    return service.endpoints[0];
  }
};

ProxyKeystone.restreamer = function (req) {
  req.removeAllListeners('data');
  req.removeAllListeners('end');
  process.nextTick(function () {
    if(req.body) {
      req.emit('data', JSON.stringify(req.body));
    }
    req.emit('end');
  });
};

ProxyKeystone.middleware = function (req, res, next) {
  var token, catalog, serviceParams, service,
  endpoint, endpointInfo, target, serviceInfo,
  proxyUrl = req.route.path.replace(/\*$/, '');

  // Handle body parser issues
  ProxyKeystone.restreamer(req);

  // set token and serviceCatalog
  token = ProxyKeystone.getValueByString(req, options.token);
  catalog = ProxyKeystone.getValueByString(req, options.catalog);

  if(!token){
    return res.json(403, {error: 'Missing token'});
  }
  if (!catalog) {
    return res.json(400, {error: 'Missing Service Catalog'});
  }

  // begin req.url transformation
  req.url = req.url.split(proxyUrl)[1]; // remove /proxy/
  serviceParams = req.url.split('/')[0]; // grabs 'catalogItem,[region]'
  req.url = req.url.split(serviceParams)[1]; // transform req.url

  serviceInfo = ProxyKeystone.parseService(serviceParams);

  // grab service from catalog based on name
  service = ProxyKeystone.getServiceByName(serviceInfo.name, catalog);

  // check if service exists
  if (!service){
    return res.json(404, {error: 'Service Catalog Item Not Found'});
  }

  endpoint = ProxyKeystone.findEndpoint(serviceInfo, service);

  if (!endpoint) {
    return res.json(404, {error: 'Endpoint Not Found In ' + service.name});
  }

  // url.parse creates an object
  endpointInfo = Url.parse(endpoint.publicURL);
  target = endpoint.publicURL.split(endpointInfo.path)[0];
  req.url = endpointInfo.pathname + req.url;

  // Set headers
  req.headers = {};
  req.headers['X-Auth-Token'] = token;
  req.headers['Accept'] = 'application/json';
  req.headers['Content-Type'] = 'application/json';
  if (options.userAgent){
    req.headers['User-Agent'] = options.userAgent;
  }

  // Set proxy options
  proxy.web(req, res, {
    target: target
  });

  // handle errors
  proxy.on('error', function (err) {
    next(err);
  });
};

module.exports = function (customOptions) {
 // Merge Options
 ProxyKeystone.setOptions(options, customOptions);
 // return praxy middleware
 return ProxyKeystone.middleware;
};
