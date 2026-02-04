import assert from "node:assert";

import { assertIsLabelOrLabelList } from "@/typeguards";
import type { RulesOption, RulesOptionCondition } from "@/types";

import {
  rawExpressionOperations,
  rawLabelOnTypes,
  rawListOperations,
} from "./input";

export function assertRulesOptionIsValid(
  raw: unknown
): asserts raw is typeof raw & RulesOption {
  const isRawAnArray = Array.isArray(raw);
  const rawArray = isRawAnArray ? raw : [raw];
  for (const [index, rawRule] of rawArray.entries()) {
    try {
      assert(
        typeof rawRule === "object",
        isRawAnArray
          ? "Each rule must be an object"
          : "`rules` must be an object or an array."
      );
      assert(rawRule !== null, "A rule cannot be null.");

      assert(
        Object.hasOwn(rawRule, "condition"),
        "Condition is missing from rule."
      );
      assertRulesOptionConditionIsValid(rawRule.condition);

      const hasAdd = Object.hasOwn(rawRule, "add");
      const hasRemove = Object.hasOwn(rawRule, "remove");
      assert(
        hasAdd || hasRemove,
        "A rule must have at least one action to perform (either add or remove)."
      );

      if (hasAdd) {
        assertIsLabelOrLabelList(rawRule.add);
      }
      if (hasRemove) {
        assertIsLabelOrLabelList(rawRule.remove);
      }
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      error.message = `at index ${index}: ${error.message}`;
    }
  }
}

function assertRulesOptionConditionIsValid(
  raw: unknown
): asserts raw is typeof raw & RulesOptionCondition {
  const simple = typeof raw === "string";
  if (simple) {
    return;
  }

  assert(
    Array.isArray(raw),
    "A condition must be either a label or an array of logic."
  );
  assert(raw.length % 2 === 1, "A condtion logic array must be of odd length.");

  for (const [index, conditionPart] of raw.entries()) {
    try {
      // Has.
      if (index % 2 === 0) {
        assert(
          Array.isArray(conditionPart) &&
            (conditionPart.length === 2 || conditionPart.length === 3),
          "A condition value must be an array of length 2 or 3."
        );

        const [onType, operation, list] =
          conditionPart.length === 2
            ? [undefined, ...conditionPart]
            : conditionPart;

        assert(
          onType === undefined || rawLabelOnTypes.has(conditionPart[0]),
          `Invalid label on type ${String(conditionPart[0])}.`
        );

        assert(
          rawListOperations.has(operation),
          `Unknown list operation "${String(operation)}".`
        );
        assertIsLabelOrLabelList(list);
      }
      // Operation.
      else {
        assert(
          rawExpressionOperations.has(conditionPart),
          `Unknown expression operation "${String(conditionPart)}".`
        );
      }
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      error.message = `at index ${index}: ${error.message}`;
    }
  }
}
