import assert from "node:assert";

import type { LabelName } from "@/types";
import { toPostfix } from "@/utils";

import type { Rule, Rules } from "./types";
import {
  expressionOperationValues,
  LabelOnType,
  ExpressionOperation,
  ListOperation,
} from "./types";

/**
 * From the given list of rules, find the first one that passes.
 */
export function findPassingRule(
  rules: Rules,
  prLabels: Readonly<ReadonlySet<string>>,
  issueLabels: Readonly<ReadonlySet<string>>
): Rule | undefined {
  return rules.find(({ condition }) => {
    assert(condition.length > 0);

    const mutableConditionStack = toPostfix(condition);

    type Evaluated = boolean;
    type Unevaluated = Exclude<
      typeof mutableConditionStack[number],
      ExpressionOperation
    >;

    const mutableResultStack: Array<Evaluated | ExpressionOperation> = [];

    while (mutableConditionStack.length > 0) {
      // Dealing with an operation
      if (expressionOperationValues.has(mutableConditionStack.at(-1))) {
        mutableResultStack.push(
          mutableConditionStack.pop() as ExpressionOperation
        );
        continue;
      }

      // Dealing with a value nothing to do with the value. Just use it.
      if (mutableResultStack.length === 0) {
        mutableResultStack.push(
          evaluateListOperation(
            ...(mutableConditionStack.pop() as Unevaluated),
            prLabels,
            issueLabels
          )
        );
        continue;
      }

      // Dealing with a value and a value on top of results? Use merge the values.
      if (!expressionOperationValues.has(mutableResultStack.at(-1))) {
        const a = mutableResultStack.pop() as Evaluated;
        const b = evaluateListOperation(
          ...(mutableConditionStack.pop() as Unevaluated),
          prLabels,
          issueLabels
        );

        const operation = mutableResultStack.pop() as ExpressionOperation;
        assert(expressionOperationValues.has(operation));

        switch (operation) {
          case ExpressionOperation.AND:
            mutableResultStack.push(a && b);
            continue;

          case ExpressionOperation.OR:
            mutableResultStack.push(a || b);
            continue;

          default:
            throw new Error(
              `Unhandled expression operation "${String(operation)}"`
            );
        }
      }

      // Dealing with a value and an operation is on top of results? Evaluate and add.
      mutableResultStack.push(
        evaluateListOperation(
          ...(mutableConditionStack.pop() as Unevaluated),
          prLabels,
          issueLabels
        )
      );
    }

    assert(mutableResultStack.length === 1);
    const result = mutableResultStack.pop();
    assert(typeof result === "boolean");
    return result;
  });
}

function evaluateListOperation(
  onType: LabelOnType,
  listOperation: ListOperation,
  list: ReadonlyArray<string>,
  prLabels: Readonly<ReadonlySet<string>>,
  issueLabels: Readonly<ReadonlySet<string>>
): boolean {
  const predicate = (label: LabelName) =>
    onType === LabelOnType.PULL_REQUEST
      ? prLabels.has(label)
      : issueLabels.has(label);

  return listOperation === ListOperation.ALL
    ? list.every(predicate)
    : listOperation === ListOperation.SOME
    ? list.some(predicate)
    : !list.some(predicate);
}
