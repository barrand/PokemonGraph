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
  	savePokemon("has_pokemon_instance", id, res);
});
router.get('/saveOpposing/:id', function(req, res, next) {
  	var id = req.params.id;
  	savePokemon("opposing_pokemon_instance", id, res);
});

router.get('/removeMine/:id', function(req, res, next) {
  	var id = req.params.id;
  	removePokemon("has_pokemon_instance", id, res);
});
router.get('/removeOpposing/:id', function(req, res, next) {
  	var id = req.params.id;
  	removePokemon("opposing_pokemon_instance", id, res);
});

function savePokemon(relationship, pokemon_id, res){
	var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password"));
	var session = driver.session();
	var queryString = "MATCH(p:Pokemon{pokemon_id:"+pokemon_id+"}) MATCH(u:User{user_id:"+userId+"}) WITH p as map, u as user CREATE (pi:Pokemon_instance) SET pi=map CREATE (user)-[:"+relationship+"]->(pi)-[:instance_of]->(map) Return user, pi";
	console.log("queryString: "+queryString);
  	session
	  .run(queryString)
	  .subscribe({
	    onNext: function(record) {
	    	
	    },
	    onCompleted: function() {
	      session.close();
	      //Hard code something to add the first possible move set
	      if(relationship == "has_pokemon"){
	      	saveInstanceMoves(pokemon_id, res)
	      //Otherwise just redirect to saved
	      }else{
	      	res.redirect("/saved");
	      }
	    },
	    onError: function(error) {
	      console.log(error);
	      session.close();
	    }
	});
}

function saveInstanceMoves(pokemon_id, res){
	var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password"));
	var session = driver.session();
	var queryString = "MATCH(u:User{user_id:"+userId+"})-[:has_pokemon_instance]->(i:Pokemon_instance)-[:instance_of]->(p:Pokemon) MATCH (p)-[:has_fast_move]->(fm:Move)MATCH (p)-[:has_charge_move]->(cm:Move) WITH COLLECT(fm)[0] AS fastMoves, cm, u, pi WITH COLLECT(cm)[0] AS chargeMoves, fastMoves, u, pi MERGE (pi)-[:has_fast_move]->(fastMoves) MERGE (pi)-[:has_charge_move]->(chargeMoves) Return u, pi, fastMoves, chargeMoves";
	console.log("queryString: "+queryString);
  	session
	  .run(queryString)
	  .subscribe({
	    onNext: function(record) {
	    	
	    },
	    onCompleted: function() {
	      session.close();
	      res.redirect("/saved");
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
	  .run( "MATCH(pi:Pokemon_instance{pokemon_id:"+pokemon_id+"}) OPTIONAL MATCH (pi)-[r]-()WITH pi, r DELETE pi, r" )
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
	console.log("GET all pokemon ");
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
	console.log("getting my pokemon " + userId);
	var queryString = "MATCH (u:User {user_id:"+userId+"}) MATCH (u)-[:has_pokemon_instance]->(p:Pokemon_instance) RETURN p, u" 
	console.log("queryString " + queryString);
	session
	  .run(queryString)
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
	  .run( "MATCH (u:User {user_id:"+userId+"}) MATCH (p:Pokemon_instance)<-[:opposing_pokemon_instance]-(u) RETURN p" )
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
	// opposingPokemon = findBestPokemon(opposingPokemon, myPokemon);
	res.render('index', {myPokemonIds: myPokemonIds, myPokemon: myPokemon, opposingPokemon:opposingPokemon, opposingPokemonIds:opposingPokemonIds});
}

module.exports = router;
