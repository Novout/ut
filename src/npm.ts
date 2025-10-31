import { exists } from "./utils";

export const tool = exists("./pnpm-lock.yaml")
  ? "pnpm"
  : exists("./yarn.lock")
    ? "yarn"
    : exists("./bun.lock")
      ? "bun"
      : "npm";

export const isNX = exists("./nx.json");
export const isLerna = exists("./lerna.json"); // TODO: support lerna in package.json packages field
export const isMonorepoWithTool = isLerna || isNX;
export const isPnpmWorkspace = exists("./pnpm-workspace.yaml");
