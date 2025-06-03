// src/utils/combatEngine.js

export class CombatEngine {
    constructor() {
        this.enemyTemplates = {
            goblin: {
                name: "Goblin",
                level: 1,
                maxHp: 7,
                dicePool: "2d4", // Simple dice pool for enemies
                xpReward: 25,
                lootTable: ["potion", "coins"]
            },
            orc: {
                name: "Orc",
                level: 2,
                maxHp: 15,
                dicePool: "3d4",
                xpReward: 50,
                lootTable: ["weapon", "coins", "potion"]
            },
            skeleton: {
                name: "Skeleton",
                level: 1,
                maxHp: 13,
                dicePool: "2d4+1",
                xpReward: 30,
                lootTable: ["bones", "coins"]
            },
            troll: {
                name: "Troll",
                level: 5,
                maxHp: 84,
                dicePool: "6d4+2",
                xpReward: 200,
                lootTable: ["rare_weapon", "gold", "gem"]
            }
        };
    }

    // Enhanced dice rolling utility that handles multiple dice types
    rollDice(diceString) {
        if (!diceString || typeof diceString !== 'string') {
            console.warn('Invalid dice string:', diceString);
            return 0;
        }

        // Handle complex dice pools like "5d4" or "3d6+2d4+1"
        const parts = diceString.split('+');
        let total = 0;

        for (const part of parts) {
            const trimmedPart = part.trim();

            // Check if it's just a number (flat bonus)
            if (/^\d+$/.test(trimmedPart)) {
                total += parseInt(trimmedPart);
                continue;
            }

            // Parse dice notation like "5d4" or "2d6"
            const match = trimmedPart.match(/(\d+)d(\d+)/);
            if (match) {
                const [, numDice, dieSize] = match;
                const num = parseInt(numDice);
                const size = parseInt(dieSize);

                for (let i = 0; i < num; i++) {
                    total += Math.floor(Math.random() * size) + 1;
                }
            }
        }

        return Math.max(0, total);
    }

    // Calculate character's dice pool based on attributes (excluding constitution)
    getCharacterDicePool(character) {
        if (!character?.attributes) {
            console.warn('Character has no attributes, using default dice pool');
            return {
                dicePool: "1d4",
                totalDice: 1,
                breakdown: { default: 1 }
            };
        }

        const attributeNames = ['strength', 'dexterity', 'intelligence', 'wisdom', 'charisma'];
        const breakdown = {};
        let totalDice = 0;

        // Calculate dice per attribute based on level
        attributeNames.forEach(attrName => {
            const attribute = character.attributes[attrName];
            if (attribute) {
                // Use base score to determine dice count (could also use total with bonuses)
                const score = attribute.base || 10;
                // Simple formula: every 3 points above 8 gives 1d4, minimum 1d4
                const diceCount = Math.max(1, Math.floor((score - 8) / 3));
                breakdown[attrName] = diceCount;
                totalDice += diceCount;
            }
        });

        // Build dice pool string
        const dicePool = totalDice > 0 ? `${totalDice}d4` : "1d4";

        return {
            dicePool,
            totalDice,
            breakdown,
            description: `${totalDice} dice from attributes: ${Object.entries(breakdown).map(([attr, count]) => `${attr}(${count})`).join(', ')}`
        };
    }

    // Alternative method using the getDiceNotation utility (if you prefer that approach)
    getCharacterDicePoolFromNotation(character) {
        // Import the utility function if available
        try {
            const { getDiceNotation } = require('./getDiceNotation');
            const notation = getDiceNotation(character);

            // Combine all attribute dice into one pool
            const allDice = Object.values(notation).join('+');
            return {
                dicePool: allDice || "1d4",
                notation: notation,
                description: `Dice from attributes: ${Object.entries(notation).map(([attr, dice]) => `${attr}(${dice})`).join(', ')}`
            };
        } catch (error) {
            console.warn('getDiceNotation not available, using simple calculation');
            return this.getCharacterDicePool(character);
        }
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

    // Execute one combat round with dice pool system
    executeCombatRound(character, enemy) {
        // Get character dice pool
        const charDiceInfo = this.getCharacterDicePool(character);
        const charRoll = this.rollDice(charDiceInfo.dicePool);

        // Enemy roll
        const enemyRoll = this.rollDice(enemy.dicePool);

        // Determine winner and apply damage
        let result = {
            characterRoll: charRoll,
            enemyRoll: enemyRoll,
            characterDice: charDiceInfo,
            enemyDice: { dicePool: enemy.dicePool },
            damage: 0,
            winner: null,
            newCharacterHp: character.current_hp || character.currentHp,
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
            result.newCharacterHp = Math.max(0, (character.current_hp || character.currentHp) - result.damage);
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

    // Utility method to simulate dice rolls for testing
    simulateRolls(dicePool, numRolls = 10) {
        const results = [];
        for (let i = 0; i < numRolls; i++) {
            results.push(this.rollDice(dicePool));
        }

        const average = results.reduce((a, b) => a + b, 0) / results.length;
        const min = Math.min(...results);
        const max = Math.max(...results);

        return {
            results,
            average: Math.round(average * 100) / 100,
            min,
            max,
            dicePool
        };
    }
}