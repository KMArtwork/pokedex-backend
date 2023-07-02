'use strict';

const axios = require('axios')

const supplementMoveData = async (pokemon) => {
  // spread operators to avoid 'TypeError: object is not extensible / object is read only' errors
  console.log('supplementing move data with missing info...')
  let newPokemon = {...pokemon};
  let newMoves = [];
  let promises = []; 

  try {
    for(let move of pokemon.moves){
      // console.log(`fetching ${move.name} data...`);
      promises.push(
        axios
        .get(`https://pokeapi.co/api/v2/move/${move.name}`)
        //eslint-disable-next-line
        .then(res => {
          let newMove = {...move};
          newMove.power = res.data.power;
          newMove.accuracy = res.data.accuracy;
          newMove.pp = res.data.pp;
          newMove.priority = res.data.priority;
          newMove.dmgClass = res.data.damage_class.name;
          newMove.type = res.data.type.name;
          newMove.effectChange = res.data.effect_chance;

          if(!res.data.effect_entries[0]?.short_effect){
            newMove.description = 'pokeAPI missing this information';
          } else {
            newMove.description = res.data.effect_entries[0].short_effect.replace('$effect_chance', res.data.effect_chance)              
          };

          newMoves = [...newMoves, newMove];
          newPokemon.moves = newMoves;
        })
      )
    }
  } 
  catch(e){
    console.error(e)
  }
  return Promise
    .all(promises)
    .then(() => {
      console.log('SUPPLEMENT MOVE DATA FINISHED')
      return newPokemon
    })
}

const fetchTypeEffectiveness = async (pokemon) => {
  console.log('fetching type effectiveness...')
  let promises = [];
  pokemon.types.forEach(async element => {
    try{
      promises.push(
        axios
        .get(element.type.url)
        .then(res => {
          element.doubleDamageFrom = [];
          element.halfDamageFrom = [];
          element.noDamageFrom = [];
    
          res.data.damage_relations.double_damage_from.forEach(async item => {
            element.doubleDamageFrom.push(item.name)
          });
    
          res.data.damage_relations.half_damage_from.forEach(async item => {
            element.halfDamageFrom.push(item.name)
          });
    
          res.data.damage_relations.no_damage_from.forEach(async item => {
            element.noDamageFrom.push(item.name)
          })
        })
      )
    } catch(err) {
      console.error(err)
    }
  })

  return Promise
    .all(promises)
    .then(res => {
      console.log('FINISHED FETCHING TYPE EFFECTIVENESS')
      return pokemon
    })
}

const fetchPokedexEntries = async (pokemon) => {
  console.log('fetching pokedex entries for all generations of this pokemon...')

  try {
    let response = await axios(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.name.split('-')[0]}`);

    response.data.flavor_text_entries.forEach(element => {
      if (element.language.name === 'en') {
        let description = {
          version: element.version.name,
          description: element.flavor_text.replace('', ' ')
        }
        pokemon.descriptions.push(description);
      }
    });

    for(let i = 0; i < response.data.genera.length; i++){
      let current = response.data.genera[i];
      if (current.language.name === 'en'){
        pokemon.genus = current.genus;
        break;
      }
    };

    response.data.egg_groups.forEach(element => {
      pokemon.eggGroups.push(element.name);
    })
    if (pokemon.forms.length === 0) {
      response.data.varieties.forEach(form => {
        let f = {
          name: form.pokemon.name,
          url: form.pokemon.url,
          apiId: form.pokemon.url.match(/[^v]\d+/)[0].slice(1),
        }
        pokemon.forms.push(f)
      })           
    };

    pokemon.hatchTime = response.data.hatch_counter;
    pokemon.catchRate = response.data.capture_rate;
    pokemon.genderRate = response.data.gender_rate;
    pokemon.baseHappiness = response.data.base_happiness;
    pokemon.growthRate = response.data.growth_rate;

  } catch(err) {
    console.log(err)
  }
  console.log('FINISHED FETCHING POKEDEX ENTRY INFO')
  return pokemon;
}

const fetchAbilityDescriptions = async (pokemon) => {
  console.log('fetching ability descriptions...')
  let newPokemon = {...pokemon};
  let newAbilities = [];
  let promises = [];

  try {
    for (const ability of pokemon.abilities){
      let newAbility = {...ability};
      promises.push(
        axios
          .get(ability.url)
          .then(response => {
            for(const entry of response.data.effect_entries){
              if(entry.language.name === 'en'){
                newAbility.description = entry.effect;
                break;
              }
            }
            newAbilities = [...newAbilities, newAbility];
            newPokemon.abilities = newAbilities;            
          })
      )
    }
  }
  catch(e){
    console.error(e)
  }

  return Promise
    .all(promises)
    .then(res => {
      console.log('FINISHED FETCHING ABILITY DESCRIPTIONS')
      return newPokemon;
    })
}

module.exports = {supplementMoveData, fetchTypeEffectiveness, fetchPokedexEntries, fetchAbilityDescriptions}
