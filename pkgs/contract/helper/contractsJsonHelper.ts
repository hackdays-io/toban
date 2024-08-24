import fs from "fs";
import jsonfile from "jsonfile";

const BASE_PATH = "outputs";
const BASE_NAME = "contracts";
const EXTENSTION = "json";

const getFilePath = ({
  network,
  basePath,
  suffix,
}: {
  network: string;
  basePath?: string;
  suffix?: string;
}): string => {
  const _basePath = basePath ? basePath : BASE_PATH;
  const commonFilePath = `${_basePath}/${BASE_NAME}-${network}`;
  return suffix
    ? `${commonFilePath}-${suffix}.${EXTENSTION}`
    : `${commonFilePath}.${EXTENSTION}`;
};

const resetContractAddressesJson = ({network}: {network: string}): void => {
  const fileName = getFilePath({network: network});
  if (fs.existsSync(fileName)) {
    const folderName = "tmp";
    fs.mkdirSync(folderName, {recursive: true});
    // get current datetime in this timezone
    const date = new Date();
    date.setTime(date.getTime() + 9 * 60 * 60 * 1000);
    const strDate = date
      .toISOString()
      .replace(/(-|T|:)/g, "")
      .substring(0, 14);
    // rename current file
    fs.renameSync(
      fileName,
      getFilePath({
        network: network,
        basePath: `./tmp`,
        suffix: strDate,
      })
    );
  }
  fs.writeFileSync(fileName, JSON.stringify({}, null, 2));
};

const loadDeployedContractAddresses = (network: string) => {
  const filePath = getFilePath({network: network});
  return jsonfile.readFileSync(filePath);
};

const _updateJson = ({
  group,
  name,
  value,
  obj,
}: {
  group: string;
  name: string | null;
  value: any;
  obj: any;
}) => {
  if (obj[group] === undefined) obj[group] = {};
  if (name === null) {
    obj[group] = value;
  } else {
    if (obj[group][name] === undefined) obj[group][name] = {};
    obj[group][name] = value;
  }
};

const writeContractAddress = ({
  group,
  name,
  value,
  network,
}: {
  group: string;
  name: string | null;
  value: string;
  network: string;
}) => {
  try {
    const filePath = getFilePath({network: network});
    const base = jsonfile.readFileSync(filePath);
    _updateJson({
      group: group,
      name: name,
      value: value,
      obj: base,
    });
    const output = JSON.stringify(base, null, 2);
    fs.writeFileSync(filePath, output);
  } catch (e) {
    console.log(e);
  }
};

const writeValueToGroup = ({
  group,
  value,
  fileName,
}: {
  group: string;
  value: any;
  fileName: string;
}) => {
  try {
    const base = jsonfile.readFileSync(fileName);
    _updateJson({group: group, name: null, value: value, obj: base});
    const output = JSON.stringify(base, null, 2);
    fs.writeFileSync(fileName, output);
  } catch (e) {
    console.log(e);
  }
};

export {
  getFilePath,
  loadDeployedContractAddresses,
  resetContractAddressesJson,
  writeContractAddress,
  writeValueToGroup,
};
