import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
const pinataPath = path.join(__dirname, "pinata.json");

export interface Pinata {
  jwt: string;
}

export const getJwt = () => {
  if (!existsSync(pinataPath)) {
    writeFileSync(pinataPath, JSON.stringify({ jwt: "" }));
  }

  const data = readFileSync(pinataPath, "utf8");
  return JSON.parse(data) as Pinata;
};

export const setJwt = (jwt: string) => {
  writeFileSync(pinataPath, JSON.stringify({ jwt: jwt }));
};
