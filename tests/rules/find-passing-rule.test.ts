import test from "ava";

import { findPassingRule } from "@/rules/evaluate";
import type { Rules } from "@/rules/types";
import { ExpressionOperation, LabelOnType, ListOperation } from "@/rules/types";

test("1 condition: issue has foo", (t) => {
  const rules: Rules = [
    {
      condition: [[LabelOnType.ISSUE, ListOperation.ALL, ["foo"]]],
    },
  ];
  const prLabels = new Set<string>();

  const issueWith = new Set<string>(["foo"]);
  const issueWithout = new Set<string>(["bar"]);

  const actualWith = findPassingRule(rules, prLabels, issueWith);
  const actualWithout = findPassingRule(rules, prLabels, issueWithout);

  t.is(actualWith, rules[0]);
  t.is(actualWithout, undefined);
});

test("1 condition: issue has foo & bar", (t) => {
  const rules: Rules = [
    {
      condition: [
        [LabelOnType.ISSUE, ListOperation.ALL, ["foo"]],
        ExpressionOperation.AND,
        [LabelOnType.ISSUE, ListOperation.ALL, ["bar"]],
      ],
    },
  ];
  const prLabels = new Set<string>();

  const issueWith = new Set<string>(["foo", "bar"]);
  const issueWithout = new Set<string>();

  const actualWith = findPassingRule(rules, prLabels, issueWith);
  const actualWithout = findPassingRule(rules, prLabels, issueWithout);

  t.is(actualWith, rules[0]);
  t.is(actualWithout, undefined);
});

test("1 condition: issue has foo | bar", (t) => {
  const rules: Rules = [
    {
      condition: [
        [LabelOnType.ISSUE, ListOperation.ALL, ["foo"]],
        ExpressionOperation.OR,
        [LabelOnType.ISSUE, ListOperation.ALL, ["bar"]],
      ],
    },
  ];
  const prLabels = new Set<string>();

  const issueWith = new Set<string>(["bar"]);
  const issueWithout = new Set<string>();

  const actualWith = findPassingRule(rules, prLabels, issueWith);
  const actualWithout = findPassingRule(rules, prLabels, issueWithout);

  t.is(actualWith, rules[0]);
  t.is(actualWithout, undefined);
});
