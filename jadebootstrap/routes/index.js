var express = require('express');
var router = express.Router();
var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password"));
var session = driver.session();
/* GET home page. */
router.get('/', function(req, res, next) {
	var names = [];
  	var type = 'water'
  	var myPokemon = [];
	neo4j.session
	  .run( "MATCH (Type1 { name:'"+type+"' })<-[:type1|type2]-(pokemon) RETURN pokemon.name" )
	  .subscribe({
	    onNext: function(record) {
	      names.push(record.get("pokemon.name"));
	      //console.log(record.get("pokemon.name"));
	    },
	    onCompleted: function() {
	      neo4j.session.close();
	      res.render('index', { title: 'JADE-Bootstrap', names: names, type: type, myPokemon:myPokemon });
	    },
	    onError: function(error) {
	      console.log(error);
	    }
	  });
});

router.get('/saved', function(req, res, next) {
  	var names = [];
  	var allPokemon = getAllPokemon();
  	var myPokemon = getMyPokemon();

	res.render('saved', {allPokemon: allPokemon});
});

function getAllPokemon(){
	var toReturn = [];
	session
	  .run( "MATCH(p:Pokemon) RETURN p" )
	  .subscribe({
	    onNext: function(record) {
	    	console.log(record);
	      toReturn.push(record);
	      //console.log(record.get("pokemon.name"));
	    },
	    onCompleted: function() {
	      session.close();
	      return toReturn;
	    },
	    onError: function(error) {
	      console.log(error);
	    }
	  });
}
function getMyPokemon(){
	return [];
}

module.exports = router;
