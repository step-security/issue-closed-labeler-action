export const rawLabelOnTypes = new Set([
  "issue",
  "pull request",
  "pr", // alias for "pull request".
]);

export const rawExpressionOperations = new Set([
  "and",
  "&&", // alias for "and".
  "or",
  "||", // alias for "or".
]);

export const rawListOperations = new Set([
  "none",
  "not", // alias for "none".
  "some",
  "all",
  "has", // alias for "all".
]);
