import test from "ava";

import { ExpressionOperation, ExpressionBracket } from "@/rules/types";
import { toPostfix } from "@/utils";

test("A & B", (t) => {
  const input = ["A", ExpressionOperation.AND, "B"];
  const expected = ["A", "B", ExpressionOperation.AND];

  const actual = toPostfix(input);

  t.deepEqual(actual, expected);
});

test("A & B & C", (t) => {
  const input = [
    "A",
    ExpressionOperation.AND,
    "B",
    ExpressionOperation.AND,
    "C",
  ];
  const expected = [
    "A",
    "B",
    ExpressionOperation.AND,
    "C",
    ExpressionOperation.AND,
  ];

  const actual = toPostfix(input);

  t.deepEqual(actual, expected);
});

test("A & B | C", (t) => {
  const input = [
    "A",
    ExpressionOperation.AND,
    "B",
    ExpressionOperation.OR,
    "C",
  ];
  const expected = [
    "A",
    "B",
    ExpressionOperation.AND,
    "C",
    ExpressionOperation.OR,
  ];

  const actual = toPostfix(input);

  t.deepEqual(actual, expected);
});

test("A | B & C", (t) => {
  const input = [
    "A",
    ExpressionOperation.OR,
    "B",
    ExpressionOperation.AND,
    "C",
  ];
  const expected = [
    "A",
    "B",
    "C",
    ExpressionOperation.AND,
    ExpressionOperation.OR,
  ];

  const actual = toPostfix(input);

  t.deepEqual(actual, expected);
});

test("(A | B) & C", (t) => {
  const input = [
    ExpressionBracket.OPEN,
    "A",
    ExpressionOperation.OR,
    "B",
    ExpressionBracket.CLOSE,
    ExpressionOperation.AND,
    "C",
  ];
  const expected = [
    "A",
    "B",
    ExpressionOperation.OR,
    "C",
    ExpressionOperation.AND,
  ];

  const actual = toPostfix(input);

  t.deepEqual(actual, expected);
});
