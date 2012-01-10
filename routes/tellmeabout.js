
/*
 * GET SoundCloud Auth
 */

 var tellmeabout = require("../lib/tellmeabout.js")

module.exports = function(app){

    app.get('/tellmeabout', function(req, res){
    	console.log("/tellmeabout - requested");
        tellmeabout(req,res);
    });

}