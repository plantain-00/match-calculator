import * as Vue from "vue";
import Component from "vue-class-component";
import * as JSON5 from "json5";
import * as Ajv from "ajv";
import { indexTemplateHtml } from "./variables";

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
            scores.find(s => s.name === match.a)!.score += possibility.a;
            scores.find(s => s.name === match.b)!.score += possibility.b;
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
            top: {
                type: "integer",
                minimum: 1,
            },
        },
        required: ["teams", "matches", "top"],
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
        top: 2,
    },
]`;

const groupsLocalStorageKey = "groups";

@Component({
    template: indexTemplateHtml,
})
class App extends Vue {
    text = localStorage.getItem(groupsLocalStorageKey) || defaultGroups;
    result: Chance[][] = [];
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

            const result: Chance[][] = [];
            for (const group of groups) {
                result.push(calculate(group));
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
    top: number;
};

type Chance = {
    name: string;
    chance: number;
};

if (navigator.serviceWorker) {
    navigator.serviceWorker.register("service-worker.bundle.js").catch(error => {
        // tslint:disable-next-line:no-console
        console.log("registration failed with error: " + error);
    });
}
