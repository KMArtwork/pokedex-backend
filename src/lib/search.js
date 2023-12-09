'use strict';
const axios = require('axios')

// reformat edge case search queries because of how pokeapi is set up
const handleSearchQueryEdgeCases = (searchQuery) => {
  switch (searchQuery) {
    case 'nidoran♀':
      return 'nidoran-f';
    case 'nidoran♂':
      return 'nidoran-m';
    case 'wormadam':
      return 'wormadam-plant';
    case 'basculin':
      return 'basculin-red-striped';
    case 'darmanitan':
      return 'darmanitan-standard';
    case 'zygarde':
      return 'zygarde-50';
    case 'giratina':
      return 'giratina-altered';
    default:
      return searchQuery;
  }
}

const supplementMoveData = async (pokemon) => {
  // spread operators to avoid 'TypeError: object is not extensible / object is read only' errors
  console.log('supplementing move data with missing info... \n')
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
          newMove.effectChance = res.data.effect_chance;
          newMove.meta = res.data.meta ? {
            ailmentName: res.data.meta.ailment.name !== 'none' ? res.data.meta.ailment.name : null,
            ailmentChance: res.data.meta.ailment_chance,
            critChance: res.data.meta.crit_rate,
            flinchChance: res.data.meta.flinch_chance,
            drain: res.data.meta.drain,
            healing: res.data.meta.healing,
            maxHit: res.data.meta.max_hits,
            minHit: res.data.meta.min_hits,
            maxTurns: res.data.meta.max_turns,
            minTurns: res.data.meta.min_turns,
            statChangeChance: res.data.meta.stat_chance,
          } : 'API Missing Data'

          if(!res.data.effect_entries[0]?.short_effect){
            newMove.description = 'pokeAPI missing this information';
          } else {
            newMove.description = res.data.effect_entries[0].short_effect.replace('$effect_chance', res.data.effect_chance)              
          };

          newMove.flavorTextEntries = [];
          res.data.flavor_text_entries.forEach((entry) => {
            if(entry.language.name === 'en'){
              newMove.flavorTextEntries.push({
                flavorText: entry.flavor_text,
                version: entry.version_group.name
              })
            }
          })

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
      console.log('FINISHED SUPPLEMENTING MOVE DATA  \n')
      return newPokemon
    })
}

const fetchTypeEffectiveness = async (pokemon) => {
  console.log('fetching type effectiveness... \n')
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
      console.log('FINISHED FETCHING TYPE EFFECTIVENESS \n')
      return pokemon
    })
}

const fetchPokedexEntries = async (pokemon) => {
  console.log('fetching pokedex entries for all generations of this pokemon...\n')

  try {
    let response = await axios(pokemon.species.url);

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

    response.data.varieties.forEach(form => {
      let f = {
        name: form.pokemon.name,
        url: form.pokemon.url,
        apiId: form.pokemon.url.match(/[^v]\d+/)[0].slice(1),
      }
      pokemon.forms.push(f)
    })           


    pokemon.hatchTime = response.data.hatch_counter;
    pokemon.catchRate = response.data.capture_rate;
    pokemon.genderRate = response.data.gender_rate;
    pokemon.baseHappiness = response.data.base_happiness;
    pokemon.growthRate = response.data.growth_rate;

  } catch(err) {
    console.log(err)
  }
  console.log('FINISHED FETCHING POKEDEX ENTRY INFO \n')
  return pokemon;
}

const fetchAbilityDescriptions = async (pokemon) => {
  console.log('fetching ability descriptions... \n')
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
      console.log('FINISHED FETCHING ABILITY DESCRIPTIONS \n')
      return newPokemon;
    })
}

module.exports = {supplementMoveData, fetchTypeEffectiveness, fetchPokedexEntries, fetchAbilityDescriptions, handleSearchQueryEdgeCases}
