#!/usr/bin/env node

import sade from "sade";
import { execa } from "execa";
import { isLerna, isPnpmWorkspace, tool } from "./npm";
import { exists, getFile } from "./utils";

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

      const pkg = getFile("./package.json") as { version?: string };
      let version = pkg.version;
      if (!version)
        version = (await execa`git describe --abbrev=0 --tags`).stdout;

      // TODO: check workspace config packs (lerna, generi, nx)
      if (!version)
        throw Error(
          "wrong version for create release! Check package.json version field",
        );

      const notes = exists("./CHANGELOG.md")
        ? "--notes-file /CHANGELOG.md"
        : "--generate-notes";

      await execa`gh release create ${version} --title ${version} --verify-tag ${notes}`;
    });

  prog
    .command("deps-upgrade", "NPM-UPGRADE-DEPS", {
      alias: ["up", "ugdp"],
    })
    .example("deps-upgrade")
    .action(async () => {
      if(!exists('./package.json')) {
         throw Error(
          "package.json wrong!",
        );
      }

      if(tool === 'bun') {
        throw Error(
          "bun is ignored in this command.",
        );
      }

      await execa`npx npm-check-updates -u`
      await execa`${tool} install`
    });

  prog.parse(process.argv);
})();