import assert from "node:assert";

import type { WebhookPayload } from "@actions/github/lib/interfaces";
import type { ReadonlyDeep } from "type-fest";

import type { ExpectedPayload, LabelName } from "./types";

export function payloadIsAsExpected(
  payload: ReadonlyDeep<WebhookPayload>
): payload is typeof payload & ExpectedPayload {
  assertHasRepoName(payload);

  return (
    payload.action === "closed" &&
    payload.repository.has_issues === true &&
    payload.pull_request?.merged === true &&
    typeof payload.pull_request.merged_at === "string" &&
    Array.isArray(payload.pull_request.labels)
  );
}

export function assertHasRepoName(
  payload: ReadonlyDeep<WebhookPayload>
): asserts payload is typeof payload &
  ReadonlyDeep<{ repository: { full_name: string } }> {
  const repoName = payload.repository?.full_name;
  assert(
    repoName !== undefined &&
      repoName.length > 0 &&
      repoName.split("/").length === 2,
    "Cannot determin repository's full name."
  );
}

export function assertIsLabelOrLabelList(
  raw: unknown
): asserts raw is (typeof raw & LabelName) | LabelName[] {
  const simple = typeof raw === "string";
  if (simple) {
    return;
  }

  assert(Array.isArray(raw));
  assert(raw.length > 0);
  for (const label of raw) {
    assert(typeof label === "string");
  }
}

export function notNullable<T>(
  value: T | null | undefined
): value is typeof value & NonNullable<T> {
  return value !== undefined && value !== null;
}
