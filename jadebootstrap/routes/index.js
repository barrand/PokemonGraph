var express = require('express');
var router = express.Router();
var neo4j = require('neo4j-driver').v1;

/* GET home page. */
router.get('/', function(req, res, next) {
	var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password"));
	var session = driver.session();
 	var myPokemon = [];
	res.render('index', { title: 'blah', names: [], type: 'water', myPokemon:myPokemon });

	// var names = [];
 //  	var type = 'water'
 //  	var myPokemon = [];
	// session
	//   .run( "MATCH (Type1 { name:'"+type+"' })<-[:type1|type2]-(pokemon) RETURN pokemon.name" )
	//   .subscribe({
	//     onNext: function(record) {
	//       names.push(record.get("pokemon.name"));
	//       //console.log(record.get("pokemon.name"));
	//     },
	//     onCompleted: function() {
	//       neo4j.session.close();
	//       res.render('index', { title: 'JADE-Bootstrap', names: names, type: type, myPokemon:myPokemon });
	//     },
	//     onError: function(error) {
	//       console.log(error);
	//     }
	//   });
});

router.get('/saved', function(req, res, next) {
  	var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password"));
	var session = driver.session();

  	var names = [];
  	getAllPokemon(session, res);
});

function getAllPokemon(session, res){
	var toReturn = {};
	toReturn['rare'] = [];
	toReturn['occasional'] = [];
	toReturn['common'] = [];
	toReturn['everywhere'] = [];
	session
	  .run( "MATCH (p:Pokemon)-[:how_battle_common]->(c) RETURN p,c" )
	  .subscribe({
	    onNext: function(record) {
	    	var pokemonObj = record.get("p")['properties'];
			var howCommon =  record.get("c")['properties']['name'];
			toReturn[howCommon].push(pokemonObj);
			console.log("toReturn " + toReturn);
	    },
	    onCompleted: function() {
	      session.close();
	      console.log("to return " + toReturn);
	      renderSaved(toReturn, res);
	    },
	    onError: function(error) {
	      console.log(error);
	    }
	  });
}
function getMyPokemon(session){
	return [];
}

function renderSaved(allPokemon, res){
	res.render('saved', {rarePokemon: allPokemon['rare'], occasionalPokemon: allPokemon['occasional'], commonPokemon: allPokemon['common'], everywherePokemon: allPokemon['everywhere']});
}

module.exports = router;
