import type * as github from "@actions/github";
import type { WebhookPayload } from "@actions/github/lib/interfaces";
import type { ReadonlyDeep } from "type-fest";

export type ExpectedPayload = ReadonlyDeep<
  WebhookPayload & {
    action: "close";
    pull_request: {
      merged: true;
      merged_at: string;
      labels: Array<{
        color: string;
        default: boolean;
        description: string;
        id: number;
        name: string;
        node_id: string;
        url: string;
      }>;
    };
    repository: {
      has_issues: true;
      full_name: string;
    };
  }
>;

export type RepoName = ReadonlyDeep<{ owner: string; name: string }>;

export type Octokit = ReadonlyDeep<ReturnType<typeof github.getOctokit>>;

export type LabelName = string;
