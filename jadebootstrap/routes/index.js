var express = require('express');
var router = express.Router();
var neo4j = require('neo4j-driver').v1;
var userId = "homeboy";

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
	  .run( "MATCH(p:Pokemon{pokemon_id:"+id+"}) CREATE (user:User {user_id:'"+userId+"'})-[:has_pokemon]->(p)" )
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

router.get('/remove/:id', function(req, res, next) {
  	var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password"));
	var session = driver.session();
	var id = req.params.id;
	console.log("remove " + id);
  	session
	  .run( "MATCH(p:Pokemon{pokemon_id:"+id+"}) MATCH (u:User {user_id:'"+userId+"'})-[r:has_pokemon]->(p) DELETE r" )
	  .subscribe({
	    onNext: function(record) {
	    	
	    },
	    onCompleted: function() {
	      console.log("just removed " + id);
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
	session
	  .run( "MATCH (u:User {user_id:'"+userId+"'}) MATCH (p:Pokemon)<-[:has_pokemon]-(u) RETURN p" )
	  .subscribe({
	    onNext: function(record) {
	    	var pokemonObj = record.get("p")['properties'];
			myPokemonIds.push(Number(pokemonObj.pokemon_id));
			myPokemon.push(pokemonObj);
	    },
	    onCompleted: function() {
	      renderSaved(allPokemon, myPokemonIds, myPokemon, res);
	      // renderSaved(toReturn, res);
	    },
	    onError: function(error) {
	      console.log(error);
	      session.close();
	    }
	  });
}

function renderSaved(allPokemon, myPokemonIds, myPokemon, res){
	for (list in allPokemon){
		for(p in allPokemon[list]){
			var currentId = Number(allPokemon[list][p].pokemon_id);
			if(myPokemonIds.indexOf(currentId) > -1){
				allPokemon[list][p].owned = "true";
			}else{
				allPokemon[list][p].owned = "false";
			}
			// console.log(typeof(myPokemonIds[myId]) + " " + typeof(allPokemon[list][p].pokemon_id));
			// if(myPokemonIds[myId] == allPokemon[list][p].pokemon_id){
			// 	p.owned = true;
			// 	console.log("owned!!")
			// }else{
			// 	p.owned = false;
			// }
			
		}
	}
	res.render('saved', {rarePokemon: allPokemon['rare'], occasionalPokemon: allPokemon['occasional'], commonPokemon: allPokemon['common'], everywherePokemon: allPokemon['everywhere'], myPokemonIds: myPokemonIds, myPokemon: myPokemon});
}

module.exports = router;
