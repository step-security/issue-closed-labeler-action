import assert from "node:assert";

import type { GraphQlQueryResponseData } from "@octokit/graphql";
import type { RequestParameters } from "@octokit/types";
import type { ReadonlyDeep } from "type-fest";

import type { ExpectedPayload, RepoName, Octokit } from "./types";

const issueIdRegex = /^I_[\dA-Za-z]{16}$/gu;
const labelIdRegex = /^LA_[\dA-Za-z]{16}$/gu;

/**
 * Get all the extra data that we need that isn't already available in the payload.
 */
export async function getExtraData(
  repo: RepoName,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Can't currently be made readonly.
  octokit: Octokit,
  payload: ExpectedPayload
) {
  // TODO: Add pagination.
  // @see https://github.com/octokit/graphql.js/issues/61

  const query = `query ExtraData($owner: String!, $name: String!, $pr_number: Int!, $num: Int = 100){
  repository(owner:$owner, name:$name) {
    pullRequest(number:$pr_number) {
      merged,
      mergedAt,
      closingIssuesReferences(first: $num) {
        nodes {
          id,
          number
        }
      }
    }
    labels(first: $num) {
      nodes {
        id,
        name
      }
    }
  }
}`;

  type QueryResult = {
    repository: {
      pullRequest: {
        closingIssuesReferences: {
          nodes: Array<{ id: string; number: number }>;
        };
      };
      labels: {
        nodes: Array<{ id: string; name: string }>;
      };
    };
  };

  const {
    repository: {
      pullRequest,
      labels: { nodes: labels },
    },
  } = await runGraphqlRequest<QueryResult>(octokit, query, {
    owner: repo.owner,
    name: repo.name,
    pr_number: payload.pull_request.number,
  });

  return {
    pullRequest,
    labels,
  };
}

/**
 * Get all the data for the issues with the given numbers.
 */
export async function getIssuesData(
  repo: RepoName,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Can't currently be made readonly.
  octokit: Octokit,
  payload: ExpectedPayload,
  issueNumbers: ReadonlyArray<number>
) {
  // TODO: Add pagination.
  // @see https://github.com/octokit/graphql.js/issues/61

  const issuesFragments = issueNumbers
    .map((number) => {
      assert(typeof number === "number");
      return `issue${number}: issue(number: ${number}) {
        ...IssueFragment
      }`;
    })
    .join("");

  const query = `query IssuesData($owner: String!, $name: String!){
  repository(owner:$owner, name:$name) {
    ${issuesFragments}
  }
}

fragment IssueFragment on Issue {
  id,
  number,
  closed,
  closedAt,
  labels(first: 100) {
    nodes {
      id,
      name
    }
  }
}`;

  type QueryResult = {
    repository: Record<
      string,
      {
        id: string;
        number: number;
        closed: boolean;
        closedAt: string | null;
        labels: { nodes: Array<{ id: string; name: string }> };
      }
    >;
  };

  const { repository } = await runGraphqlRequest<QueryResult>(octokit, query, {
    owner: repo.owner,
    name: repo.name,
    pr_number: payload.pull_request.number,
  });

  return Object.values(repository).map((issue) => ({
    ...issue,
    closedAt:
      typeof issue.closedAt === "string" ? new Date(issue.closedAt) : null,
    labels: new Set(issue.labels.nodes),
  }));
}

/**
 * Update all the issues with the specified label changes.
 */
export async function updateIssueLabels(
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Can't currently be made readonly.
  octokit: Octokit,
  issueLabelChanges: Readonly<
    ReadonlyMap<string, readonly [ReadonlyArray<string>, ReadonlyArray<string>]>
  >
) {
  const issueFragments = [...issueLabelChanges.entries()]
    .map(([labelableId, [labelIdsToAdd, labelIdsToRemove]]) => {
      assert(
        typeof labelableId === "string" && issueIdRegex.test(labelableId),
        `Invalid labelableId: "${labelableId}"`
      );
      assert(
        Array.isArray(labelIdsToAdd) &&
          labelIdsToAdd.every(
            (labelId) =>
              typeof labelId === "string" && labelIdRegex.test(labelId)
          ),
        `Invalid labelIdsToAdd: "${JSON.stringify(labelIdsToAdd)}".`
      );
      assert(
        Array.isArray(labelIdsToRemove) &&
          labelIdsToRemove.every(
            (labelId) =>
              typeof labelId === "string" && labelIdRegex.test(labelId)
          ),
        `Invalid labelIdsToRemove: "${JSON.stringify(labelIdsToAdd)}".`
      );

      return `addLabelsToLabelable(input: {
  labelIds: ${JSON.stringify(labelIdsToAdd)},
  labelableId: "${labelableId}"
}) {
  clientMutationId
}
removeLabelsFromLabelable(input: {
  labelIds: ${JSON.stringify(labelIdsToRemove)},
  labelableId: "${labelableId}"
}) {
  clientMutationId
}`;
    })
    .join("");

  const command = `mutation LabelIssues {
  ${issueFragments}
}`;

  return runGraphqlRequest(octokit, command, {});
}

/**
 * Run a graphql request.
 */
function runGraphqlRequest<T extends GraphQlQueryResponseData>(
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Can't currently be made readonly.
  octokit: Octokit,
  request: string,
  parameters?: ReadonlyDeep<RequestParameters>
) {
  try {
    return octokit.graphql<T>(
      request,
      parameters as RequestParameters | undefined
    );
  } catch (error) {
    throw new Error(
      `Graphql request failed.\nRequest: ${request}\nParameters: ${JSON.stringify(
        parameters
      )}\n\nOriginal error message: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
