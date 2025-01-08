import fs from "fs";
import path from "path";

/**
 * デプロイされたアドレス情報をjsonファイルから取得するヘルパーメソッド
 * @param chainId チェーンID
 * @param contractName  コントラクト名 <コントラクト名>Module#<コントラクト名>の形式で指定する。
 * @returns
 */
export function getContractAddress(
  chainId: string,
  contractName: string,
): string | undefined {
  try {
    // ファイルパスを構築
    const filePath = path.join(
      __dirname,
      "../../",
      "ignition",
      "deployments",
      `chain-${chainId}`,
      "deployed_addresses.json",
    );

    // JSONファイルの内容を読み込み
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // JSONをオブジェクトにパース
    const deployedAddresses = JSON.parse(fileContent);

    // 指定されたコントラクト名のアドレスを返す
    return deployedAddresses[contractName];
  } catch (error) {
    console.error("Error reading contract address:", error);
    return undefined;
  }
}
