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

### Sepolia

| Name               | Address                                    | Memo               |
| ------------------ | ------------------------------------------ | ------------------ |
| SplitCreator       | 0x8B262b2e81c2087c030cCCDe17F94C87a40bE75D |                    |
| FractionToken      | 0xF03Cdf44e48621BA8F03A6a883137249Cbb4D544 |                    |
| TimeFrameHatModule | 0xe3946ec13631B04CF9AB3630d1c7165AC719de13 |                    |
| Forwarder          | 0xbE914D66aF1D6B7C46e1dfB641E4adCb6205cFc2 |                    |
| Splits Factory     | 0x80f1B766817D04870f115fEBbcCADF8DBF75E017 | From Splits        |
| Hats               | 0x3bc1A0Ad72417f2d411118085256fC53CBdDd137 | From Hats Protocol |
| NameWrapper        | 0x0635513f179D50A207757E05759CbD106d7dFcE8 | From ENS           |

## How to work

- **setUp**

  - **frontend**

    You must set some ENVs

    1. create `pkgs/frontend/.env.local`

    2. set below values

       ```txt

       ```

  - **smartconract**

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

- **get Balance of address**

  ```bash
  yarn contract getBalance --network sepolia
  ```

- **get chaininfo**

  ```bash
  yarn contract getChainInfo --network sepolia
  ```

- **deploy Sample Contract**

  ```bash
  yarn contract deploy:Lock --network sepolia
  ```
