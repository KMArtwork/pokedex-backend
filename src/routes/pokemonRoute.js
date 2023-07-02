'use strict';

const express = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET;
const base64 = require('base-64');
const PORT = process.env.PORT;
const pokeRoutes = express();
const { default: axios } = require('axios');

const { Pokemon } = require('../lib/pokemon');
const { supplementMoveData, fetchAbilityDescriptions, fetchPokedexEntries, fetchTypeEffectiveness, handleSearchQueryEdgeCases } = require('../lib/search');
const cache = require('../cache');

pokeRoutes.get('/pokemon/:searchQuery', (request, response, next) => {
  let searchQuery = handleSearchQueryEdgeCases(request.params.searchQuery);

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
        let moveArr = [];
        // gets move info from initial query, construct a "Move" object with basic information
        res.data.moves.forEach(element => {
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

        // reshaping the 'stats' property on the pokemon object
        let oldStats = res.data.stats;
        let newStats = [];
        let evYields = [];
        let newAbilities = [];

        // removes 'effort' property from res and replaces with 'ev', uncouples 'name' and 'url', add 'stat_value' property
        oldStats.forEach(element => {
          let newStat = {
            base_stat: element.base_stat,
            ev: 0,
            iv: 31,
            name: element.stat.name,
            url: element.stat.url,
            stat_value: 1,
          }
          newStats.push(newStat)
          evYields.push({
            name: element.stat.name,
            yield: element.effort
          })
        })

        // renames stat names to abbreviated, all caps names
        newStats.forEach(element => {
          switch(element.name) {
            case 'hp' :
              element.name = 'HP';
              break;
            case 'attack' :
              element.name = 'ATK';
              break;
            case 'defense' :
              element.name = 'DEF';
              break;
            case 'special-attack' :
              element.name = 'SP.ATK';
              break;
            case 'special-defense' :
              element.name = 'SP.DEF';
              break;
            case 'speed' :
              element.name = 'SPD';
              break;
            default :
              console.log('error abbreviating stat name') 
          }
        })
        
        // same as above but for evYields
        evYields.forEach(element => {
          switch(element.name) {
            case 'hp' :
              element.name = 'HP';
              break;
            case 'attack' :
              element.name = 'ATK';
              break;
            case 'defense' :
              element.name = 'DEF';
              break;
            case 'special-attack' :
              element.name = 'SP.ATK';
              break;
            case 'special-defense' :
              element.name = 'SP.DEF';
              break;
            case 'speed' :
              element.name = 'SPD';
              break;
            default :
              console.log('error abbreviating stat name') 
          }
        })

        // reshape each ability
        res.data.abilities.forEach(ability => {
          let newObj = {
            name: ability.ability.name,
            url: ability.ability.url,
            is_hidden: ability.is_hidden,
            slot: ability.slot,
            description: '',
          };
          newAbilities.push(newObj);
        })

        // create pokemon object which will ultimately be what is returned/sent as res
        let pokemon = new Pokemon(
          res.data.name,
          res.data.id,
          100,
          'bashful',
          newAbilities,
          moveArr,
          res.data.sprites,
          newStats,
          res.data.types,
        )

        pokemon.genus = '';
        pokemon.catchRate = 0;
        pokemon.eggGroups = [];
        pokemon.growthRate = '';
        pokemon.genderRate = 0;
        pokemon.hatchTime = 0;
        pokemon.baseHappiness = 0;
        pokemon.baseExpYield = res.data.base_experience;
        pokemon.evYields = evYields;

        pokemon.height = {
          m: res.data.height / 10,
          ft: parseInt((res.data.height / 3.048).toFixed(2))
        };
        pokemon.weight = {
          kg: res.data.weight / 10,
          lb: parseInt((res.data.weight / 4.536).toFixed(2))
        };
        pokemon.forms = [];
        if (res.data.forms.length > 1) {
          res.data.forms.forEach(form => {
            let f = {
              name: form.name,
              url: form.url,
              apiId: form.url.match(/[^v]\d+/)[0].slice(1)
            }
            pokemon.forms.push(f);
          })
        }
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