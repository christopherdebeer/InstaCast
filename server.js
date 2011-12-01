


var readability 	= require("readability"),
	speak 			= require("node-speak"),
	b64				= require("b64"),
	url 			= require("url"),
	http 			= require("http"),
	jsdom			= require("jsdom"),
	_ 				= require("underscore"),
	EventEmitter 	= require('events').EventEmitter,
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
			 'Content-Type': 'text/plain'
		});
		res.end("Invalid query \nUsage: ?url=xxxxxxxx");
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
	var title = result.title;

	jsdom.env( html, [
	  	'http://code.jquery.com/jquery-1.5.min.js'
	],
	function(errors, window) {

		var textArray 	= [], 
			srcArray 	= [],
			$textElems 	= window.$("h1, h2, h3, h4, h5, p");

		console.log("Preping text/src Arrays: ", $textElems.length);
		$textElems.each( function (index, el){

			// console.log("textArray:", textArray);
			// console.log("srcArray:", srcArray);
			// console.log("Setting up textArray[" + index.toString() + "]");

			var text =  window.$(el).text();
			//console.log(text);
			srcArray[index] = 0;
			textArray[index] = " " + text.replace(/\s\s+/g, " ");

			if (index === $textElems.length -1) {
				ee.emit(cb,res, textArray, srcArray);
			} else {
				//console.log("not finished yet...");
			}
		});

	  	
	});
});


// takes readability text and returns audio data to callback
// passes along res
ee.on("textToAudio", function (res, textArray, srcArray) {
	
	//console.log("text2audio()");
	var todo = _.indexOf(srcArray,0);
	

	if (todo === -1) {
		
		ee.emit("connectionEnd", res);

	} else {

		console.log("Processing ", todo + 1, "/", textArray.length);
		console.log(" => ", textArray[todo]);
		
		if (todo === 0) {
			res.writeHead(200, {
				 'Content-Type': 'audio/wav',
				 'Transfer-Encoding': 'chunked'
			});
			console.log("Headers sent");
		} 
		speak( textArray[todo], {
			callback: function(src) {
				var binAudio = new Buffer(src.replace("data:audio/x-wav;base64,",""), 'base64');
				console.log("Streaming ", todo +1, " to Client");
				res.write(binAudio);
				srcArray[todo] = src;
				ee.emit("textToAudio", res, textArray, srcArray);
			}
		});
	}
});

ee.on("connectionEnd", function(res){
	res.end();
	console.log("Connection closed");
});


// takes a req and a res and passes them to getHtml() with getText() as the callback
http.createServer(function (req, res) {

	//console.log(req);
	ee.emit("getHtml",req, res, "getReadability");
	  
}).listen(80, "10.48.41.204");

console.log("Instacast server running on: 10.48.41.204:80");









