import type { ReadonlyDeep } from "type-fest";

import type { Alternate, LabelName } from "@/types";

export type Rules = ReadonlyArray<Rule>;

export type Rule = ReadonlyDeep<{
  condition: Condition;
  add?: LabelName[];
  remove?: LabelName[];
}>;

export enum LabelOnType {
  ISSUE,
  PULL_REQUEST,
}

export const labelOnTypeValues = new Set(Object.values(LabelOnType));

export enum ExpressionOperation {
  AND = "&",
  OR = "|",
}

export const expressionOperationValues = new Set(
  Object.values(ExpressionOperation)
);

export enum ExpressionBracket {
  OPEN = "(",
  CLOSE = ")",
}

export const expressionBracketValues = new Set(
  Object.values(ExpressionBracket)
);

export enum ListOperation {
  NONE,
  SOME,
  ALL,
}

export const listOperationValues = new Set(Object.values(ListOperation));

export type Condition = ReadonlyDeep<
  | Alternate<ConditionHas, ExpressionOperation>
  | [
      ExpressionBracket.OPEN,
      ...Alternate<ConditionHas, ExpressionOperation>,
      ExpressionBracket.CLOSE
    ]
>;

export type ConditionHas = ReadonlyDeep<
  [LabelOnType, ListOperation, LabelName[]]
>;
