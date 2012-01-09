
/*
 * GET SoundCloud AUth
 */

module.exports = function(app){

    app.get('/soundcloud-auth', function(req, res){
    	console.log("/soundcloud-auth - requested");
        res.render('index', { title: 'tellmeaboutit auth' });
    });

}