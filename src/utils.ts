import destr from "destr";
import path from "pathe";
import { existsSync, readFileSync } from "fs-extra";

export const exists = (file: string, cwd = process.cwd()) =>
  existsSync(path.resolve(cwd, file));

export const getFile = (file: string, cwd = process.cwd()) =>
  destr(readFileSync(path.resolve(cwd, file), "utf8"));
