/**
 * @entry groups-schema.json
 * @uniqueItems
 * @minItems 1
 */
export type Groups = Group[]

export interface Group {
  /**
   * @uniqueItems
   * @minItems 1
   */
  matches: Match[];
  teams: Teams;
  /**
   * @itemMinimum 1
   * @uniqueItems
   * @minItems 1
   */
  tops: integer[];
}

type integer = number

interface Match {
  a: string;
  b: string;
  /**
   * @uniqueItems
   * @minItems 1
   */
  possibilities: {
    a: integer;
    b: integer;
  }[];
}

/**
 * @uniqueItems
 * @minItems 1
 */
type Teams = string[]

type MatchPossibility = {
  teams: Teams
  /**
   * @uniqueItems
   * @minItems 1
   */
   possibilities: {
    a: integer;
    b: integer;
  }[];
}

/**
 * @entry match-possibility-schema.json
 * @uniqueItems
 * @minItems 1
 */
export type MatchPossibilities = MatchPossibility[]
