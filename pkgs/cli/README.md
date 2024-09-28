# Toban CLI Tool

## setUp

以下のコマンドをルートディレクトリから実行します。

- **install**

  ```bash
  yarn
  ```

- **build**

  ```bash
  yarn cli build
  ```

- **global link**

  ```bash
  yarn cli link
  ```

## How to use

プロジェクトのルートディレクトリからは以下の方法で呼び出せます。

```bash
yarn cli toban function --help
```

```bash
This is a CLI tool for toban project

Options:
  -V, --version        output the version number
  -h, --help           display help for command

Commands:
  list                 List all shifts
  add <date> <person>  Add a new shift
  random               Pick a random person for the shift
  show [options]       Show the arguments
  help [command]       display help for command
✨  Done in 0.66s.
```

例えば `show` コマンドを呼ぶ場合

```bash
yarn cli toban function show -t test
```

ツリー ID を指定してそれに紐づく hats 一覧を取得する。

```bash
yarn cli toban hats list --treeId 163
```
