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
       DEFENDER_API_KEY=
       DEFENDER_SECRET_KEY=
       ```

  - **smartconract**

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
