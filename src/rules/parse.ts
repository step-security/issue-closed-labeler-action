import assert from "node:assert";

import * as core from "@actions/core";

import type {
  LabelName,
  RulesOptionCondition,
  RulesOptionConditionComplex,
  RulesOptionConditionComplexFull,
  RulesOptionConditionSemiSimple,
  RulesOptionConditionSimple,
  RulesOptionLabelOn,
  RulesOptionListOperation,
  RulesOptionRule,
} from "@/types";

import { rawLabelOnTypes } from "./input";
import { assertRulesOptionIsValid } from "./typeguard";
import type { Condition, ConditionHas, Rule, Rules } from "./types";
import {
  LabelOnType,
  ExpressionOperation,
  ListOperation,
  ExpressionBracket,
} from "./types";

/**
 * Parse the raw rules settings the user passed in.
 */
export function parseRules(rawRulesJson: string): Rules {
  const rawRules = parseRawRulesJson(rawRulesJson);
  core.debug(`Raw rules: ${JSON.stringify(rawRules, undefined, 2)}`);

  assertRulesOptionIsValid(rawRules);
  core.debug(
    "Raw rules appear to be valid - attempting to parse as rich rules."
  );

  const rawRulesArray = (
    Array.isArray(rawRules) ? rawRules : [rawRules]
  ) as ReadonlyArray<RulesOptionRule>;

  return rawRulesArray.map((rawRule): Rule => {
    const condition = parseRawCondition(rawRule.condition);

    const add =
      rawRule.add === undefined
        ? []
        : Array.isArray(rawRule.add)
        ? rawRule.add
        : [rawRule.add];

    const remove =
      rawRule.remove === undefined
        ? []
        : Array.isArray(rawRule.remove)
        ? rawRule.remove
        : [rawRule.remove];

    return {
      condition,
      add,
      remove,
    };
  });
}

/**
 * Parse the json the user passed in for `rules`.
 */
function parseRawRulesJson(rawRulesJson: string): unknown {
  try {
    return JSON.parse(rawRulesJson);
  } catch {
    throw new Error("Failed to parse `rules` - invalid JSON.");
  }
}

/**
 * Parse the conditions of the raw rules settings the user passed in.
 */
function parseRawCondition(rawCondition: RulesOptionCondition): Condition {
  if (isRawConditionSimple(rawCondition)) {
    core.debug("Parsing simple condition.");
    return [
      [getLabelOnType(undefined), getListOperation(undefined), [rawCondition]],
    ];
  }

  if (isRawConditionSemiSimple(rawCondition)) {
    core.debug("Parsing simi-simple condition.");
    return [
      [
        getLabelOnType(rawCondition[0]),
        getListOperation(undefined),
        [rawCondition[1]],
      ],
    ];
  }

  if (!isRawConditionComplexFull(rawCondition)) {
    core.debug("Parsing complex condition.");
    return [parseRawConditionComplexPart(rawCondition)];
  }

  core.debug("Parsing full complex condition.");
  return rawCondition.map((rawConditionPart, index) => {
    if (index % 2 === 1) {
      core.debug("Parsing expression operation.");

      assert(typeof rawConditionPart === "string");
      return getExpressionOperation(rawConditionPart);
    }

    core.debug("Parsing logic.");
    assert(typeof rawConditionPart !== "string");
    return parseRawConditionComplexPart(rawConditionPart);
  }) as unknown as Condition;
}

/**
 * Parse a complex condition of the raw rules settings the user passed in.
 */
function parseRawConditionComplexPart(
  rawConditionPart: RulesOptionConditionComplex
): ConditionHas {
  assert(
    Array.isArray(rawConditionPart),
    `Expecting an array, got: "${String(rawConditionPart)}"`
  );

  type RawConditionPartFull = readonly [
    RulesOptionLabelOn | undefined,
    RulesOptionListOperation,
    LabelName | LabelName[]
  ];

  const [labelOnType, listOperation, labels] =
    rawConditionPart.length === 2
      ? [
          undefined,
          ...(rawConditionPart as [
            RawConditionPartFull[1],
            RawConditionPartFull[2]
          ]),
        ]
      : (rawConditionPart as RawConditionPartFull);

  const labelList = Array.isArray(labels) ? labels : [labels];

  return [
    getLabelOnType(labelOnType),
    getListOperation(listOperation),
    labelList,
  ];
}

/**
 * Get the type of thing that must have the labels from a raw user input.
 */
function getLabelOnType(raw: string | undefined): LabelOnType {
  switch (raw) {
    case "issue":
    case undefined:
      return LabelOnType.ISSUE;

    case "pull request":
    case "pr":
      return LabelOnType.PULL_REQUEST;

    default:
      throw new Error(`Invalid type "${raw}".`);
  }
}

/**
 * Get the expression operator from a raw user input.
 */
function getExpressionOperation(
  raw: string | undefined
): ExpressionOperation | ExpressionBracket {
  switch (raw) {
    case "(":
      return ExpressionBracket.OPEN;

    case ")":
      return ExpressionBracket.CLOSE;

    case "and":
    case "&&":
    case undefined:
      return ExpressionOperation.AND;

    case "or":
    case "||":
      return ExpressionOperation.OR;

    default:
      throw new Error(`Invalid expression operation "${raw}".`);
  }
}

/**
 * Get the list operator from a raw user input.
 */
function getListOperation(raw: string | undefined): ListOperation {
  switch (raw) {
    case "none":
    case "not":
      return ListOperation.NONE;

    case "some":
      return ListOperation.SOME;

    case "and":
    case "&&":
    case undefined:
      return ListOperation.ALL;

    default:
      throw new Error(`Invalid list operation "${raw}".`);
  }
}

function isRawConditionSimple(
  condition: RulesOptionCondition
): condition is RulesOptionConditionSimple {
  return typeof condition === "string";
}

function isRawConditionSemiSimple(
  condition: RulesOptionCondition
): condition is RulesOptionConditionSemiSimple {
  return condition.length === 2 && rawLabelOnTypes.has(condition[0]);
}

function isRawConditionComplexFull(
  condition: RulesOptionCondition
): condition is RulesOptionConditionComplexFull {
  return Array.isArray(condition[0]);
}
