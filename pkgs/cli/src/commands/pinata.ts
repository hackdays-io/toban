import fs from "fs";
import path from "path";
import { Command } from "commander";
import { PinataSDK } from "pinata-web3";
import { startLoading } from "../services/loading";
import { getJwt, setJwt } from "../services/pinata";

export const pinataCommands = new Command();

// ###############################################################
// CLI init setup
// ###############################################################

pinataCommands
  .name("pinata")
  .description("This is a CLI for pinata")
  .version("1.0.0");

/**
 * PinataのJWTを設定するコマンド
 */
pinataCommands
  .command("setJwt")
  .description("Set a jwt of Pinata")
  .requiredOption("--jwt <JWT>")
  .action(({ jwt }) => {
    setJwt(jwt);
  });

/**
 * Hatのメタデータをipfs上にアップロードするコマンド
 */
interface Responsibility {
  label: string;
  description?: string;
  link?: string;
}
interface Eligibility {
  manual: boolean;
  criteria: string[];
}
interface Toggle {
  manual: boolean;
  criteria: string[];
}

pinataCommands
  .command("uploadMetadata")
  .description("Upload the hat metadata on ipfs.")
  .requiredOption("-n, --name <name>", "Hat Name")
  .requiredOption("-d, --description <description>", "Hat Details")
  .option(
    "-r, --responsibilities <label>,<description>,<link>",
    "Responsibilities (may be specified multiple times to define multiple responsibilities)",
    (value, previous: Responsibility[]) => {
      const [label, description, link] = value.split(",");
      return previous
        ? previous.concat([{ label, description, link }])
        : [{ label, description, link }];
    },
    [],
  )
  .option(
    "-a, --authorities <authorities>",
    "Authority (may be specified multiple times to define multiple authorities)",
    (value, previous: string[]) =>
      previous ? previous.concat([value]) : [value],
    [],
  )
  .option(
    "-e, --eligibility <manual>,<criteria...>",
    "Eligibility (<manual> is a boolean value, <criteria... > can be specified multiple times, separated by commas, to define multiple criteria.)",
    (value) => {
      const [manual, ...criteria] = value.split(",");
      return { manual: manual === "true", criteria } satisfies Eligibility;
    },
  )
  .option(
    "-t, --toggle <manual> <criteria...>",
    "Toggle (<manual> is a boolean value, <criteria... > can be specified multiple times, separated by spaces, to define multiple criteria.)",
    (value) => {
      const [manual, ...criteria] = value.split(",");
      return { manual: manual === "true", criteria } satisfies Toggle;
    },
  )
  .action(
    async ({
      name,
      description,
      responsibilities,
      authorities,
      eligibility,
      toggle,
    }) => {
      const { jwt } = getJwt();

      const pinata = new PinataSDK({ pinataJwt: jwt });

      const upload = await pinata.upload.json({
        type: "1.0",
        data: {
          name,
          description,
          responsibilities,
          authorities: authorities,
          eligibility,
          toggle,
        },
      });

      console.log("CID:", upload.IpfsHash);
      console.log("URI:", `ipfs://${upload.IpfsHash}`);
    },
  );

/**
 * 画像をipfsにアップロードするコマンド
 */
pinataCommands
  .command("uploadImage")
  .description("Upload image on ipfs")
  .requiredOption("--imagePath <path>", "Path to image")
  .action(async ({ imagePath }) => {
    const { jwt } = getJwt();

    const stop = startLoading();

    const pinata = new PinataSDK({ pinataJwt: jwt });
    const currentDir = process.cwd();
    const absPath = path.join(currentDir, imagePath);
    const stream = fs.createReadStream(absPath);
    const upload = await pinata.upload.stream(stream, {
      metadata: { name: `TobanCLI_${new Date().getTime()}` },
    });

    stop();

    console.log("CID:", upload.IpfsHash);
    console.log("URI:", `ipfs://${upload.IpfsHash}`);
  });
