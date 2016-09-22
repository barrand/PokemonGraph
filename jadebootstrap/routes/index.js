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

router.get('/saved/', function(req, res, next) {
  	var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password"));
	var session = driver.session();

  	var names = [];
  	getAllPokemon(session, res);
});

router.get('/save/:id', function(req, res, next) {
  	var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password"));
	var session = driver.session();
	var id = req.params.id;
  	session
	  .run( "MATCH(p:Pokemon{pokemon_id:"+id+"}) CREATE (billy:User {name:'Billy'})-[:has_pokemon]->(p)" )
	  .subscribe({
	    onNext: function(record) {
	    	
	    },
	    onCompleted: function() {
	      console.log("just added " + id);
	      session.close();
	      res.redirect("/saved");
	      //go to the saved page
	    },
	    onError: function(error) {
	      console.log(error);
	      session.close();
	    }
	  });
});

function getAllPokemon(session, res){
	var allPokemon = {};
	allPokemon['rare'] = [];
	allPokemon['occasional'] = [];
	allPokemon['common'] = [];
	allPokemon['everywhere'] = [];
	session
	  .run( "MATCH (p:Pokemon)-[:how_battle_common]->(c) RETURN p,c" )
	  .subscribe({
	    onNext: function(record) {
	    	var pokemonObj = record.get("p")['properties'];
			var howCommon =  record.get("c")['properties']['name'];
			allPokemon[howCommon].push(pokemonObj);
	    },
	    onCompleted: function() {
	      console.log("allPokemon " + allPokemon);
	      getMyPokemon(session,res, allPokemon);
	      // renderSaved(toReturn, res);
	    },
	    onError: function(error) {
	      console.log(error);
	      session.close();
	    }
	  });
}
function getMyPokemon(session, res, allPokemon){
	var myPokemonIds = [];
	session
	  .run( "MATCH (u:User {name:'Billy'}) MATCH (p:Pokemon)<-[:has_pokemon]-(u) RETURN p" )
	  .subscribe({
	    onNext: function(record) {
	    	var pokemonObj = record.get("p")['properties'];
			myPokemonIds.push(pokemonObj.pokemon_id);
			console.log(pokemonObj.pokemon_id);
	    },
	    onCompleted: function() {
	      console.log("to return " + myPokemonIds);
	      renderSaved(allPokemon, myPokemonIds, res);
	      // renderSaved(toReturn, res);
	    },
	    onError: function(error) {
	      console.log(error);
	      session.close();
	    }
	  });
}

function renderSaved(allPokemon, myPokemonIds, res){
	
	for (p in allPokemon){
		console.log("index " + myPokemonIds.indexOf(p.pokemon_id))
		if(myPokemonIds.indexOf(p.pokemon_id) >= 0 ){
			p.owned = true;
			console.log("owned!!")
		}else{
			p.owned = false;
		}
	}
	res.render('saved', {rarePokemon: allPokemon['rare'], occasionalPokemon: allPokemon['occasional'], commonPokemon: allPokemon['common'], everywherePokemon: allPokemon['everywhere'], myPokemonIds: myPokemonIds});
}

module.exports = router;
