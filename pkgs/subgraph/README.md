# Toban Subgraph

This Subgraph sources events from the Toban related contract in different networks.

## Deploying the subgraph:

**First time only**

```ssh
yarn install
```

**deployment**

First run:

```ssh
goldsky login
```

If you already have an existing subgraph you will have to delete it to deploy the new one

**Deploy**

```ssh
yarn prepare:<network>
yarn codegen
yarn build
yarn deploy:<network>
```
