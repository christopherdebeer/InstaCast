
/*
 * GET users & user/x/
 */

var _ 			= require("underscore"),
	url 		= require("url"),
	querystring = require("querystring"),
	apiVersion 	= 0;

var validRequests = {
	"user": ["tracks","profile","addTrack","removeTrack"],
	"users": ["addNew","undefined"],
	"track": ["users","profile","addUser","removeUser","status"],
	"tracks": ["addNew","undefined"]
}
module.exports = function(app){

    app.get('/api/*', function(req, res){    	
        sendResponse(res, apiResponse(requestObj(req)));
    });
}


function requestData(req) {
// build the data object of a passed req

	var reqUrl = url.parse(req.url);
	var data = {}

	// if it has GET variables
	if (typeof reqUrl.search !== 'undefined' && req.method === "GET") {
		data = querystring.parse(reqUrl.search.substring(1));
	}
	// if it has POST data
	if (typeof req.body !== 'undefined' && req.method === "POST") {
		data = req.body;
	}

	return data;
	
}

function requestObj(req) {
// build the requestObj of the passed req

	console.log("API request: ", req.url);
	var reqUrl = url.parse(req.url);

	var apiResponse = {
		version: apiVersion,
		request: {
			version: parseInt(reqUrl.pathname.split("/")[2].replace("v","")),
			method: req.method,
			url: req.url,
    		scope: reqUrl.pathname.split("/")[3],
	        id: reqUrl.pathname.split("/")[4] || "undefined",
	        query: reqUrl.pathname.split("/")[5] || "undefined",
	        data: requestData(req)
		}
	}

	// if its "users" or "tracks" then the query is the id
	if (apiResponse.request.scope === 'tracks' || apiResponse.request.scope === 'users') {
		apiResponse.request.query = apiResponse.request.id;
		apiResponse.request.id = 'undefined';
	}

	return apiResponse;
}


function apiResponse(requestObj) {
// build a json repose give the api requestObj
	
	var responseObj = requestObj;
	if (isValidRequest(requestObj)) {
		responseObj.result = {
			error: "200",
			errorMsg: "OK (Everything went Awesomely).",
			data: getResponseData(requestObj)
		}
	} else {
		responseObj.result = {
			error: "400",
			errorMsg: "Bad Request (The request cannot be fulfilled due to bad syntax, invalid/unsupported Query or Scope)."
		}
	}
	
	return responseObj;
}


function isValidRequest(requestObj) {
// check if the request is valid as per allowed methods and scopes
	
	if (typeof validRequests[requestObj.request.scope] !== 'undefined' && _.include(validRequests[requestObj.request.scope], requestObj.request.query)) return true;
	return false;	
}

function getResponseData(requestObj) {
// build data response to a valid request

	var responseData = {};

	if (requestObj.request.scope === "user") {responseData.user = {
		status: "there are no users yet..."
	}}
	if (requestObj.request.scope === "track") {responseData.track = {
		status: "there are no tracks yet..."
	}}
	
	return responseData;	
}

function sendResponse(res, apiResponse) {
// send an json API response

	// if request.data.callback exists then present as JSONP
	if (typeof apiResponse.request.data.callback !== 'undefined') {
		res.contentType('text/javascript');
		res.send(apiResponse.request.data.callback + "(" +JSON.stringify(apiResponse) + ");");
	} 
	// else show as JSON
	else {
		res.contentType('application/json');
		res.send(JSON.stringify(apiResponse));
	}
	
}