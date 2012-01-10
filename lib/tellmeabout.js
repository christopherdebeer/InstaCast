
// Like socket.io, authom will intercept requests
// for you to help keep your routes clean.

var fs 		= require("fs"),
  	url 	= require("url"),
	http 	= require("http"),
  	rest 	= require("restler"),
  	util 	= require('util'),
	exec 	= require('child_process').exec;
	// server 	= http.createServer(),
  	// authom 	= require("authom"),
  	formidable 		= require('formidable'),
  	EventEmitter 	= require('events').EventEmitter,
	router 			= new EventEmitter();

var SCid 			= "6662849153100fde89ee18cdec618c60",
  	SCsecret 		= "3181d2e71f3b0d6104ec6440d577a6e8",
  	SCredirectUri 	= "http://tellmeaboutitapp.com/auth/sc-add",
  	EC2Base 		= "http://tellmeaboutitapp.com";
  	SCConnectButton = "<a style='color: orange; display: block; font-size: 4em; margin: 100px auto; text-align: center; text-decoration: none; width: 400px;' href='https://soundcloud.com/connect?scope=non-expiring&client_id="+SCid+"&response_type=code_and_token&redirect_uri="+SCredirectUri+"'>Connect With Soundcloud</a>";



var readability 	= require("readability"),
	b64				= require("b64"),
	jsdom			= require("jsdom"),
	_ 				= require("underscore"),
	crypto			= require("crypto"),
	ee 				= new EventEmitter();
    


// takes req.url.query.url and returns html to callback
// passes along res
ee.on("getHtml", function (req, res, cb) {

	//console.log("getHtml()");

	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	
	//console.log("url parts: ", url_parts);
	console.log("Requested URL: ", query.url);
	
	if (query.url) {
		jsdom.env(query.url, [
		  'http://code.jquery.com/jquery-1.5.min.js'
		],
		function(errors, window) {
			//console.log("HTML: ", window.$('html').html());
			var html = window.$('html').html();
		  	ee.emit(cb, res, html, "getText");
		});
	} else {
		res.writeHead(200, {
			 'Content-Type': 'text/html'
		});
		res.end(renderTestForm());
	}
});

// takes html and returns reabability text to callback
//passes along res
ee.on("getReadability", function (res, html, cb) {

	//console.log("getReadablility()");

	readability.parse( html, '', function(result) {
		//console.log("Readablility ran, result: ", result);
	    ee.emit(cb, res, result, "textToAudio");
	});

});


ee.on("getText", function (res, result, cb) {

	//console.log("getText()");

	var html = result.content;
	var Rtitle = result.title;
	console.log("Readability TITLE: ", Rtitle);

	jsdom.env( html, [
	  	'http://code.jquery.com/jquery-1.5.min.js'
	],
	function (errors, window) {

		var $textElems 	= window.$("h1, h2, h3, h4, h5, p"),
			title 		= Rtitle,
			allText 	= "";

			console.log("concatenating text blocks.");
			$textElems.each(function (i, el) {
				//console.log("Mapping...");
				var $thisText = window.$(el).text();
				//console.log($thisText);
				allText += $thisText.replace(/\s+/g, " ").replace(/’/g,"'");
				allText += " . ";
			});

			//console.log("about to emit...");
			ee.emit( cb, res, allText, title);
	});
});


// takes readability text and returns audio data to callback
// passes along res
ee.on("textToAudio", function (res, text, title) {
	
	
	res.writeHead(200, {
		 'Content-Type': 'text/html',
	});
	console.log("Headers sent");
	//console.log(text);

	var textHash = "test20111207";

	//console.log("spawning 'festival'");
	var cmd = 'echo "' + text  + '" |  text2wave -scale 5 -o ' + textHash + '.wav';
	//console.log(cmd);
	var festival = exec(cmd,
		function (error, stdout, stderr) {
			console.log("festival spawned");
			if (error !== null) {
				console.log('exec error: ' + error);
				ee.emit("connectionEnd", res);
			} else {
				console.log("festival exited with no error");
				ee.emit("wavGenerated",res, textHash, title);
			}
	});
	

});



ee.on("wavGenerated", function (res, textHash, title){

	console.log("spawning 'lame'");
	var cmd = 'sudo lame ' + textHash  + '.wav ' + textHash + '.mp3';
	console.log(cmd);
	var lame = exec(cmd,
		function (error, stdout, stderr) {
			console.log("lame spawned");
			if (error !== null) {
				console.log('exec error: ' + error);
				ee.emit("connectionEnd", res);
			} else {
				console.log("lame exited with no error");
				ee.emit("mp3Generated",res, textHash, title);
			}
	});

});

ee.on("mp3Generated", function (res, textHash, title) {
	// res.write("page converted to audio -> " + textHash + ".mp3");
	console.log("TITLE: ", title);
	SoundCloudUploadTrack({
		title: title,
		filename: textHash + ".mp3",
		token: appToken
	}, function(err, result, stderr) {
		//console.log("Error:", err);
		//console.log("result:", result);
		if (err === null) {
			result = JSON.parse(result);
			console.log("File uploaded to Soundcloud.", result);
			console.log("StdErr: ", stderr);
			var url = result.permalink_url,
				id 	= result.id;

			function loopStateCheck () {
				var stateCheckURL = "http://api.soundcloud.com/tracks/" + id + ".json?client_id=" + SCid;
				// console.log(stateCheckURL);
				rest.get(stateCheckURL).on('complete', function(data){
					
					if (typeof data.state === 'undefined' || data.state !== 'finished') {

						var status = "unknown"
						typeof data.state !== 'undefined' ? status = data.state : status = "uploading";
						console.log("waiting for SoundCLoud to process the file - [status: " + status + "]");
						setTimeout(loopStateCheck(), 1000);
					} else {
						res.write(renderSoundCloudPlayer(url, id));
						ee.emit("connectionEnd", res);
					}
					
				});
			}
			setTimeout(loopStateCheck(), 2);

			
		} else {
			console.log("Error uplaoding to SoundCloud.")
			ee.emit("connectionEnd", res);
		}
	});
	
});

ee.on("connectionEnd", function(res){
	res.end();
	console.log("Connection closed");
});


var clients = [];
var appToken = false;

module.exports = function(req, res) {
  	router.emit("/", req, res);
};


router.on("/", function (req,res){
	res.writeHead(200, {
		 'Content-Type': 'text/html',
	});
	//console.log(req);
	if (!appToken) {
		res.end(SCConnectButton);
	} else {

		ee.emit("getHtml",req, res, "getReadability");
	}
});

router.on("/auth", function (req, res) {
	
	res.writeHead(200, {
		 'Content-Type': 'text/html',
	});

	//console.log(url.parse(req.url));

	var fullQuery = url.parse(req.url).query;
	var query = require("querystring").parse(fullQuery);
	
	//console.log("query obj: ", query);


	if (typeof query["code"] != 'undefined') {

		// console.log("HREF::", url.parse(req.url).href);
		var code = query["code"];
		var token = "[dont have one]";

		rest.post("https://api.soundcloud.com/oauth2/token", {
			data: {
				client_id: SCid,
				client_secret: SCsecret,
				grant_type: 'authorization_code',
				redirect_uri: SCredirectUri,
				code: code
			}
		}).on('complete', function (data) {
			if (typeof data.access_token == 'undefined') {
				console.log("/auth ERROR getting token for user. [data.access_token was undefined(",typeof data.access_token,")]: ", data);
				res.end(SCConnectButton);
			} else {
				token = data["access_token"];
				console.log("received access token: ", token);
				iHaveAToken(res, token);
			}
		}).on('error', function(data, err) {
			console.log("/Auth ERROR getting token for user. ", err);
			res.end(SCConnectButton);
		})

		
		

	} else {
		console.log("/auth POST provided no <code> - ", url.parse(req.url).href);
		res.end(SCConnectButton);
	}

});



// tmp token: "1-13842-9610094-323acd2070d03d48";
function iHaveAToken(res, token) {

	appToken = token;
	console.log("Storing token for the duration fo this nodejs process");

	var url = EC2Base + "/post-test",
		file = rest.file('festivaltest2.wav', 'audio/x-wav'),
		title = "Soundcloud API Test file";
	
	res.end(renderTestForm());	
}

function SoundCloudUploadTrack(opts) {
	

	// apply callback if it exists
	var hasCallback = false;
	if (arguments.length == 2 && typeof arguments[1] === 'function') { 
		var cb = arguments[1];
		hasCallback = true;
	}

	// set options or return errors to callback else log the error
	if (typeof opts["token"] == 'undefined') { hasCallback ? cb("No token passed for authenticated Upload", {}) : console.log("Error No token passed for Authenticated upload"); }
	if (typeof opts["filename"] == 'undefined') { hasCallback ? cb("No filename passed for Upload", {}) : console.log("No filename passed for Upload"); }
	if (typeof opts["sharing"] == 'undefined') { opts.sharing = 'public'; }
	if (typeof opts["title"] == 'undefined' || opts["title"] == "") { opts.title = 'tellmeaboutit Track'; }

	// set soundcloud cURL command and parameters
	var command = "curl -X POST \"https://api.soundcloud.com/tracks.json\" -F 'oauth_token="+opts.token+"' -F 'track[asset_data]=@"+opts.filename+"' -F 'track[title]="+opts.title+"' -F 'track[sharing]="+opts.sharing+"'";
	console.log("------------------------------------------------------");
	console.log("cURL COMMAND: ", command);
	console.log("------------------------------------------------------");
	// spawn cURL as a child process
	child = exec(command, function(error, stdout, stderr) {
	
		if (hasCallback) {
			// pass results to callback
			cb(error, stdout, stderr); 
		} else {
			// log results seeing as theres no callback
			error !== null ? console.log("Upload Error [no callback specified]") : console.log("Done upload [no callback specified]");
		}

	});


	
}


function renderTestForm () {
	var markup = "<!DOCTYPE html> \
	<html> \
	<head> \
		<title>tellmeaboutit test form</title> \
		<style type=\"text/css\">\
		body {width:400px; margin:0 auto;} \
		input {width:300px; display:block;margin-bottom:10px;} \
		h1 {margin-top: 100px;} \
		</style>\
	</head> \
	<body> \
		<h1>tellmeabout it test page</h1> \
		<p>Ener the url of a page you would like read to you below</p> \
		<form method=\"GET\" action=\"/\" > \
			<input type=\"text\" name=\"url\"/> \
			<input type=\"submit\" value=\"tellmeaboutit\" /> \
		</form> \
	</body> \
	</html>";
	return markup;
}
function renderSoundCloudPlayer (url, id) {
	var markup = "<!DOCTYPE html> \
	<html> \
	<head> \
		<title>tellmeaboutit player</title> \
		<script type=\"text/javascript\" src=\"https://raw.github.com/soundcloud/Widget-JS-API/master/soundcloud.player.api.js\"></script> \
		<script type=\"text/javascript\"> \
		   soundcloud.addEventListener('onPlayerReady', function(player, data) { \
		   	 console.log('track started id:' + data.mediaId); \
		     player.api_play(); \
		   }); \
		</script> \
	</head> \
	<body> \
		<object height=\"81\" width=\"100%\" id=\"myPlayerId\" classid=\"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000\"> \
		  	<param name=\"movie\" value=\"http://player.soundcloud.com/player.swf?url="+encodeURIComponent(url)+"&enable_api=true&object_id=yourPlayerId\"></param> \
		  	<param name=\"allowscriptaccess\" value=\"always\"></param> \
		  	<embed allowscriptaccess=\"always\" height=\"81\" src=\"http://player.soundcloud.com/player.swf?url="+encodeURIComponent(url)+"&enable_api=true&object_id=myPlayerId\" type=\"application/x-shockwave-flash\" width=\"100%\" name=\"yourPlayerId\"></embed> \
		</object> \
	</body> \
	</html>";

	return markup;
}




















