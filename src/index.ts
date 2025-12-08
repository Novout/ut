#!/usr/bin/env node

import sade from "sade";
import yaml from "js-yaml";
import { execa } from "execa";
import { isLerna, isPnpmWorkspace, tool } from "./npm";
import { exists, getFile } from "./utils";
import { versionBump } from "bumpp";
import fs from "fs";
import { glob } from "tinyglobby";
import { readFileSync } from "fs-extra";
import path from "path";

(async function () {
  const prog = sade("nvt-utilidades");

  prog
    .command("commit <message>", "GIT-COMMIT", {
      alias: ["cmt", "commti"],
    })
    .example('commit "feat: initial implementation"')
    .action(async (message: string) => {
      await execa`git add -A`;
      await execa`git commit -m ${message}`;

      console.log("commit <message> success!");
    });

  prog
    .command("push", "GIT-PUSH", {
      alias: ["ps", "ph", "puhs"],
    })
    .example("push")
    .action(async () => {
      const branch = (await execa`git branch --show-current`).stdout;
      await execa`git push origin ${branch || "main"}`;

      console.log("push success!");
    });

  prog
    .command("publish", "NPM-PUBLISH", {
      alias: ["pub", "pubilsh"],
    })
    .example("publish")
    .action(async () => {
      if (isLerna) {
        await execa`lerna publish 'from-package' --yes --no-push --force-publish`;
      } else {
        isPnpmWorkspace && tool === "pnpm"
          ? await execa`pnpm -r publish --access public --no-git-checks`
          : await execa`npm publish`;
      }

      console.log("publish success!");
    });

  prog
    .command("release", "GH-RELEASE", {
      alias: ["rel", "relesea"],
    })
    .example("release")
    .action(async () => {
      try {
        await execa`gh`;
      } catch (e) {
        throw Error("install https://cli.github.com/ to use this command.");

        // TODO: auto-install
      }

      const repo = await execa`git remote -v`;

      if (!repo.stdout?.includes("https://github.com"))
        throw Error("utili release supports only github repositories");

      const pkg = getFile("./package.json") as { version?: string };
      let version = pkg.version;
      if (!version)
        version = (await execa`git describe --abbrev=0 --tags`).stdout;

      // TODO: check workspace config packs (lerna, generi, nx)
      if (!version)
        throw Error(
          "wrong version for create release! Check package.json version field",
        );

      await execa`gh release create ${version} --title ${version} --verify-tag --generate-notes`;

      console.log("release success!");
    });

  prog
    .command("deps-upgrade", "NPM-UPGRADE-DEPS", {
      alias: ["up", "ugdp"],
    })
    .example("deps-upgrade")
    .action(async () => {
      if (!exists("./package.json")) {
        throw Error("package.json wrong!");
      }

      if (tool === "bun") {
        throw Error("bun is ignored in this command.");
      }

      await execa`npx npm-check-updates -u`;
      await execa`${tool} install`;

      console.log("deps-upgrade success!");
    });

  prog
    .command("revert <hard>", "REVERT-COMMIT", {
      alias: ["rvt", "revt"],
    })
    .example("revert hard")
    .example("revert false")
    .action(async (target?: "hard" | string) => {
      await execa`git reset ${target === "hard" ? "--hard" : ""} HEAD~1`;

      console.log("revert success!");
    });

  prog
    .command("bump <tag>", "BUMP", {
      alias: ["bmp", "bumpp"],
    })
    .action(async (tag: "patch" | "minor" | "major") => {
      const getPNPMWorkspace = (): Record<"packages", string[]> | undefined => {
        const isPnpmWorkspace = exists("./pnpm-workspace.yaml");

        return isPnpmWorkspace
          ? (yaml.load(
              readFileSync(
                path.resolve(process.cwd(), "./pnpm-workspace.yaml"),
                "utf8",
              ),
            ) as Record<"packages", string[]>)
          : undefined;
      };

      const workspace = getPNPMWorkspace();
      const targets =
        workspace && workspace.packages
          ? workspace.packages
          : ["./packages/*/package.json"];

      const packages = await glob(["package.json", ...targets], {
        expandDirectories: false,
        fs,
      });

      await versionBump({
        files: packages,
        release: tag,
        commit: false,
        push: false,
        tag: false,
        confirm: false,
        noVerify: true,
        printCommits: false,
      });

      console.log("bump success!");
    });

  prog
    .command("youtube-discord", "YOUTUBE-DISCORDO", {
      alias: ["ytb", "youtube"],
    })
    .action(async () => {
      // https://github.com/twlite/ytmpx
      await execa`npx --yes ytmpx`;

      console.log("youtube success!");
    });

  prog
    .command("up", "ACTIONS-UP", {
      alias: ["act", "act-up"],
    })
    .action(async () => {
      // https://github.com/azat-io/actions-up
      await execa`npx actions-up`;

      console.log("actions-up success!");
    });

  prog.parse(process.argv);
})();
