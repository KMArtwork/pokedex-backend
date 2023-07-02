class Pokemon {
  constructor(name, id, level, nature, abilities = [], moves = [], sprite, stats, types ) {
    this.abilities = abilities;
    this.battleMoves = [];
    this.battleAbility = '';
    this.descriptions = [];
    this.forms = [];
    this.height = {};
    this.heldItem = '';
    this.id = id;
    this.level = level;
    this.moves = moves;
    this.name = name;
    this.nature = nature;
    this.nickname = '';
    this.sprite = sprite;
    this.stats = stats;
    this.types = types;
    this.weight = {};
  }
}

module.exports = { Pokemon }