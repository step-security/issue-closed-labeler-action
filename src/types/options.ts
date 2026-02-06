import type { ReadonlyDeep } from "type-fest";

import type { LabelName } from "./data";
import type { Alternate } from "./utils";

export type RulesOption = RulesOptionRule | ReadonlyArray<RulesOptionRule>;

export type RulesOptionRule = ReadonlyDeep<{
  condition: RulesOptionCondition;
  add?: LabelName | LabelName[];
  remove?: LabelName | LabelName[];
}>;

export type RulesOptionLabelOn =
  | "issue"
  | "pr" // alias for "pull request".
  | "pull request";

export type RulesOptionExpressionOperation =
  | "("
  | ")"
  | "and"
  | "&&" // alias for "and".
  | "or"
  | "||"; // alias for "or".

export type RulesOptionListOperation =
  | "none"
  | "not" // alias for "none".
  | "some"
  | "all"
  | "has"; // alias for "all".

export type RulesOptionCondition =
  | RulesOptionConditionSimple
  | RulesOptionConditionSemiSimple
  | RulesOptionConditionComplex
  | RulesOptionConditionComplexFull;

export type RulesOptionConditionSimple = LabelName;

export type RulesOptionConditionSemiSimple = readonly [
  RulesOptionLabelOn,
  LabelName
];

export type RulesOptionConditionComplex = RulesOptionConditionHas;

export type RulesOptionConditionComplexFull = ReadonlyDeep<
  Alternate<RulesOptionConditionHas, RulesOptionExpressionOperation>
>;

export type RulesOptionConditionHas = ReadonlyDeep<
  | [RulesOptionLabelOn, RulesOptionListOperation, LabelName | LabelName[]]
  | [RulesOptionListOperation, LabelName | LabelName[]]
>;
