
/*
 * GET users & user/x/
 */

module.exports = function(app){

    app.get('/users', function(req, res){
    	console.log("/users - requested");
        res.render('index', { title: 'tellmeaboutit users' });
    });

    app.get('/user/:id', function(req, res){
    	var id = req.params.id;
    	console.log("/user ["+id+"] - requested");
        res.render('index', { title: 'tellmeaboutit user', id: id });
    });


}