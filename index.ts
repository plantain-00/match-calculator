import Vue from "vue";
import Component from "vue-class-component";
import * as JSON5 from "json5";
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

worker.onmessage = e => {
    const result: GroupChance[] = e.data;
    resultSubject.next(result);
};

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
const defaultTeams = `[
    "AAA",
    "BBB",
    "CCC",
]`;

const groupsLocalStorageKey = "groups";
const teamsLocalStorageKey = "teams";

@Component({
    template: indexTemplateHtml,
})
class Main extends Vue {
    text = localStorage.getItem(groupsLocalStorageKey) || defaultGroups;
    result: GroupChance[] = [];
    errorMessage = "";

    mounted() {
        resultSubject.subscribe(result => {
            this.result = result;
        });
    }

    beforeDestroy() {
        resultSubject.unsubscribe();
    }

    calculate() {
        try {
            localStorage.setItem(groupsLocalStorageKey, this.text);

            const groups: types.Group[] = JSON5.parse(this.text);
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
    text = localStorage.getItem(teamsLocalStorageKey) || defaultTeams;
    result = "";
    errorMessage = "";

    generate() {
        try {
            localStorage.setItem(teamsLocalStorageKey, this.text);

            const teams: string[] = JSON5.parse(this.text);
            if (!validateTeams(teams)) {
                // tslint:disable-next-line:no-console
                console.log(validateTeams.errors);
                this.errorMessage = validateTeams.errors![0].schemaPath + ": " + validateTeams.errors![0].message;
                this.result = "";
                return;
            }
            let result = "";
            for (let i = 0; i < teams.length; i++) {
                for (let j = i + 1; j < teams.length; j++) {
                    result += `            { a: "${teams[i]}", b: "${teams[j]}", possibilities: [] },\n`;
                }
            }
            this.result = result;
            this.errorMessage = "";
        } catch (error) {
            this.errorMessage = error.message;
            this.result = "";
        }
    }
}

Vue.component("main-page", Main);

Vue.component("generate-matches", GenerateMatches);

@Component({
    template: `<tab-container :data="data"></tab-container>`,
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
}

// tslint:disable-next-line:no-unused-expression
new App({ el: "#container" });

if (navigator.serviceWorker) {
    navigator.serviceWorker.register("service-worker.bundle.js").catch(error => {
        // tslint:disable-next-line:no-console
        console.log("registration failed with error: " + error);
    });
}
