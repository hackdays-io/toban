# Deploy on local

### 1. Up hardhat local node

```
$ pwd
~/toban/pkgs/contract
$ npx hardhat node
```

### 2. Deploy on local node

```
$ npx hardhat run scripts/deploy/local.ts --network localhost
```

# Create Top level hat

ローカルで ether.js のコントラクトインスタンスで top hat を作ろうと失敗することがあるので、sendTransaction で直接作るスクリプトを用意しています。

```
$ pwd
~/toban/pkgs/contract
$ npx hardhat run scripts/helper/mintTopHat.ts --network localhost
```
