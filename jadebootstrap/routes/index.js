var express = require('express');
var router = express.Router();
var neo4j = require('neo4j-driver').v1;

/* GET home page. */
router.get('/', function(req, res, next) {
	var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password"));
	var session = driver.session();

  	
  	var names = [];
  	var type = 'water'
	session
	  .run( "MATCH (Type1 { name:'"+type+"' })<-[:type1|type2]-(pokemon) RETURN pokemon.name" )
	  .subscribe({
	    onNext: function(record) {
	      names.push(record.get("pokemon.name"));
	      console.log(record.get("pokemon.name"));
	    },
	    onCompleted: function() {
	      session.close();
	      res.render('index', { title: 'JADE-Bootstrap', names: names, type: type });
	    },
	    onError: function(error) {
	      console.log(error);
	    }
	  });
});

module.exports = router;
