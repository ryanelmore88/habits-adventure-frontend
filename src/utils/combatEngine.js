// 1. Combat Engine (pure frontend logic)
// utils/combatEngine.js

export class CombatEngine {
    constructor() {
        this.enemyTemplates = {
            goblin: {
                name: "Goblin",
                level: 1,
                maxHp: 7,
                attackBonus: 4,
                damageDice: "1d6+2",
                xpReward: 25,
                lootTable: ["potion", "coins"]
            },
            orc: {
                name: "Orc",
                level: 2,
                maxHp: 15,
                attackBonus: 5,
                damageDice: "1d8+3",
                xpReward: 50,
                lootTable: ["weapon", "coins", "potion"]
            },
            troll: {
                name: "Troll",
                level: 5,
                maxHp: 84,
                attackBonus: 7,
                damageDice: "2d6+4",
                xpReward: 200,
                lootTable: ["rare_weapon", "gold", "gem"]
            }
        };
    }

    // Dice rolling utility
    rollDice(diceString) {
        const match = diceString.match(/(\d+)d(\d+)(?:([+-])(\d+))?/);
        if (!match) return 0;

        const [, numDice, dieSize, operator, modifier] = match;
        const num = parseInt(numDice);
        const size = parseInt(dieSize);
        const mod = modifier ? parseInt(modifier) : 0;

        let total = 0;
        for (let i = 0; i < num; i++) {
            total += Math.floor(Math.random() * size) + 1;
        }

        if (operator === '+') total += mod;
        if (operator === '-') total -= mod;

        return Math.max(0, total);
    }

    // Calculate character's dice pool based on best attribute
    getCharacterDicePool(character) {
        let bestBonus = 0;
        let bestAttribute = "strength";

        Object.entries(character.attributes || {}).forEach(([name, data]) => {
            const bonus = data.bonus || 0;
            if (bonus > bestBonus) {
                bestBonus = bonus;
                bestAttribute = name;
            }
        });

        return {
            dicePool: `1d20+${bestBonus}`,
            attribute: bestAttribute,
            bonus: bestBonus
        };
    }

    // Create enemy instance
    createEnemy(type = 'goblin') {
        const template = this.enemyTemplates[type] || this.enemyTemplates.goblin;
        return {
            ...template,
            currentHp: template.maxHp,
            id: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
    }

    // Execute one combat round
    executeCombatRound(character, enemy) {
        // Get character dice pool
        const charDice = this.getCharacterDicePool(character);
        const charRoll = this.rollDice(charDice.dicePool);

        // Enemy roll
        const enemyRoll = this.rollDice(enemy.damageDice);

        // Determine winner and apply damage
        let result = {
            characterRoll: charRoll,
            enemyRoll: enemyRoll,
            characterDice: charDice,
            enemyDice: enemy.damageDice,
            damage: 0,
            winner: null,
            newCharacterHp: character.currentHp,
            newEnemyHp: enemy.currentHp
        };

        if (charRoll > enemyRoll) {
            // Character wins
            result.damage = charRoll - enemyRoll;
            result.winner = 'character';
            result.newEnemyHp = Math.max(0, enemy.currentHp - result.damage);
        } else if (enemyRoll > charRoll) {
            // Enemy wins
            result.damage = enemyRoll - charRoll;
            result.winner = 'enemy';
            result.newCharacterHp = Math.max(0, character.currentHp - result.damage);
        } else {
            // Tie
            result.winner = 'tie';
        }

        result.combatEnded = result.newCharacterHp <= 0 || result.newEnemyHp <= 0;
        result.victory = result.newEnemyHp <= 0 && result.newCharacterHp > 0;
        result.defeat = result.newCharacterHp <= 0;

        return result;
    }

    // Generate loot when enemy is defeated
    generateLoot(enemy) {
        const loot = [];
        const lootTable = enemy.lootTable || [];

        lootTable.forEach(item => {
            if (Math.random() < 0.3) { // 30% chance per item
                loot.push({
                    type: item,
                    quantity: Math.floor(Math.random() * 3) + 1,
                    id: `loot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                });
            }
        });

        return loot;
    }
}