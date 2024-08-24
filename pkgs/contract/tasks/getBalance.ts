import "dotenv/config";
import {Wallet} from "ethers";
import {task} from "hardhat/config";
import {HardhatRuntimeEnvironment} from "hardhat/types";

const {PRIVATE_KEY} = process.env;

task("getBalance", "getBalance").setAction(
  async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################"
    );
    // Walletインスタンスを生成
    const wallet = new Wallet(PRIVATE_KEY!);

    // ウォレットアドレスを取得
    const address = wallet.address;
    console.log("wallet Address:", address);

    const balance = await hre.ethers.provider.getBalance(address);
    console.log("balance: ", hre.ethers.formatEther(balance));

    console.log(
      "################################### [END] ###################################"
    );
  }
);
