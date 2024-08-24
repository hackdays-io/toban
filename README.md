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
       NEXT_PUBLIC_PINATA_JWT=
       NEXT_PUBLIC_SPLITS_API_KEY=
       NEXT_PUBLIC_PINATA_GATEWAY=
       NEXT_PUBLIC_CABINET_ACCESS_TOKEN=
       ```

  - **smartconract**

        You must set some ENVs

        1. create `pkgs/contact/.env`

        2. set below values

           ```txt
           PRIVATE_KEY=
           ETHERSCAN_API_KEY=
           CABINET_ACCESS_TOKEN=
           DEFENDER_API_KEY=
           DEFENDER_SECRET_KEY=
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
  yarn contract setSubnodeRecord --parent 0x97cd6f9ae139c32c43a0343366f02acaf191af1d32ff86da66b9a672d120944c --label test11 --owner 0xd51b4abd15ff578d61047235D8D42bc030D19682 --resolver 0x8FADE66B79cC9f707aB26799354482EB93a5B7dD --network sepolia
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

- **setAddr from Resolver Contract**

  ```bash
  yarn contract setAddr --hash 0xc8082b5c79fbbd2fc869eac7c1da00eb53f37e6b2e4fd056bb675f0aed653333 --addr 0x06eDd105B205Eae5d6A2D319c2605F4C632073E4 --network sepolia
  ```
