#!/usr/bin/env node

import sade from "sade";
import { execa } from "execa";
import { isLerna, isPnpmWorkspace, tool } from "./npm";
import { getFile } from "./utils";

(async function () {
  const prog = sade("ut");

  prog
    .command("commit <message>", "GIT-COMMIT", {
      alias: ["cmt", "commti"],
    })
    .example('commit "feat: initial implementation"')
    .action(async (message: string) => {
      await execa`git add -A`;
      await execa`git commit -m ${message}`;
    });

  prog
    .command("push", "GIT-PUSH", {
      alias: ["ps", "ph", "puhs"],
    })
    .example("push")
    .action(async () => {
      const branch = (await execa`git branch --show-current`).stdout;
      await execa`git push origin ${branch || "main"}`;
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
    });

  prog
    .command("release", "GH-RELEASE", {
      alias: ["rel", "relesea"],
    })
    .example("release")
    .action(async () => {
      const repo = await execa`git remote -v`;

      if (!repo.stdout?.includes("https://github.com"))
        throw Error("utili release supports only github repositories");

      const pkg = getFile("./package.json") as { version: string };
      let version = pkg.version;
      if (!version)
        version = (await execa`git describe --abbrev=0 --tags`).stdout;

      // TODO: check workspace config packs (lerna, generi, nx)
      if (!version)
        throw Error(
          "wrong version for create release! Check package.json version field",
        );

      await execa`gh release create ${version} --title ${version} --verify-tag`;
    });

  prog.parse(process.argv);
})();
