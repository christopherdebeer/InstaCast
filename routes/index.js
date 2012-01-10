
/*
 * GET Basic pages ie: home / about / contact / login / signup
 */
var fs = require('fs');

module.exports = function(app){

	// load the other files / routes in thsi dir
    fs.readdirSync(__dirname).forEach(function(file) {
        if (file == "index.js") return;
        var name = file.substr(0, file.indexOf('.'));
        require('./' + name)(app);
    });


    app.get('/', function(req, res) {
    	res.render('index', { 
		  title: 'tellmeaboutit',     
          req: req
		});
    });

    // general info pages

    app.get('/about', function(req, res) {
    	res.render('index', { 
		  title: 'tellmeaboutit : About'
		});
    });

    app.get('/about/terms', function(req, res) {
        res.render('index', { 
          title: 'tellmeaboutit : Terms'
        });
    });

    app.get('/contact', function(req, res) {
    	res.render('index', { 
		  title: 'tellmeaboutit : Contact'
		});
    });

    // sign In and Up

    app.get('/signup', function(req, res) {
    	res.render('index', { 
		  title: 'tellmeaboutit : Sign Up'
		});
    });

    app.get('/signin', function(req, res) {
    	res.render('index', { 
		  title: 'tellmeaboutit : Sign In'
		});
    });


    // bloggers and developers

    app.get('/bloggers', function(req, res) {
        res.render('index', { 
          title: 'tellmeaboutit : Bloggers'
        });
    });

    app.get('/developers', function(req, res) {
        res.render('index', { 
          title: 'tellmeaboutit : Developers'
        });
    });
    
}
