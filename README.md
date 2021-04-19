# Zeneth

## Development

This project is a monorepo with three packages:

- `contracts` contains the smart contracts
- `faa` stands for "Flashbots Account Abstractions" and contains the core Zeneth logic
- `frontend` is a simple frontend app for interacting with Flashbots

### Dependencies

To ensure that everyone is using the same version of nodejs on this project, [volta](https://volta.sh) is recommended!

### Develop

```sh
yarn
yarn dev
```

### Test

```sh
yarn test
```

### Serve

```sh
yarn build
yarn start
```
