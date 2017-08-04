// tslint:disable:object-literal-key-quotes trailing-comma
export const generateMatchesTemplateHtml = `<div class="generate-matches"><div class="editor" ref="generateMatchesEditor"></div><div v-if="errorMessage" class="error-message">{{errorMessage}}</div><button @click="generate()">Generate</button><div class="editor" ref="generateMatchesResultEditor"></div></div>`;
export const indexTemplateHtml = `<div class="main"><div class="editor" ref="mainEditor"></div><div v-if="errorMessage" class="error-message">{{errorMessage}}</div><button @click="calculate()">Calculate</button><div class="result"><table v-for="(group, i) in result"><thead><tr><th>group {{i + 1}}</th><th v-for="top in group.tops">top {{top}} chance(%)</th><th>score</th><th>match count left</th></tr></thead><tbody><tr v-for="team in group.chances"><td>{{team.name}}</td><td v-for="chance in team.chances">{{chance}}</td><td>{{team.score}}</td><td>{{team.matchCountLeft}}</td></tr></tbody></table></div></div>`;
export const groupsSchemaJson = {
  "$ref": "#/definitions/Groups",
  "definitions": {
    "Groups": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Group"
      },
      "uniqueItems": true,
      "minItems": 1
    },
    "Group": {
      "type": "object",
      "properties": {
        "matches": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Match"
          },
          "uniqueItems": true,
          "minItems": 1
        },
        "teams": {
          "$ref": "#/definitions/Teams"
        },
        "tops": {
          "type": "array",
          "items": {
            "type": "integer",
            "minimum": 1
          },
          "uniqueItems": true,
          "minItems": 1
        }
      },
      "required": [
        "matches",
        "teams",
        "tops"
      ],
      "additionalProperties": false
    },
    "Match": {
      "type": "object",
      "properties": {
        "a": {
          "type": "string"
        },
        "b": {
          "type": "string"
        },
        "possibilities": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "a": {
                "type": "integer"
              },
              "b": {
                "type": "integer"
              }
            },
            "required": [
              "a",
              "b"
            ],
            "additionalProperties": false
          },
          "uniqueItems": true,
          "minItems": 1
        }
      },
      "required": [
        "a",
        "b",
        "possibilities"
      ],
      "additionalProperties": false
    },
    "Teams": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "uniqueItems": true,
      "minItems": 1
    }
  }
};
export const teamsSchemaJson = {
  "$ref": "#/definitions/Teams",
  "definitions": {
    "Teams": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "uniqueItems": true,
      "minItems": 1
    }
  }
};
// tslint:enable:object-literal-key-quotes trailing-comma
