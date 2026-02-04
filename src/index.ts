import assert from "node:assert";

import * as core from "@actions/core";
import * as github from "@actions/github";
import axios, { isAxiosError } from "axios";

import { getExtraData, getIssuesData, updateIssueLabels } from "./fetch";
import { findPassingRule, parseRules } from "./rules";
import { notNullable, payloadIsAsExpected } from "./typeguards";
import { getRepoName } from "./utils";

async function validateSubscription(): Promise<void> {
  const API_URL = `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/subscription`;

  try {
    await axios.get(API_URL, { timeout: 3000 });
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      core.error(
        "Subscription is not valid. Reach out to support@stepsecurity.io"
      );
      process.exit(1);
    } else {
      core.info("Timeout or API not reachable. Continuing to next step.");
    }
  }
}

const ghToken = core.getInput("token");
const rawRules = core.getInput("rules");

await main().catch((error) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});

/**
 * The main function.
 */
async function main() {
  await validateSubscription();

  if (process.env.NODE_ENV === "test") {
    console.log("it works");
    return;
  }

  const octokit = github.getOctokit(ghToken);
  const {
    context: { payload },
  } = github;

  core.debug("Loaded payload");
  // core.debug(`The event payload: ${JSON.stringify(payload, undefined, 2)}`);

  const rules = parseRules(rawRules);
  core.debug("Rules parsed successfully.");
  // core.debug(`Parsed rules: ${JSON.stringify(rules, undefined, 2)}`);

  if (!payloadIsAsExpected(payload)) {
    console.log("Nothing to do - payload not as expected.");
    return;
  }
  core.debug("Payload is as expected.");

  const repoName = getRepoName(payload);
  core.debug(`Repo Name: ${repoName.owner}/${repoName.name}`);

  const {
    pullRequest: {
      closingIssuesReferences: { nodes: closingIssuesReferencesNodes },
    },
    labels: allLabels,
  } = await getExtraData(repoName, octokit, payload);
  core.debug("Successfully fetched extra data.");

  const closingIssues = closingIssuesReferencesNodes.map((node) => node.number);

  const closingIssuesDebugString = closingIssues
    .map((number) => `#${number}`)
    .join(", ");
  core.debug(`PR's closing issues: ${closingIssuesDebugString}`);

  if (closingIssues.length === 0) {
    console.log("Nothing to do - no closing issues.");
    return;
  }

  const issuesData = await getIssuesData(
    repoName,
    octokit,
    payload,
    closingIssues
  );
  core.debug("Successfully fetched closing issues data.");

  const allLabelsByName = new Map(
    allLabels.map((label) => [label.name, label])
  );

  const getLabelId = (name: string) => {
    assert(allLabelsByName.has(name), `No label found with name "${name}".`);
    return allLabelsByName.get(name)!.id;
  };

  const mergedAt = new Date(payload.pull_request.merged_at);

  const prLabels = new Set(
    payload.pull_request.labels.map((label) => label.name)
  );

  const issueLabelChanges = new Map(
    issuesData
      .map((issue): [string, [string[], string[]]] | null => {
        if (issue.closed !== true) {
          console.log(`Skipping issue #${issue.number} - not closed.`);
          return null;
        }
        assert(issue.closedAt instanceof Date);

        const closingTimeDiff = Math.abs(
          mergedAt.getTime() - issue.closedAt.getTime()
        );
        core.debug(`Close/merge time difference: ${closingTimeDiff}s.`);

        if (closingTimeDiff > 0) {
          console.log(
            `Skipping issue #${issue.number} - Issue wasn't closed at the same time as the PR, assuming PR didn't close issue.`
          );
          return null;
        }

        const issueLabels = new Set(
          [...issue.labels.values()].map((label) => label.name)
        );

        const rule = findPassingRule(rules, prLabels, issueLabels);

        if (rule === undefined) {
          console.log(
            `Skipping issue #${issue.number} - no matching rule found - nothing to do.`
          );
          return null;
        }

        const toAdd = (rule.add ?? [])
          .filter((label) => !issueLabels.has(label))
          .map(getLabelId);
        core.debug(`Label ids to add: ${JSON.stringify(toAdd)}`);

        const toRemove = (rule.remove ?? [])
          .filter((label) => issueLabels.has(label))
          .map(getLabelId);
        core.debug(`Label ids to remove: ${JSON.stringify(toRemove)}`);

        if (toAdd.length === 0 && toRemove.length === 0) {
          console.log(
            `Skipping issue #${issue.number} - no labels to add or remove.`
          );
          return null;
        }

        return [issue.id, [toAdd, toRemove]];
      })
      .filter(notNullable)
  );

  if (issueLabelChanges.size === 0) {
    console.log("Nothing to do - no rules matched.");
    return;
  }

  core.debug("Updating labels.");
  await updateIssueLabels(octokit, issueLabelChanges);
}
