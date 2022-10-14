function auth (req, res, next){
var auth;

// check whether an autorization header was send    
if (req.headers.authorization) {
  // only accepting basic auth, so:
  // * cut the starting "Basic " from the header
  // * decode the base64 encoded username:password
  // * split the string at the colon
  // -> should result in an array
  auth = new Buffer(req.headers.authorization.substring(6), 'base64').toString().split(':');
  // use Buffer.from in with node v5.10.0+ 
  // auth = Buffer.from(req.headers.authorization.substring(6), 'base64').toString().split(':');
}

// checks if:
// * auth array exists 
// * first value matches the expected user 
// * second value the expected password
if (!auth || auth[0] !== 'mouriUser' || auth[1] !== '$M0uriUser@312') {
    // any of the tests failed
    // send an Basic Auth request (HTTP Code: 401 Unauthorized)
    res.statusCode = 401;
    // MyRealmName can be changed to anything, will be prompted to the user
    res.setHeader('WWW-Authenticate', 'Basic realm="MyRealmName"');
    // this will displayed in the browser when authorization is cancelled
    res.end('Unauthorized');
} else {
    // continue with processing, user was authenticated
    next();
}
}

module.exports = auth;