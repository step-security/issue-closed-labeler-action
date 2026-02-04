import { ExpressionBracket, ExpressionOperation } from "./rules/types";
import type { ExpectedPayload, RepoName } from "./types";

export function getRepoName(payload: ExpectedPayload): RepoName {
  const [owner, name] = payload.repository.full_name.split("/");
  return { owner, name };
}

export function toPostfix<T>(
  infix: ReadonlyArray<T | ExpressionOperation | ExpressionBracket>
) {
  const postfix: Array<T | ExpressionOperation | ExpressionBracket> = [];
  const infixStack: Array<T | ExpressionOperation | ExpressionBracket> = [];

  for (const element of infix) {
    if (
      infixStack.length === 0 ||
      infixStack.at(-1)! === ExpressionBracket.OPEN
    ) {
      infixStack.push(element);
      continue;
    }

    if (element === ExpressionBracket.OPEN) {
      infixStack.push(element);
      continue;
    }

    if (element === ExpressionBracket.CLOSE) {
      while (infixStack.length > 0) {
        const op = infixStack.pop()!;
        if (op === ExpressionBracket.OPEN) {
          break;
        }
        postfix.push(op);
      }
      continue;
    }

    while (
      infixStack.length > 0 &&
      getPrecedence(element) >= getPrecedence(infixStack.at(-1)!)
    ) {
      const op = infixStack.pop()!;
      if (op === ExpressionBracket.OPEN) {
        break;
      }
      postfix.push(op);
    }
    infixStack.push(element);
  }

  while (infixStack.length > 0) {
    const op = infixStack.pop()!;
    if (op === ExpressionBracket.OPEN) {
      break;
    }
    postfix.push(op);
  }

  return postfix as Array<T | ExpressionOperation>;
}

function getPrecedence<T>(
  operator: T | ExpressionOperation | ExpressionBracket
): number {
  switch (operator) {
    case ExpressionBracket.OPEN:
    case ExpressionBracket.CLOSE:
      return 1;
    case ExpressionOperation.AND:
      return 2;
    case ExpressionOperation.OR:
      return 3;
    default:
      return 0;
  }
}
