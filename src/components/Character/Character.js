// File: src/utils/Character.js
// Character-based dice pool system with extended dice progression

export class Character {
    constructor(characterData) {
        this.id = characterData.id;
        this.name = characterData.name;
        this.image_data = characterData.image_data;
        this.attributes = this.processAttributes(characterData.attributes || {});

        // Calculate derived stats
        this.maxHp = this.calculateMaxHP();
        this.currentHp = characterData.current_hp || this.maxHp;
        this.level = characterData.level || 1;
        this.currentXp = characterData.current_xp || 0;
    }

    // Extended dice progression for levels 1-20
    getDiceProgression(level) {
        const progressions = {
            1: [{ sides: 4, count: 1 }],
            2: [{ sides: 6, count: 1 }],
            3: [{ sides: 8, count: 1 }],
            4: [{ sides: 12, count: 1 }],
            5: [{ sides: 12, count: 1 }, { sides: 4, count: 1 }],
            6: [{ sides: 12, count: 1 }, { sides: 6, count: 1 }],
            7: [{ sides: 12, count: 1 }, { sides: 8, count: 1 }],
            8: [{ sides: 12, count: 2 }],
            9: [{ sides: 12, count: 2 }, { sides: 4, count: 1 }],
            10: [{ sides: 12, count: 2 }, { sides: 6, count: 1 }],
            11: [{ sides: 12, count: 2 }, { sides: 8, count: 1 }],
            12: [{ sides: 12, count: 3 }],
            13: [{ sides: 12, count: 3 }, { sides: 4, count: 1 }],
            14: [{ sides: 12, count: 3 }, { sides: 6, count: 1 }],
            15: [{ sides: 12, count: 3 }, { sides: 8, count: 1 }],
            16: [{ sides: 12, count: 4 }],
            17: [{ sides: 12, count: 4 }, { sides: 4, count: 1 }],
            18: [{ sides: 12, count: 4 }, { sides: 6, count: 1 }],
            19: [{ sides: 12, count: 4 }, { sides: 8, count: 1 }],
            20: [{ sides: 12, count: 5 }]
        };

        return progressions[level] || progressions[1];
    }

    // Convert dice progression to readable notation
    getDiceNotation(level) {
        const dice = this.getDiceProgression(level);
        return dice.map(die => `${die.count}d${die.sides}`).join(' + ');
    }

    // Process attributes to include levels and dice pools
    processAttributes(attributesData) {
        const attributeNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        const processedAttributes = {};

        for (const name of attributeNames) {
            const attrData = attributesData[name] || { base: 10, habit_points: 0 };
            const level = this.calculateAttributeLevel(attrData.base || 10, attrData.habit_points || 0);

            processedAttributes[name] = {
                base: attrData.base || 10,
                habitPoints: attrData.habit_points || 0,
                level: level,
                diceProgression: this.getDiceProgression(level),
                diceNotation: this.getDiceNotation(level),
                effectiveScore: (attrData.base || 10) + Math.floor((attrData.habit_points || 0) / 5)
            };
        }

        return processedAttributes;
    }

    // Calculate attribute level based on base score + habit points
    // Extended to support levels 1-20
    calculateAttributeLevel(baseScore, habitPoints) {
        const effectiveScore = baseScore + Math.floor(habitPoints / 5);

        // Extended level progression - every 2 points after 10 = +1 level
        if (effectiveScore >= 48) return 20; // 48+ for level 20
        if (effectiveScore >= 46) return 19;
        if (effectiveScore >= 44) return 18;
        if (effectiveScore >= 42) return 17;
        if (effectiveScore >= 40) return 16;
        if (effectiveScore >= 38) return 15;
        if (effectiveScore >= 36) return 14;
        if (effectiveScore >= 34) return 13;
        if (effectiveScore >= 32) return 12;
        if (effectiveScore >= 30) return 11;
        if (effectiveScore >= 28) return 10;
        if (effectiveScore >= 26) return 9;
        if (effectiveScore >= 24) return 8;
        if (effectiveScore >= 22) return 7;
        if (effectiveScore >= 20) return 6;
        if (effectiveScore >= 18) return 5;
        if (effectiveScore >= 16) return 4;
        if (effectiveScore >= 14) return 3;
        if (effectiveScore >= 12) return 2;
        return 1; // 10-11 for level 1
    }

    // Calculate max HP using Constitution dice progression
    calculateMaxHP() {
        const constitution = this.attributes.constitution;
        const baseHP = 20; // Base HP for all characters

        // For now, using same dice progression for Constitution
        // We can adjust this later if HP scaling becomes too high
        const constitutionDice = constitution.diceProgression;

        // Calculate average HP bonus from Constitution dice
        let avgDiceValue = 0;
        for (const die of constitutionDice) {
            const avgPerDie = (die.sides + 1) / 2; // Average of a die
            avgDiceValue += avgPerDie * die.count;
        }

        const levelBonus = (this.level - 1) * 2; // +2 HP per level after 1st

        return Math.max(1, Math.floor(baseHP + avgDiceValue + levelBonus));
    }

    // Get character's combat dice pool (all attributes except Constitution)
    getCombatDicePool() {
        const combatAttributes = ['strength', 'dexterity', 'intelligence', 'wisdom', 'charisma'];

        // Collect all dice from combat attributes
        const allDice = [];
        let totalMaxDamage = 0;

        for (const attrName of combatAttributes) {
            const attribute = this.attributes[attrName];
            for (const dieType of attribute.diceProgression) {
                for (let i = 0; i < dieType.count; i++) {
                    allDice.push({
                        sides: dieType.sides,
                        attribute: attrName,
                        maxValue: dieType.sides
                    });
                    totalMaxDamage += dieType.sides;
                }
            }
        }

        return {
            dice: allDice,
            totalDice: allDice.length,
            maxPossibleDamage: totalMaxDamage,
            notation: this.getCombatNotation(),
            details: this.getCombatDiceDetails()
        };
    }

    // Get readable notation for combat dice pool
    getCombatNotation() {
        const combatAttributes = ['strength', 'dexterity', 'intelligence', 'wisdom', 'charisma'];
        const notations = [];

        for (const attrName of combatAttributes) {
            const attribute = this.attributes[attrName];
            if (attribute.level > 0) {
                notations.push(attribute.diceNotation);
            }
        }

        return notations.join(' + ');
    }

    // Get detailed breakdown of combat dice calculation
    getCombatDiceDetails() {
        const combatAttributes = ['strength', 'dexterity', 'intelligence', 'wisdom', 'charisma'];
        const details = [];

        for (const attrName of combatAttributes) {
            const attr = this.attributes[attrName];
            details.push({
                name: attrName,
                level: attr.level,
                diceNotation: attr.diceNotation,
                diceProgression: attr.diceProgression,
                effectiveScore: attr.effectiveScore,
                description: `${attrName.charAt(0).toUpperCase() + attrName.slice(1)}: Level ${attr.level} (${attr.diceNotation})`
            });
        }

        return details;
    }

    // Get attribute level name for levels 1-20
    getAttributeLevelName(level) {
        if (level >= 18) return 'Godlike';
        if (level >= 15) return 'Legendary';
        if (level >= 12) return 'Heroic';
        if (level >= 9) return 'Expert';
        if (level >= 6) return 'Adept';
        if (level >= 3) return 'Trained';
        return 'Novice';
    }

    // Roll dice for a specific attribute (for tracking max values)
    rollAttributeDice(attributeName) {
        const attribute = this.attributes[attributeName];
        if (!attribute) return { total: 0, dice: [], maxValueRolls: [] };

        const results = [];
        const maxValueRolls = [];
        let total = 0;

        for (const dieType of attribute.diceProgression) {
            for (let i = 0; i < dieType.count; i++) {
                const roll = Math.floor(Math.random() * dieType.sides) + 1;
                results.push({
                    sides: dieType.sides,
                    value: roll,
                    attribute: attributeName,
                    isMaxValue: roll === dieType.sides
                });

                total += roll;

                // Track max value rolls for special effects
                if (roll === dieType.sides) {
                    maxValueRolls.push({
                        attribute: attributeName,
                        damage: roll,
                        dieType: `d${dieType.sides}`
                    });
                }
            }
        }

        return {
            total,
            dice: results,
            maxValueRolls,
            notation: attribute.diceNotation
        };
    }

    // Roll all combat dice with attribute tracking
    rollCombatDice() {
        const combatAttributes = ['strength', 'dexterity', 'intelligence', 'wisdom', 'charisma'];
        const allResults = [];
        const allMaxValueRolls = [];
        let grandTotal = 0;

        for (const attrName of combatAttributes) {
            const result = this.rollAttributeDice(attrName);
            allResults.push({
                attribute: attrName,
                ...result
            });
            grandTotal += result.total;
            allMaxValueRolls.push(...result.maxValueRolls);
        }

        return {
            total: grandTotal,
            attributeResults: allResults,
            maxValueRolls: allMaxValueRolls,
            allDice: allResults.flatMap(r => r.dice)
        };
    }

    // Get character summary for UI
    getCharacterSummary() {
        const combatDice = this.getCombatDicePool();

        return {
            name: this.name,
            level: this.level,
            hp: `${this.currentHp}/${this.maxHp}`,
            combatDice: combatDice.notation,
            totalDice: combatDice.totalDice,
            maxPossibleDamage: combatDice.maxPossibleDamage,
            highestAttribute: this.getHighestAttribute(),
            constitution: {
                level: this.attributes.constitution.level,
                diceNotation: this.attributes.constitution.diceNotation,
                effectiveScore: this.attributes.constitution.effectiveScore
            }
        };
    }

    // Find the character's highest attribute
    getHighestAttribute() {
        let highest = { name: 'strength', level: 1 };

        for (const [name, attr] of Object.entries(this.attributes)) {
            if (attr.level > highest.level) {
                highest = { name, level: attr.level };
            }
        }

        return {
            name: highest.name,
            level: highest.level,
            levelName: this.getAttributeLevelName(highest.level)
        };
    }

    // Update character data (for when backend data changes)
    updateFromData(newData) {
        this.attributes = this.processAttributes(newData.attributes || {});
        this.maxHp = this.calculateMaxHP();
        this.currentHp = newData.current_hp || this.currentHp;
        this.level = newData.level || this.level;
        this.currentXp = newData.current_xp || this.currentXp;
    }

    // Convert back to the format expected by existing components
    toComponentFormat() {
        return {
            id: this.id,
            name: this.name,
            image_data: this.image_data,
            level: this.level,
            current_hp: this.currentHp,
            max_hp: this.maxHp,
            current_xp: this.currentXp,
            attributes: this.attributes
        };
    }
}