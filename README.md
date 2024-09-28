# toban

![](./docs/img/header.png)

## About This Project

Toban is a simplest way to record contribution and distribute rewards.

Projects that involve a diverse people, such as open source development, collaborative works by multiple creators, and volunteer activities, and in which the people involved change one after another, can be very exciting, but they also have their own unique difficulties.

For example

- Annoying to Track Works:
  - It's very tedious to report what you've accomplished for each task
  - Nobody are running a community to measure contributions by weighting each task.
  - We always forget anyway lol
- Rewards are required for Long term Contribution
  - There is no long-term contribution, just a volunteer spirit
  - There is no money to give out of the blue, and no one starts because of money.
  - Someone needs to do the housework and chores
- Ladder for Onboarding to the Community
  - Few people can participate on their own
  - It is difficult to understand the community enough to actually be able to do something
  - It's important to have a starting point that makes it easy to contribute something

Therefore, we created Role Based Rewards Distribution system to track contributions and distribute rewards by role.

Core features are

1. Manage responsibilities and rights on rolls
2. Track little contributions with P2P token transfer
3. Determine the rewards rate based on roll and engaged period
4. Distribute rewards quickly to a large number of people

These solutions were combined with ideas from [Hats Protocol](https://www.hatsprotocol.xyz/), [Splits](https://splits.org), and [Protocol Guild](https://protocol-guild.readthedocs.io/en/latest/).

## Slide

## Demo Video

[here - Youtube](https://www.youtube.com/watch?v=jFjxNSHiCBI)

## Related Contract Addresses

### Holesky

| ContractAddress                            | Name              | Memo |
| ------------------------------------------ | ----------------- | ---- |
| 0x3bc1A0Ad72417f2d411118085256fC53CBdDd137 | Hats              |      |
|                                            | HatsModuleFactory |      |
|                                            | PullSplitsFactory |      |

## How to work

- ### **setUp**

  - #### **frontend**

    You must set some ENVs

    1. create `pkgs/frontend/.env.local`

    2. set below values

       ```txt

       ```

  - #### **smartconract**

    You must set some ENVs

    1. create `pkgs/contact/.env`

    2. set below values

       ```txt
       PRIVATE_KEY=""
       ETHERSCAN_API_KEY=""
       ALCHEMY_API_KEY=""
       GAS_REPORT=
       COINMARKETCAP_API_KEY=""
       ```

  - #### **install**

    ```bash
    yarn
    ```

- ### frontend

  - #### **build frontend**

    ```bash
    yarn frontend build
    ```

  - #### **start frontend**

    ```bash
    yarn frontend dev
    ```

- ### contract

  - #### **compile**

    ```bash
    yarn contract compile
    ```

  - #### **test**

    ```bash
    yarn contract test
    ```

  - #### **coverage**

    ```bash
    yarn contract coverage
    ```

  - #### **clean**

    ```bash
    yarn contract clean
    ```

  - #### **get Balance of address**

    ```bash
    yarn contract getBalance --network sepolia
    ```

  - #### **get chaininfo**

    ```bash
    yarn contract getChainInfo --network sepolia
    ```

  - #### **deploy Sample Contract**

    ```bash
    yarn contract deploy:Lock --network sepolia
    ```

  - #### **verify deployed contract**

    ```bash
    yarn contract deploy:Lock --verify --network sepolia
    ```

  - #### **get deployed contract address**

    ```bash
    yarn contract getContractAddress --contract Lock --network sepolia
    ```

  - #### **resiger new subdomain to `toban.eth`**

    ```bash
    yarn contract registerSubdomain --label <your label> --network sepolia
    ```
