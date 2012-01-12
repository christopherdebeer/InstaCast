
/*
 * GET SoundCloud Auth
 */


module.exports = function(app, db, ee){

    var tmai = require("../lib/tellmeabout.js");

    app.get('/tmainow', function(req, res){
    	console.log("/tellmeaboutit NOW - requested");
        
        // start processing tempTrack
        tmai.tempTrack(req, function (response) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(response));
        });

        
    });

    app.get('/tmailater', function(req, res){
        console.log("/tellmeaboutit LATER - requested");
        
        if (typeof req.user !== 'undefined' && (req.user.type === 'pro' || req.user.type === 'admin')) {
            tmai.saveTrack(req, function (response) {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(response));
            });
            
        } else {
            res.writeHead(401, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({
                error: "401",
                errorMsg: "You are not authorised to save tracks for later."
            }));
        }

        
    });

}