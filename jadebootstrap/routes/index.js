var express = require('express');
var router = express.Router();
var neo4j = require('neo4j-driver').v1;
var userId = 1;

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

router.get('/saveMine/:id', function(req, res, next) {
  	var id = req.params.id;
  	savePokemon("has_pokemon", id, res);
});
router.get('/saveOpposing/:id', function(req, res, next) {
  	var id = req.params.id;
  	savePokemon("opposing_pokemon", id, res);
});

router.get('/removeMine/:id', function(req, res, next) {
  	var id = req.params.id;
  	removePokemon("has_pokemon", id, res);
});
router.get('/removeOpposing/:id', function(req, res, next) {
  	var id = req.params.id;
  	removePokemon("opposing_pokemon", id, res);
});

function savePokemon(relationship, pokemon_id, res){
	var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password"));
	var session = driver.session();
	var queryString = "MATCH(p:Pokemon{pokemon_id:"+pokemon_id+"}) MATCH(u:User{user_id:"+userId+"}) CREATE (u)-[:"+relationship+"]->(p)";
	console.log("queryString: "+queryString);
  	session
	  .run(queryString)
	  .subscribe({
	    onNext: function(record) {
	    	
	    },
	    onCompleted: function() {
	      session.close();
	      res.redirect("/saved");
	      //go to the saved page
	    },
	    onError: function(error) {
	      console.log(error);
	      session.close();
	    }
	});
}


function removePokemon(relationship, pokemon_id, res){
	var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password"));
	var session = driver.session();
  	session
	  .run( "MATCH(p:Pokemon{pokemon_id:"+pokemon_id+"}) MATCH (u:User {user_id:"+userId+"})-[r:"+relationship+"]->(p) DELETE r" )
	  .subscribe({
	    onNext: function(record) {
	    	
	    },
	    onCompleted: function() {
	      session.close();
	      res.redirect("/saved");
	      //go to the saved page
	    },
	    onError: function(error) {
	      console.log(error);
	      session.close();
	    }
	});
}


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
	var myPokemon = [];
	var opposingPokemon = [];
	session
	  .run( "MATCH (u:User {user_id:"+userId+"}) MATCH (p:Pokemon)<-[:has_pokemon]-(u) RETURN p" )
	  .subscribe({
	    onNext: function(record) {
	    	var pokemonObj = record.get("p")['properties'];
			myPokemonIds.push(Number(pokemonObj.pokemon_id));
			myPokemon.push(pokemonObj);
	    },
	    onCompleted: function() {
	      getOpposingPokemon(session, res, allPokemon, myPokemonIds, myPokemon);
	    },
	    onError: function(error) {
	      console.log(error);
	      session.close();
	    }
	  });
}

function getOpposingPokemon(session, res, allPokemon, myPokemonIds, myPokemon){
	var opposingPokemonIds = [];
	var opposingPokemon = [];
	session
	  .run( "MATCH (u:User {user_id:"+userId+"}) MATCH (p:Pokemon)<-[:opposing_pokemon]-(u) RETURN p" )
	  .subscribe({
	    onNext: function(record) {
	    	var pokemonObj = record.get("p")['properties'];
			opposingPokemonIds.push(Number(pokemonObj.pokemon_id));
			opposingPokemon.push(pokemonObj);
			console.log('getting opposing ')
	    },
	    onCompleted: function() {
	      renderSaved(allPokemon, myPokemonIds, myPokemon, opposingPokemonIds, opposingPokemon, res);
	      // renderSaved(toReturn, res);
	    },
	    onError: function(error) {
	      console.log(error);
	      session.close();
	    }
	  });
}

function renderSaved(allPokemon, myPokemonIds, myPokemon, opposingPokemonIds, opposingPokemon, res){
	for (list in allPokemon){
		for(p in allPokemon[list]){
			var currentId = Number(allPokemon[list][p].pokemon_id);
			if(myPokemonIds.indexOf(currentId) > -1){
				allPokemon[list][p].owned = "true";
			}else{
				allPokemon[list][p].owned = "false";
			}			
		}
	}
	res.render('saved', {rarePokemon: allPokemon['rare'], occasionalPokemon: allPokemon['occasional'], commonPokemon: allPokemon['common'], everywherePokemon: allPokemon['everywhere'], myPokemonIds: myPokemonIds, myPokemon: myPokemon, opposingPokemon:opposingPokemon, opposingPokemonIds:opposingPokemonIds});
}

module.exports = router;
