# zeneth-js

## Introduction

Definitions:

- [MEV-Geth](https://github.com/flashbots/mev-geth): Modified fork of Geth to support Flashbots
- [MEV-Relay](https://github.com/flashbots/mev-relay-js): A transaction bundle relayer
- [Searchers](https://github.com/flashbots/pm/blob/main/guides/searcher-onboarding.md): Users that send bundles to MEV-Relay

## Setup

Instead of API keys, Flashbots requires all bundles are signed with a private key used to track a searcher's reputation. (This may be used in the future to provide [priority access](https://github.com/flashbots/pm/discussions/29) to users with high reputation). So first you must copy the `.env.example` file in the root, rename it to `.env`, and define your `AUTH_PRIVATE_KEY`. This private key ideally should be generated just for this use case, and should not hold any funds. It should be a different key than the one your bot will use to send Flashbots bundles.
