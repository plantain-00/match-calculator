import Vue from "vue";
import Component from "vue-class-component";
import * as Ajv from "ajv";
import { Subject } from "rxjs/Subject";
import { indexTemplateHtml, generateMatchesTemplateHtml, groupsSchemaJson, teamsSchemaJson } from "./variables";
import * as types from "./types";
import { GroupChance } from "./worker";

const ajv = new Ajv();
const validateGroups = ajv.compile(groupsSchemaJson);
const validateTeams = ajv.compile(teamsSchemaJson);
const worker = new Worker("worker.bundle.js");
const resultSubject = new Subject<GroupChance[]>();
declare const editors: {
    main: EditorData;
    generateMatches: EditorData;
    generateMatchesResult: EditorData;
};
declare function loadEditor(value: EditorData): void;
declare let isGenerateMatchesLoaded: boolean;

worker.onmessage = e => {
    const result: GroupChance[] = e.data;
    resultSubject.next(result);
};

const defaultGroups = `[
    {
        "teams": [
            "AAA",
            "BBB",
            "CCC"
        ],
        "matches": [
            { "a": "AAA", "b": "BBB", "possibilities": [ { "a": 3, "b": 0 } ] },
            { "a": "AAA", "b": "CCC", "possibilities": [ { "a": 3, "b": 0 }, { "a": 1, "b": 1 } ] },
            { "a": "BBB", "b": "CCC", "possibilities": [ { "a": 3, "b": 0 }, { "a": 1, "b": 1 }, { "a": 0, "b": 3 } ] }
        ],
        "tops": [2]
    }
]`;
const defaultTeams = `[
    "AAA",
    "BBB",
    "CCC"
]`;

const groupsLocalStorageKey = "groups";
const teamsLocalStorageKey = "teams";

@Component({
    template: indexTemplateHtml,
})
class Main extends Vue {
    result: GroupChance[] = [];
    errorMessage = "";

    mounted() {
        resultSubject.subscribe(result => {
            this.result = result;
        });
        editors.main = {
            element: this.$refs.mainEditor as HTMLElement,
            code: localStorage.getItem(groupsLocalStorageKey) || defaultGroups,
        };
    }

    beforeDestroy() {
        resultSubject.unsubscribe();
    }

    calculate() {
        try {
            const json = editors.main.editor!.getValue();
            localStorage.setItem(groupsLocalStorageKey, json);

            const groups: types.Groups = JSON.parse(json);
            if (!validateGroups(groups)) {
                // tslint:disable-next-line:no-console
                console.log(validateGroups.errors);
                this.errorMessage = validateGroups.errors![0].schemaPath + ": " + validateGroups.errors![0].message;
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

            worker.postMessage(groups);
            this.errorMessage = "";
        } catch (error) {
            this.errorMessage = error.message;
            this.result = [];
        }
    }
}

@Component({
    template: generateMatchesTemplateHtml,
})
class GenerateMatches extends Vue {
    errorMessage = "";

    mounted() {
        editors.generateMatches = {
            element: this.$refs.generateMatchesEditor as HTMLElement,
            code: localStorage.getItem(teamsLocalStorageKey) || defaultTeams,
        };
        editors.generateMatchesResult = {
            element: this.$refs.generateMatchesResultEditor as HTMLElement,
            code: "",
        };
    }

    generate() {
        try {
            const json = editors.generateMatches.editor!.getValue();
            localStorage.setItem(teamsLocalStorageKey, json);

            const teams: string[] = JSON.parse(json);
            if (!validateTeams(teams)) {
                // tslint:disable-next-line:no-console
                console.log(validateTeams.errors);
                this.errorMessage = validateTeams.errors![0].schemaPath + ": " + validateTeams.errors![0].message;
                editors.generateMatchesResult.editor!.setValue("");
                return;
            }
            const result: string[] = [];
            for (let i = 0; i < teams.length; i++) {
                for (let j = i + 1; j < teams.length; j++) {
                    result.push(`            { "a": "${teams[i]}", "b": "${teams[j]}", "possibilities": [] }`);
                }
            }
            editors.generateMatchesResult.editor!.setValue(`[\n${result.join(",\n")}\n]`);
            this.errorMessage = "";
        } catch (error) {
            this.errorMessage = error.message;
            editors.generateMatchesResult.editor!.setValue("");
        }
    }
}

Vue.component("main-page", Main);

Vue.component("generate-matches", GenerateMatches);

@Component({
    template: `<tab-container :data="data" @switching="switching($event)"></tab-container>`,
})
class App extends Vue {
    data = [
        {
            isActive: true,
            title: "Main",
            component: "main-page",
        },
        {
            isActive: false,
            title: "Generate Matches",
            component: "generate-matches",
        },
    ];

    switching(index: number) {
        if (index === 1 && !isGenerateMatchesLoaded) {
            Vue.nextTick(() => {
                Vue.nextTick(() => {
                    loadEditor(editors.generateMatches);
                    loadEditor(editors.generateMatchesResult);
                    isGenerateMatchesLoaded = true;
                });
            });
        }
    }
}

// tslint:disable-next-line:no-unused-expression
new App({ el: "#container" });

if (navigator.serviceWorker) {
    navigator.serviceWorker.register("service-worker.bundle.js").catch(error => {
        // tslint:disable-next-line:no-console
        console.log("registration failed with error: " + error);
    });
}

type EditorData = {
    element: HTMLElement;
    code: string;
    editor?: {
        getValue(): string;
        setValue(code: string): void;
    };
};
