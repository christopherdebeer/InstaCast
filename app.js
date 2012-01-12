
/**
 * Module dependencies.
 */

var express     = require('express'), 
    mongoose    = require('mongoose'),
    config      = require('./lib/config'),
    db          = require('./lib/dbconfig'),
    everyauth   = require('everyauth'),
    EventEmitter  = require('events').EventEmitter,
    ee          = new EventEmitter();


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////// Everyauth /// //////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

everyauth.debug = false;
var usersById = [];

// db.User.find({ id: { $exists: true }},function(err, user) {
//   if (!err) console.log(user);
//   else console.log(err);
// });


everyauth.everymodule
  .findUserById( function (userId, callback) {
    db.User.findOne({id: userId}, callback);
});

function addUser (source, sourceUser) {

  var user;
  if (arguments.length === 1) { // password-based
    user = sourceUser = source;
    user.id = ++nextUserId;
    return usersById[nextUserId] = user;
  } else { // non-password-based
    
    var src = '';
    if (source === 'facebook') src = "fb";
    if (source === 'twitter') src = "tw";
    if (source === 'google') src = "gl";

    user  = {id: src+sourceUser.id};
    user[source] = sourceUser;
    var newUser = new db.User();
    newUser.id = src+sourceUser.id;
    newUser.source = source;
    newUser.sourceInfo.id = sourceUser.id;
    newUser.sourceInfo.name = sourceUser.name;
    newUser.sourceInfo.screenName = sourceUser.screen_name || sourceUser.given_name || sourceUser.username;
    newUser.sourceInfo.avatarUrl = sourceUser.profile_image_url || sourceUser.picture || "https://graph.facebook.com/"+sourceUser.id+"/picture";

    newUser.save(function(err){
      if (err) {console.log("Existing user signed in - ["+newUser.id+"]");}
      else {
        usersById.push(newUser);
      }
    });
  }
  return user;
}

everyauth.twitter 
  .consumerKey(config.twitter.id)
  .consumerSecret(config.twitter.secret)
  .callbackPath('/auth/twitter/callback')
  .findOrCreateUser( function (session, accessToken, accessTokenSecret, twitUser) {
    return usersById["tw"+twitUser.id] || (usersById["tw"+twitUser.id] = addUser('twitter', twitUser));
  })
  .redirectPath('/');


everyauth.facebook
  .appId(config.facebook.id)
  .appSecret(config.facebook.secret)
  .handleAuthCallbackError( function (req, res) {})
  .findOrCreateUser( function (session, accessToken, accessTokExtra, fbUserMetadata) {
    return usersById["fb"+fbUserMetadata.id] || (usersById["fb"+fbUserMetadata.id] = addUser('facebook', fbUserMetadata));
  })
  .redirectPath('/');

everyauth.google
  .appId(config.google.id)
  .appSecret(config.google.secret)
  .scope('https://www.googleapis.com/auth/userinfo.profile') // What you want access to
  .callbackPath('/auth/google/callback')
  .handleAuthCallbackError( function (req, res) {})
  .findOrCreateUser( function (session, accessToken, accessTokenExtra, googleUserMetadata) {
    return usersById["gl"+googleUserMetadata.id] || (usersById["gl"+googleUserMetadata.id] = addUser('google', googleUserMetadata));
  })
  .redirectPath('/');

everyauth.everymodule.logoutPath('/auth/logout');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////// Configuration //////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////




var app = module.exports = express.createServer();

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.favicon());
  app.use(express.cookieParser());
  app.use(express.session({secret: 'tmaiappsecret'}));
  app.use(everyauth.middleware());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

everyauth.helpExpress(app);

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});


var routes = require('./routes')(app, db, ee);

ee.on("*", function(data) {
  console.log("Event emmitter emmited: ", data);
})


app.listen(config.port, config.ip);
console.log("tellmeaboutit server listening on port "+config.port+" in %s mode", app.settings.env);

