
/*
 * GET SoundCloud AUth
 */

var url 	= require("url"),
	config 	= require("../lib/config"),
	rest 	= require("restler"),
	_ 		= require("underscore"),
	db 		= require("../lib/dbconfig");


var soundcloudConnect = "https://soundcloud.com/connect?scope=non-expiring&client_id="+config.soundcloud.id+"&response_type=code_and_token&redirect_uri="+config.soundcloud.redirectUri,
	SCConnectButton = "<a href=" + soundcloudConnect + ">Add soundcloud account</a>";
var recieveTokenOrCode = function (req, res) {	

	var fullQuery = url.parse(req.url).query;
	var query = require("querystring").parse(fullQuery);

	if (typeof query["code"] != 'undefined') {

		// console.log("HREF::", url.parse(req.url).href);
		var code = query["code"];
		var token = "[dont have one]";

		rest.post("https://api.soundcloud.com/oauth2/token", {
			data: {
				client_id: config.soundcloud.id,
				client_secret: config.soundcloud.secret,
				grant_type: 'authorization_code',
				redirect_uri: config.soundcloud.redirectUri,
				code: code
			}
		}).on('complete', function (data) {
			if (typeof data.access_token == 'undefined') {
				console.log("/auth ERROR getting token for user. [data.access_token was undefined(",typeof data.access_token,")]: ", data);
				res.end(SCConnectButton);
			} else {
				token = data["access_token"];
				rest.get("https://api.soundcloud.com/me.json?oauth_token=" + token).on('complete', function(data) {
					addOrUpdateSCAccount( data, token);
					res.end("account added")
				}).on('error', function(data){
					res.end("{error: 'Couldn't get User Info'}")
				})


			}
		}).on('error', function(data, err) {
			res.end(SCConnectButton);
		})

	} else {
		res.end(SCConnectButton);
	}

};

var addOrUpdateSCAccount = function (SCuser, token) {
	
	var Id = "sw" + SCuser.id;
	db.SCAccount.findOne({id: Id}, function(err, acc) {

		if (!acc) {
			// add new account
			var newSCAccount = new db.SCAccount();
			newSCAccount.id = Id;
			newSCAccount.username = SCuser.username;
			newSCAccount.token = token;

			newSCAccount.save(function(err){ 
				if (!err) console.log("Added new SCAccount ["+Id+"]");
				else {
					console.log('Failed to Add SCAccount ['+Id+']  ', err)
				}
			});
		} else {
			// update token
			acc.token = token;

			acc.save(function(err) {
				if (err)
					console.log('Failed to Update SCAccount ['+Id+']')
				else
					console.log('Updated SCAccount ['+Id+']')
			});
		}
	});

}


var getDBInfo = function (callback) {
	
	var data = {};
	db.User.find({}, function (err,users){
		data.users = users;
		db.Track.find({}, function (err,tracks){
			data.tracks = tracks;
			db.SCAccount.find({}, function(err, SCAccounts){
				data.sca = SCAccounts;

				// get secondary info

				data.proAccounts = _.filter(data.users, function(key){ return key.type === 'pro';}),
				data.freeAccounts = _.filter(data.users, function(key){ return key.type !== 'pro';}),
				data.savedTracks = _.filter(data.tracks, function(key){ return key.type !== 'temp';}),
				data.tempTracks = _.filter(data.tracks, function(key){ return key.type === 'temp';}),
				data.freeCluster = _.filter(data.sca, function(key){ return key.forUser === 'freecluster';}),
				data.unusedCluster = _.filter(data.sca, function(key){ return key.forUser === 'tellmeaboutit';}),
				data.proCluster = _.filter(data.sca, function(key){ return (key.forUser !== 'tellmeaboutit' && key.forUser !== 'freecluster');}),

				callback(data);
			})
		})
	})
}
module.exports = function(app, db, ee){

    app.get('/auth/soundcloud/callback', function(req, res){
    	console.log("/admin [connecting soundCloud account]");
        recieveTokenOrCode(req, res)
    });

    app.get('/admin', function (req, res) {

    	console.log("/admin [requested]");
    	if (typeof req.user !== 'undefined' && req.user.type === 'admin') {

    		getDBInfo( function (data) {
    			res.render("admin", {
    				title: "tmai Admin",
	    			config: config, 
	    			data: data
	    		});

    		});
    	} else {
    		res.end("UNAUTHORISED");
    	}
    	
    });
    app.get('/admin.json', function (req, res) {
    	console.log("/admin.json [requested]");
    	if (typeof req.user !== 'undefined' && req.user.type === 'admin') {
    		getDBInfo( function (data) {
    			res.writeHead(200, { 'Content-Type': 'application/json', }); res.end(JSON.stringify(data));
    		});
    	} else {
    		res.end("UNAUTHORISED");
    	}
    	
    });

}

