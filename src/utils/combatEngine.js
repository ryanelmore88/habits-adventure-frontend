// File: src/utils/combatEngine.js
// Cleaned CombatEngine focused only on combat calculations and logic

export class CombatEngine {
    constructor() {
        // Keep minimal enemy templates as fallback only
        this.enemyTemplates = {
            goblin: {
                name: "Goblin",
                level: 1,
                maxHp: 7,
                dicePool: "2d4",
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
            },
            dragon: {
                name: "Young Dragon",
                level: 5,
                maxHp: 84,
                dicePool: "2d12",
                xpReward: 400,
                lootTable: ["dragon scale", "gold", "gem"]
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
                breakdown: { default: 1 },
                description: "Default dice pool (no character attributes)"
            };
        }

        const attributeNames = ['strength', 'dexterity', 'intelligence', 'wisdom', 'charisma'];
        const breakdown = {};
        let totalDice = 0;

        // Calculate dice per attribute based on level
        attributeNames.forEach(attrName => {
            const attribute = character.attributes[attrName];
            if (attribute) {
                // Use base score to determine dice count
                const score = attribute.base || 10;
                // Every 3 points above 8 gives 1d4, minimum 1d4
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

    // Create enemy instance (FALLBACK ONLY - prefer external enemy data)
    createEnemy(type = 'goblin') {
        const template = this.enemyTemplates[type] || this.enemyTemplates.goblin;
        console.warn(`Using fallback enemy template for: ${type}`);

        return {
            ...template,
            currentHp: template.maxHp
        };
    }

    // Execute a round of combat between character and enemy
    executeCombatRound(character, enemy) {
        if (!character || !enemy) {
            return {
                error: 'Missing character or enemy',
                combatEnded: true,
                victory: false,
                defeat: true
            };
        }

        // Roll dice for character
        const characterDiceInfo = this.getCharacterDicePool(character);
        const characterRoll = this.rollDice(characterDiceInfo.dicePool);

        // Roll dice for enemy
        const enemyRoll = this.rollDice(enemy.dicePool || '2d4');

        // Determine winner and damage
        let winner, damage, description;

        if (characterRoll > enemyRoll) {
            winner = 'character';
            damage = Math.max(1, characterRoll - enemyRoll);
            description = `You rolled ${characterRoll}, ${enemy.name} rolled ${enemyRoll}. You deal ${damage} damage!`;
        } else if (enemyRoll > characterRoll) {
            winner = 'enemy';
            damage = Math.max(1, enemyRoll - characterRoll);
            description = `${enemy.name} rolled ${enemyRoll}, you rolled ${characterRoll}. You take ${damage} damage!`;
        } else {
            winner = 'tie';
            damage = 0;
            description = `Both rolled ${characterRoll}. No damage dealt this round.`;
        }

        // Calculate new HP values
        const currentCharacterHp = character.current_hp || character.max_hp || 20;
        const newCharacterHp = winner === 'enemy' ?
            Math.max(0, currentCharacterHp - damage) : currentCharacterHp;
        const newEnemyHp = winner === 'character' ?
            Math.max(0, enemy.currentHp - damage) : enemy.currentHp;

        // Check for combat end
        const combatEnded = newCharacterHp <= 0 || newEnemyHp <= 0;
        const victory = newEnemyHp <= 0 && newCharacterHp > 0;
        const defeat = newCharacterHp <= 0;

        return {
            winner,
            damage,
            description,
            characterRoll,
            enemyRoll,
            newCharacterHp,
            newEnemyHp,
            combatEnded,
            victory,
            defeat
        };
    }

    // Generate loot after victory
    generateLoot(enemy) {
        if (!enemy || !enemy.lootTable || enemy.lootTable.length === 0) {
            return [];
        }

        const loot = [];
        const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items

        for (let i = 0; i < numItems; i++) {
            const randomItem = enemy.lootTable[Math.floor(Math.random() * enemy.lootTable.length)];
            loot.push(randomItem);
        }

        return loot;
    }

    // Calculate experience gain with potential bonuses
    calculateExperienceGain(enemy, characterLevel = 1) {
        if (!enemy) return 0;

        let baseXp = enemy.xpReward || 0;

        // Level difference modifier
        const levelDiff = enemy.level - characterLevel;
        if (levelDiff > 2) {
            baseXp = Math.floor(baseXp * 1.5); // Bonus for fighting higher level enemies
        } else if (levelDiff < -2) {
            baseXp = Math.floor(baseXp * 0.5); // Reduced XP for fighting lower level enemies
        }

        return Math.max(1, baseXp);
    }
}