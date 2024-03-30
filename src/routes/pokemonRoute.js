'use strict';

const express = require('express');
require('dotenv').config();
const pokeRoutes = express();
const { default: axios } = require('axios');

const { Pokemon } = require('../lib/pokemon');
const { supplementMoveData, fetchAbilityDescriptions, fetchPokedexEntries, fetchTypeEffectiveness, handleSearchQueryEdgeCases } = require('../lib/search');
const cache = require('../cache');

const reshapeMoves = (moves) => {
  let moveArr = [];
  // gets move info from initial query, construct a "Move" object with basic information
  moves.forEach(element => {
    moveArr.push({
      name: element.move.name,
      power: undefined,
      accuracy: undefined, 
      pp: undefined, 
      dmgClass: undefined, 
      type: undefined,
      description: '',
      versionDetails: element.version_group_details
    })
  });

  // reshaping the version details for each move
  moveArr.forEach(move => {
    move.versionDetails.forEach((detail, idx) => {
      let temp = {
        levelLearned: detail.level_learned_at,
        learnMethod: detail.move_learn_method.name,
        version: detail.version_group.name
      };
      move.versionDetails[idx] = temp;
    });
  })

  return moveArr;
}

const reshapeStatsAndEvYields = (stats) => {
  let newStats = [];
  let evYields = [];

  stats.forEach(element => {
    switch(element.stat.name) {
      case 'hp' :
        element.stat.name = 'HP';
        break;
      case 'attack' :
        element.stat.name = 'ATK';
        break;
      case 'defense' :
        element.stat.name = 'DEF';
        break;
      case 'special-attack' :
        element.stat.name = 'SPATK';
        break;
      case 'special-defense' :
        element.stat.name = 'SPDEF';
        break;
      case 'speed' :
        element.stat.name = 'SPD';
        break;
      default :
        console.log('error abbreviating stat name') 
    }
    // removes 'effort' property from element and replaces with 'ev'
    // uncouples 'name' and 'url', add 'stat_value' property
    let newStat = {
      base_stat: element.base_stat,
      ev: 85,
      iv: 31,
      name: element.stat.name,
      url: element.stat.url,
      stat_value: 1,
    }

    newStats.push(newStat)

    // represents the EVs gained when a pokemon defeats this pokemon
    evYields.push({
      name: element.stat.name,
      yield: element.effort
    })
  })

  return [newStats, evYields];
}

const reshapeAbilities = (abilities) => {
  let newAbilities = [];

  // reshape each ability
  abilities.forEach(ability => {
    let newAbility = {
      name: ability.ability.name,
      url: ability.ability.url,
      is_hidden: ability.is_hidden,
      slot: ability.slot,
      description: '',
    };
    newAbilities.push(newAbility);
  })

  return newAbilities;
}

const createPokemon = (fetchedPokemon) => {

  console.log('Creating initial pokemon object...\n')
  // shapes each 'move' object for future GETs in 'supplementMoveData()'
  let moveArr = reshapeMoves(fetchedPokemon.moves);

  // reshaping the 'stats' property on the pokemon object
  let [newStats, evYields] = reshapeStatsAndEvYields(fetchedPokemon.stats);

  // reshape abilities objects & prep for future GETs in 'fetchAbilityDescriptions'
  let newAbilities = reshapeAbilities(fetchedPokemon.abilities);

  // create pokemon object which will ultimately be what is returned/sent back to client after promise chain is complete
  let pokemon = new Pokemon(
    fetchedPokemon.name,
    fetchedPokemon.id,
    100,
    "Adamant",
    newAbilities,
    moveArr,
    fetchedPokemon.sprites,
    newStats,
    fetchedPokemon.types,
  )

  pokemon.genus = '';
  pokemon.catchRate = 0;
  pokemon.eggGroups = [];
  pokemon.growthRate = '';
  pokemon.genderRate = 0;
  pokemon.hatchTime = 0;
  pokemon.baseHappiness = 0;
  pokemon.baseExpYield = fetchedPokemon.base_experience;
  pokemon.evYields = evYields;
  pokemon.forms = [];

  pokemon.height = {
    m: fetchedPokemon.height / 10,
    ft: parseInt((fetchedPokemon.height / 3.048).toFixed(2))
  };
  pokemon.weight = {
    kg: fetchedPokemon.weight / 10,
    lb: parseInt((fetchedPokemon.weight / 4.536).toFixed(2))
  };

  pokemon.species = fetchedPokemon.species;
  pokemon.cry = fetchedPokemon.cries.latest;
  console.log('INITIAL POKEMON OBJECT CONSTRUCTED \n')
  return pokemon;
}

pokeRoutes.get('/pokemon/:searchQuery', (request, response, next) => {
  let searchQuery = handleSearchQueryEdgeCases(request.params.searchQuery.toLowerCase());
  console.log('SEARCH QUERY: ', searchQuery)
  axios
    .get(`https://pokeapi.co/api/v2/pokemon/${searchQuery}`)
    .then(res => {

      if(cache.pokemon[res.data.id]){
        console.log('Pokemon found in cache!')
        throw {
          message: 'Pokemon found in cache!',
          pokemon: cache.pokemon[res.data.id]
        };
      }
      else {
        let pokemon = createPokemon(res.data)
        return pokemon;        
      }

    })
    .then(async pokemon =>{
      let newPokemon = await supplementMoveData(pokemon);
      return newPokemon
    })
    .then(async pokemon => {
      let newPokemon = await fetchTypeEffectiveness(pokemon);
      return newPokemon
    })
    .then(async pokemon => {
     let newPokemon = await fetchAbilityDescriptions(pokemon);
     return newPokemon
    })
    .then(async pokemon => {
      let newPokemon = await fetchPokedexEntries(pokemon);
      return newPokemon
    })
    .then(pokemon => {
      cache.pokemon[pokemon.id] = pokemon;
      console.log('CACHING POKEMON: ', pokemon.name)
      // pokemon.moves.forEach(move => console.log(move.name))
      console.log(pokemon.moves.length)
      response.status(200).send({pokemon})
    })
    .catch(e => {
      if (e.message === 'Pokemon found in cache!'){
        console.log('POKEMON IN CACHE, SENDING BACK CACHED DATA')
        response.status(200).send({pokemon: e.pokemon})
      } else {
        console.log('Error in pokemonRoute.js occured')
        next(e)
      }
    })

})

pokeRoutes.get('/pokemon/form/:form', (request, response, next) => {

  axios
  .get(`https://pokeapi.co/api/v2/pokemon/${request.params.form}`)
  .then(res => {

    if(cache.pokemon[res.data.id]){
      console.log('Pokemon found in cache!')
      throw {
        message: 'Pokemon found in cache!',
        pokemon: cache.pokemon[res.data.id]
      };
    }
    else {
      let pokemon = createPokemon(res.data)
      return pokemon;        
    }
    
  })
  .then(async pokemon =>{
    let newPokemon = await supplementMoveData(pokemon);
    return newPokemon
  })
  .then(async pokemon => {
    let newPokemon = await fetchTypeEffectiveness(pokemon);
    return newPokemon
  })
  .then(async pokemon => {
    let newPokemon = await fetchAbilityDescriptions(pokemon);
    return newPokemon
  })
  .then(async pokemon => {
    let newPokemon = await fetchPokedexEntries(pokemon);
    return newPokemon
  })
  .then(pokemon => {
    cache.pokemon[pokemon.id] = pokemon;
    response.status(200).send({pokemon})
  })
  .catch(e => {
    if (e.message === 'Pokemon found in cache!'){
      console.log('POKEMON IN CACHE, SENDING BACK CACHED DATA')
      response.status(200).send({pokemon: e.pokemon})
    } else {
      console.log('Error in pokemonRoute.js occured')
      next(e)
    }
  })
})

module.exports = { pokeRoutes }