# Toban CLI Tool

## setUp

```bash
yarn
```

## How to use

プロジェクトのルートディレクトリからは以下の方法で呼び出せます。

```bash
yarn cli toban toban --help
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
yarn cli toban toban show -t test
```
