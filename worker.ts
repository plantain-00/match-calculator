'use strict'
import * as types from './types'

let isCalculating = false

async function calculateChances(group: types.Group, chances: Chance[]) {
  /**
   * for matches [[{a: 3, b: 0}], [{a: 3, b: 0}, {a: 1, b: 1}], [{a: 3, b: 0}, {a: 1, b: 1}, {a: 0, b: 3}]]
   * `possibilitiesCount` is 1 * 2 * 3 = 6
   */
  const possibilitiesCount = group.matches.reduce((p, c) => p * c.possibilities.length, 1)

  const initialMoment = Date.now()
  for (let i = 0; i < possibilitiesCount; i++) {
    if (!isCalculating) {
      return
    }
    if (i % 100000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0))
      if (i > 0) {
        const remainTime = getRelativeTime((Date.now() - initialMoment) * possibilitiesCount / i)
        const message: Message = {
          type: 'progress',
          progress: `${i} / ${possibilitiesCount}, will be done ${remainTime}`
        }
        postMessage(message, undefined as any)
      } else {
        const message: Message = {
          type: 'progress',
          progress: `${i} / ${possibilitiesCount}`
        }
        postMessage(message, undefined as any)
      }
    }
    const scores = group.teams.map(t => ({
      name: t,
      score: 0
    }))
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
    let j = i
    for (const match of group.matches) {
      const possibility = match.possibilities[j % match.possibilities.length]
      if (possibility.a !== 0) {
        scores.find(s => s.name === match.a)!.score += possibility.a
      }
      if (possibility.b !== 0) {
        scores.find(s => s.name === match.b)!.score += possibility.b
      }
      j = Math.round(j / match.possibilities.length)
    }
    scores.sort((a, b) => b.score - a.score)
    for (let m = 0; m < group.tops.length; m++) {
      const top = group.tops[m]
      /**
       * for scores like [40, 30, 30, 30, 20, 10] and `top` is 3
       * `drawScore` is `scores[top - 1]`(30)
       * `drawStartIndex` is 1, `drawCount` is 3
       * any team that equals `drawScore` will get a chance of `(top - drawStartIndex) / drawCount`
       * otherwise any team `< top` will get a chance of 1
       * for this example, [1, 0.66, 0.66, 0.66, 0, 0]
       */
      const drawScore = scores[top - 1].score
      const drawStartIndex = scores.findIndex(s => s.score === drawScore)
      const drawCount = scores.filter(s => s.score === drawScore).length
      for (let k = 0; k < scores.length; k++) {
        if (scores[k].score === drawScore) {
          chances.find(s => s.name === scores[k].name)!.chances[m] += ((top - drawStartIndex) / drawCount)
        } else if (k < top) {
          chances.find(s => s.name === scores[k].name)!.chances[m]++
        } else {
          break
        }
      }
    }
  }

  for (const c of chances) {
    c.chances = c.chances.map(chance => {
      const r = Math.round(100 * chance / possibilitiesCount)
      if (r === 100 && chance !== possibilitiesCount) {
        return 99
      }
      if (r === 0 && chance !== 0) {
        return 1
      }
      return r
    })
  }

  chances.sort((a, b) => {
    for (let i = 0; i < a.chances.length; i++) {
      if (b.chances[i] > a.chances[i]) {
        return 1
      }
      if (b.chances[i] < a.chances[i]) {
        return -1
      }
    }
    if (b.score > a.score) {
      return 1
    }
    if (b.score < a.score) {
      return -1
    }
    return b.matchCountLeft - a.matchCountLeft
  })
}

function calculateScoreAndMatchCountLeft(group: types.Group, chances: Chance[]) {
  for (const match of group.matches) {
    if (match.possibilities.length === 1) {
      const possibility = match.possibilities[0]
      if (possibility.a !== 0) {
        chances.find(s => s.name === match.a)!.score += possibility.a
      }
      if (possibility.b !== 0) {
        chances.find(s => s.name === match.b)!.score += possibility.b
      }
    } else if (match.possibilities.length > 1) {
      const chanceA = chances.find(s => s.name === match.a)!
      chanceA.matchCountLeft++
      chanceA.score += match.possibilities.reduce((v, p) => Math.min(p.a, v), Infinity)
      const chanceB = chances.find(s => s.name === match.b)!
      chanceB.matchCountLeft++
      chanceB.score += match.possibilities.reduce((v, p) => Math.min(p.b, v), Infinity)
    }
  }

  chances.sort((a, b) => {
    if (b.score > a.score) {
      return 1
    }
    if (b.score < a.score) {
      return -1
    }
    return b.matchCountLeft - a.matchCountLeft
  })
}

onmessage = async (e: { data: types.Group[] }) => {
  isCalculating = !isCalculating
  const groups = e.data
  const result: GroupChance[] = []

  for (const group of groups) {
    const chances: Chance[] = group.teams.map(t => ({
      name: t,
      chances: group.tops.map(() => 0),
      score: 0,
      matchCountLeft: 0
    }))

    calculateScoreAndMatchCountLeft(group, chances)

    result.push({
      tops: group.tops,
      chances
    })
  }
  const initialResult: Message = {
    type: 'initial-result',
    result
  }
  postMessage(initialResult, undefined as any)

  for (let i = 0; i < groups.length; i++) {
    await calculateChances(groups[i], result[i].chances)
  }
  const finalResult: Message = {
    type: 'final-result',
    result
  }
  postMessage(finalResult, undefined as any)
  isCalculating = false
}

function getRelativeTime(value: number) {
  const seconds = Math.round(Math.abs(value) / 1000.0)
  if (seconds < 45) {
    return 'in a few seconds'
  }

  const minutes = Math.round(seconds / 60)
  if (minutes <= 1) {
    return 'in 1 minute'
  }
  if (minutes < 60) {
    return `in ${minutes} minutes`
  }

  const hours = Math.round(minutes / 60)
  if (hours <= 1) {
    return 'in 1 hour'
  }
  if (hours < 24) {
    return `in ${hours} hours`
  }

  const days = Math.round(hours / 24)
  if (days <= 1) {
    return 'in 1 day'
  }
  if (days < 30) {
    return `in ${days} days`
  }

  const months = Math.round(days / 30)
  if (months <= 1) {
    return 'in 1 month'
  }
  if (months < 12) {
    return `in ${months} months`
  }

  const years = Math.round(days / 365)
  if (years <= 1) {
    return 'in 1 year'
  }
  return `in ${years} years`
}

interface Chance {
  name: string;
  chances: number[];
  score: number;
  matchCountLeft: number;
}

export interface GroupChance {
  tops: number[];
  chances: Chance[];
}

export type Message =
  {
    type: 'initial-result';
    result: GroupChance[];
  }
  |
  {
    type: 'final-result';
    result: GroupChance[];
  }
  |
  {
    type: 'progress';
    progress: string;
  }
