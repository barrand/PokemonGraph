var express = require('express');
var router = express.Router();
var neo4j = require('neo4j-driver').v1;
var userId = 1;
var DESTINATION_SAVED = "saved";
var DESTINATION_INDEX = "index";
/* GET home page. */
router.get('/', function(req, res, next) {
	var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password"));
	var session = driver.session();
	var allPokemon = {};
	req.destination = DESTINATION_INDEX;
	console.log('index ' + req.destination);
 	getMyPokemon(session, req, res, allPokemon);
	//res.render('index', { title: 'blah', names: [], type: 'water', myPokemon:myPokemon });
});


//=================== Saved =================

router.get('/saved/', function(req, res, next) {
  	var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password"));
	var session = driver.session();

  	var names = [];
  	req.destination = DESTINATION_SAVED;
  	getAllPokemon(session, req, res);
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


function getAllPokemon(session, req, res){
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
	      getMyPokemon(session, req, res, allPokemon);
	      // renderSaved(toReturn, res);
	    },
	    onError: function(error) {
	      console.log(error);
	      session.close();
	    }
	  });
}
function getMyPokemon(session, req, res, allPokemon){
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
	      getOpposingPokemon(session, req, res, allPokemon, myPokemonIds, myPokemon);
	    },
	    onError: function(error) {
	      console.log(error);
	      session.close();
	    }
	  });
}

function getOpposingPokemon(session, req, res, allPokemon, myPokemonIds, myPokemon){
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
	      console.log('ready to render ' + req.destination);
	      if(req.destination == DESTINATION_SAVED){
	      	renderSaved(allPokemon, myPokemonIds, myPokemon, opposingPokemonIds, opposingPokemon, req, res);
	      }else if (req.destination == DESTINATION_INDEX){
			renderIndex(myPokemonIds, myPokemon, opposingPokemonIds, opposingPokemon, req, res);
	      }
	    },
	    onError: function(error) {
	      console.log(error);
	      session.close();
	    }
	  });
}

function renderSaved(allPokemon, myPokemonIds, myPokemon, opposingPokemonIds, opposingPokemon, req, res){
	for (list in allPokemon){
		for(p in allPokemon[list]){
			var currentId = Number(allPokemon[list][p].pokemon_id);
			if(myPokemonIds.indexOf(currentId) > -1){
				allPokemon[list][p].owned = "true";
			}else{
				allPokemon[list][p].owned = "false";
			}
			if(opposingPokemonIds.indexOf(currentId) > -1){
				allPokemon[list][p].opposing = "true";
			}else{
				allPokemon[list][p].opposing = "false";
			}			
		}
	}
	res.render('saved', {rarePokemon: allPokemon['rare'], occasionalPokemon: allPokemon['occasional'], commonPokemon: allPokemon['common'], everywherePokemon: allPokemon['everywhere'], myPokemonIds: myPokemonIds, myPokemon: myPokemon, opposingPokemon:opposingPokemon, opposingPokemonIds:opposingPokemonIds});
}

function renderIndex(myPokemonIds, myPokemon, opposingPokemonIds, opposingPokemon, req, res){
	scoreTypeMatchups();
	// opposingPokemon = findBestPokemon(opposingPokemon, myPokemon);
	// res.render('index', {myPokemonIds: myPokemonIds, myPokemon: myPokemon, opposingPokemon:opposingPokemon, opposingPokemonIds:opposingPokemonIds});
}

function scoreTypeMatchups(opposingPokemon, myPokemon){
	var allTypes = ["normal", "fighting", "flying", "poison", "ground", "rock", "bug", "ghost", "steel", "fire", "water", "grass", "electric", "psychic", "ice", "dragon", "dark", "fairy"]
	var typeScores = {};
	//setup multidimensional array for the scores between types
	for(tmpFromType in allTypes){
		typeScores[tmpFromType] = {};
		for(tmpToType in allTypes){
			typeScores[tmpFromType][tmpToType] = 0;
		}
		
	}
	session
	  .run( "MATCH (fromType:Type)-[r]->(toType:Type) RETURN fromType,type(r),toType" )
	  .subscribe({
	    onNext: function(record) {
	    	var pokemonObj = record.get("p")['properties'];
			
	    },
	    onCompleted: function() {
	      console.log('ready to render ' + req.destination);
	      
	    },
	    onError: function(error) {
	      console.log(error);
	      session.close();
	    }
	  });
}

module.exports = router;
