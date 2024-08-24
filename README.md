# toban

## About This Project

## Slide

## Demo Video

## How to work

- **setUp**

  - **frontend**

    You must set some ENVs

    1. create `pkgs/frontend/.env.local`

    2. set below values

       ```txt
       NEXT_PUBLIC_ENABLE_TESTNETS=true
       NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
       NEXT_PUBLIC_ALCHEMY_ID=
       NEXT_PUBLIC_DEFENDER_API_KEY=
       NEXT_PUBLIC_DEFENDER_SECRET_KEY=
       ```

  - **smartconract**

    You must set some ENVs

    1. create `pkgs/contact/.env`

    2. set below values

       ```txt
       PRIVATE_KEY=
       ETHERSCAN_API_KEY=
       CABINET_ACCESS_TOKEN=
       ```

- **install**

  ```bash
  yarn
  ```

- **build frontend**

  ```bash
  yarn frontend build
  ```

- **start frontend**

  ```bash
  yarn frontend dev
  ```

- **setup contract**

  ```bash
  yarn contract setup --network sepolia
  ```

- **get Balance of .env address**

  ```bash
  yarn contract getBalance --network sepolia
  ```

- **generate subdomain on ENS**

  label の部分が subdomain の名前になる。

  ```bash
  yarn contract setSubnodeRecord --parent 0x8f16dcf0ba3c4c5b2bb9786c84c45925294ff9e18b65e97dda3521708b071a33 --label test3 --owner 0x51908F598A5e0d8F1A3bAbFa6DF76F9704daD072 --resolver 0x8FADE66B79cC9f707aB26799354482EB93a5B7dD --network sepolia
  ```

- **getAllTokenIds from FractionalToken**

  ```bash
  yarn contract getAllTokenIds --network sepolia
  ```

- **deploy SampleForwarder Contract**

  ```bash
  yarn contract deploy:SampleForwarder --network sepolia
  ```

- **deploy FractionToken Contract**

  ```bash
  yarn contract deploy:FractionToken --network sepolia
  ```

- **deploy SampleCreateSubDomain Contract**

  ```bash
  yarn contract deploy:mock:SampleCreateSubDomain --network sepolia
  ```

- **generate subdomain on ENS from Contract**

  ```bash
  yarn contract setSubnodeRecordFromContract --label test --network sepolia
  ```
