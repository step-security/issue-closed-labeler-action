import * as cp from "node:child_process";
import * as path from "node:path";
import * as process from "node:process";
import { fileURLToPath } from "node:url";

import test from "ava";

// shows how the runner will run a javascript action with env / stdout protocol
test("runner", (t) => {
  // process.env.INPUT_1 = value;

  const indexFile = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "dist",
    "index.js"
  );

  const options: cp.ExecFileSyncOptions = {
    env: {
      ...process.env,
      NODE_ENV: "test",
    },
  };

  const result = cp
    .execFileSync(process.execPath, [indexFile], options)
    .toString();

  t.truthy(result, "A result should be returned");
});
