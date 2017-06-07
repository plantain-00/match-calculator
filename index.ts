import * as Vue from "vue";
import Component from "vue-class-component";
import * as JSON5 from "json5";
import * as Ajv from "ajv";
import { indexTemplateHtml } from "./variables";

function calculate(group: Group): Chance[] {
    /**
     * for matches [[{a: 3, b: 0}], [{a: 3, b: 0}, {a: 1, b: 1}], [{a: 3, b: 0}, {a: 1, b: 1}, {a: 0, b: 3}]]
     * `possibilitiesCount` is 1 * 2 * 3 = 6
     */
    const possibilitiesCount = group.matches.reduce((p, c) => p * c.possibilities.length, 1);

    const chances: Chance[] = group.teams.map(t => ({
        name: t,
        chances: group.tops.map(top => 0),
        score: 0,
        matchCountLeft: 0,
    }));

    for (let i = 0; i < possibilitiesCount; i++) {
        const scores = group.teams.map(t => ({
            name: t,
            score: 0,
        }));
        /**
         * j | indexes
         * --- | ---
         * 0 | [0, 0, 0]
         * 1 | [0, 1, 0]
         * 2 | [0, 0, 1]
         * 3 | [0, 1, 1]
         * 4 | [0, 0, 2]
         * 5 | [0, 1, 2]
         */
        let j = i;
        for (const match of group.matches) {
            const possibility = match.possibilities[j % match.possibilities.length];
            if (possibility.a !== 0) {
                scores.find(s => s.name === match.a)!.score += possibility.a;
            }
            if (possibility.b !== 0) {
                scores.find(s => s.name === match.b)!.score += possibility.b;
            }
            j = Math.round(j / match.possibilities.length);
        }
        scores.sort((a, b) => b.score - a.score);
        for (let m = 0; m < group.tops.length; m++) {
            const top = group.tops[m];
            /**
             * for scores like [40, 30, 30, 30, 20, 10] and `top` is 3
             * `drawScore` is `scores[top - 1]`(30)
             * `drawStartIndex` is 1, `drawCount` is 3
             * any team that equals `drawScore` will get a chance of `(top - drawStartIndex) / drawCount`
             * otherwise any team `< top` will get a chance of 1
             * for this example, [1, 0.66, 0.66, 0.66, 0, 0]
             */
            const drawScore = scores[top - 1].score;
            const drawStartIndex = scores.findIndex(s => s.score === drawScore);
            const drawCount = scores.filter(s => s.score === drawScore).length;
            for (let k = 0; k < scores.length; k++) {
                if (scores[k].score === drawScore) {
                    chances.find(s => s.name === scores[k].name)!.chances[m] += ((top - drawStartIndex) / drawCount);
                } else if (k < top) {
                    chances.find(s => s.name === scores[k].name)!.chances[m]++;
                } else {
                    break;
                }
            }
        }
    }

    for (const match of group.matches) {
        if (match.possibilities.length === 1) {
            const possibility = match.possibilities[0];
            if (possibility.a !== 0) {
                chances.find(s => s.name === match.a)!.score += possibility.a;
            }
            if (possibility.b !== 0) {
                chances.find(s => s.name === match.b)!.score += possibility.b;
            }
        } else if (match.possibilities.length > 1) {
            chances.find(s => s.name === match.a)!.matchCountLeft++;
            chances.find(s => s.name === match.b)!.matchCountLeft++;
        }
    }

    chances.sort((a, b) => b.chances.reduce((p, c) => p + c, 0) - a.chances.reduce((p, c) => p + c, 0));

    return chances.map(c => ({
        name: c.name,
        chances: c.chances.map(chance => Math.round(100 * chance / possibilitiesCount)),
        score: c.score,
        matchCountLeft: c.matchCountLeft,
    }));
}

const ajv = new Ajv();
const validate = ajv.compile({
    type: "array",
    items: {
        type: "object",
        properties: {
            teams: {
                type: "array",
                items: {
                    type: "string",
                },
                uniqueItems: true,
            },
            matches: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        a: {
                            type: "string",
                        },
                        b: {
                            type: "string",
                        },
                        possibilities: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    a: {
                                        type: "integer",
                                    },
                                    b: {
                                        type: "integer",
                                    },
                                },
                                required: ["a", "b"],
                            },
                            minItems: 1,
                            uniqueItems: true,
                        },
                    },
                    required: ["a", "b", "possibilities"],
                },
                uniqueItems: true,
            },
            tops: {
                type: "array",
                items: {
                    type: "integer",
                    minimum: 1,
                },
                minItems: 1,
                uniqueItems: true,
            },
        },
        required: ["teams", "matches", "tops"],
    },
    uniqueItems: true,
});

const defaultGroups = `[
    {
        teams: [
            "AAA",
            "BBB",
            "CCC",
        ],
        matches: [
            { a: "AAA", b: "BBB", possibilities: [ { a: 3, b: 0 } ] },
            { a: "AAA", b: "CCC", possibilities: [ { a: 3, b: 0 }, { a: 1, b: 1 } ] },
            { a: "BBB", b: "CCC", possibilities: [ { a: 3, b: 0 }, { a: 1, b: 1 }, { a: 0, b: 3 } ] },
        ],
        tops: [2],
    },
]`;

const groupsLocalStorageKey = "groups";

@Component({
    template: indexTemplateHtml,
})
class App extends Vue {
    text = localStorage.getItem(groupsLocalStorageKey) || defaultGroups;
    result: GroupChance[] = [];
    errorMessage = "";

    calculate() {
        try {
            const groups: Group[] = JSON5.parse(this.text);
            if (!validate(groups)) {
                // tslint:disable-next-line:no-console
                console.log(validate.errors);
                this.errorMessage = validate.errors![0].schemaPath + ": " + validate.errors![0].message;
                this.result = [];
                return;
            }

            for (const group of groups) {
                for (const match of group.matches) {
                    if (group.teams.indexOf(match.a) === -1) {
                        this.errorMessage = `team name "${match.a}" should be in teams.`;
                        this.result = [];
                        return;
                    }
                    if (group.teams.indexOf(match.b) === -1) {
                        this.errorMessage = `team name "${match.b}" should be in teams.`;
                        this.result = [];
                        return;
                    }
                }
            }

            const result: GroupChance[] = [];
            for (const group of groups) {
                result.push({
                    tops: group.tops,
                    chances: calculate(group),
                });
            }
            this.result = result;
            localStorage.setItem(groupsLocalStorageKey, this.text);
            this.errorMessage = "";
        } catch (error) {
            this.errorMessage = error.message;
            this.result = [];
        }
    }
}

// tslint:disable-next-line:no-unused-expression
new App({ el: "#container" });

type Match = {
    a: string;
    b: string;
    possibilities: {
        a: number;
        b: number;
    }[];
};

type Group = {
    matches: Match[];
    teams: string[];
    tops: number[];
};

type Chance = {
    name: string;
    chances: number[];
    score: number;
    matchCountLeft: number;
};

type GroupChance = {
    tops: number[];
    chances: Chance[];
};

if (navigator.serviceWorker) {
    navigator.serviceWorker.register("service-worker.bundle.js").catch(error => {
        // tslint:disable-next-line:no-console
        console.log("registration failed with error: " + error);
    });
}
