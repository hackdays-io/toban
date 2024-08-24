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
