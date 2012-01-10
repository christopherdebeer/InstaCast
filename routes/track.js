
/*
 * GET tracks and track/x/
 */

module.exports = function(app){

    app.get('/tracks', function(req, res){
    	console.log("/tracks - requested");
        res.render('index', { title: 'tellmeaboutit tracks' });	
    });

    app.get('/track/:id', function(req, res){
    	var id = req.params.id;
    	console.log("/track [" + id + "] - requested");
        res.render('index', { title: 'tellmeaboutit track', id: id });
    });


}