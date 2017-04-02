import * as Vue from "vue";

function calculate(group: Group): Chance[] {
    if (group.top <= 0) {
        throw new Error(`wrong argument "top": ${top}`);
    }
    const possibilitiesCount = group.matches.reduce((p, c) => p * c.possibilities.length, 1);

    const chances: Chance[] = group.teams.map(t => ({
        name: t,
        chance: 0,
    }));

    for (let i = 0; i < possibilitiesCount; i++) {
        const scores = group.teams.map(t => ({
            name: t,
            score: 0,
        }));
        let j = i;
        for (const match of group.matches) {
            const possibility = match.possibilities[i % match.possibilities.length];
            scores.find(s => s.name === match.team1)!.score += possibility.score1;
            scores.find(s => s.name === match.team2)!.score += possibility.score2;
            j = j / match.possibilities.length;
        }
        scores.sort((a, b) => b.score - a.score);
        const drawStartIndex = scores.findIndex(s => s.score === scores[group.top - 1].score);
        const drawCount = scores.filter(s => s.score === scores[group.top - 1].score).length;
        for (let k = 0; k < scores.length; k++) {
            if (scores[k].score === scores[group.top - 1].score) {
                chances.find(s => s.name === scores[k].name)!.chance += ((group.top - drawStartIndex) / drawCount);
            } else if (k < group.top) {
                chances.find(s => s.name === scores[k].name)!.chance++;
            } else {
                break;
            }
        }
    }
    chances.sort((a, b) => b.chance - a.chance);
    return chances.map(c => ({ name: c.name, chance: Math.round(100 * c.chance / possibilitiesCount) / 100 }));
}

const defaultGroups = `[
    {
        "teams": [
            "AAA",
            "BBB",
            "CCC"
        ],
        "matches": [
            { "team1": "AAA", "team2": "BBB", "possibilities": [ { "score1": 3, "score2": 0 } ] },
            { "team1": "AAA", "team2": "CCC", "possibilities": [ { "score1": 3, "score2": 0 }, { "score1": 1, "score2": 1 } ] },
            { "team1": "BBB", "team2": "CCC", "possibilities": [ { "score1": 3, "score2": 0 }, { "score1": 1, "score2": 1 }, { "score1": 0, "score2": 3 } ] }
        ],
        "top": 2
    }
]`;

type This = {
    text: string;
    result: Chance[][];
} & Vue;

/* tslint:disable no-unused-expression */
new Vue({
    el: "#container",
    data: {
        text: localStorage.getItem("groups") || defaultGroups,
        result: [],
    },
    methods: {
        /* tslint:disable object-literal-shorthand */
        calculate: function(this: This) {
            const groups: Group[] = JSON.parse(this.text);
            const result: Chance[][] = [];
            for (const group of groups) {
                result.push(calculate(group));
            }
            this.result = result;
            localStorage.setItem("group", this.text);
        },
    },
});

type Match = {
    team1: string;
    team2: string;
    possibilities: {
        score1: number;
        score2: number;
    }[];
};

type Group = {
    matches: Match[];
    teams: string[];
    top: number;
};

type Chance = {
    name: string;
    chance: number;
};
