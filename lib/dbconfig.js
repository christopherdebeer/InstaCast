////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////// DB Mongo stuff ////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////


var mongoose    = require('mongoose');

mongoose.connect('mongodb://localhost/tmai-alpha', function(err) {
    if (err) throw err;
});

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var UserSchema = new Schema({
    id          : { type: String, unique: true }
  , source      : String
  , sourceInfo 	: {
  	  id          : String
    , name        : String
    , avatarUrl   : String
    , screenName  : String
  }
  , created     : { type: Date, default: Date.now}
  , tracks      : [TrackSchema]
  , type        : {type: String, default: 'alpha'}
});

var TrackSchema = new Schema({
    id          : ObjectId
  , users     	: [String]
  , status      : {type: String, default: 'created'}
  , created   	: { type: Date, default: Date.now}
  , src 	  	  : String
  , text      	: String
  , title       : String
  , soundcloud	: {
  		  id          : String
  		, account     : String
  		, url 		    : String
  }
  , type        : {type: String, default: 'temp'}
});

var AccountSchema = new Schema({
    id        : { type: String, unique: true }
	, username 	: String
	, token 	  : String
	, forUser		: {type: String, default: 'tellmeaboutit'}
});


module.exports.Track 		= mongoose.model('Track', TrackSchema),
module.exports.User 		= mongoose.model('User', UserSchema),
module.exports.SCAccount 	= mongoose.model('SCAccount', AccountSchema)

