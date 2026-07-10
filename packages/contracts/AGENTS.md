# Foundry project

## Project layout

```
contracts/        Solidity source files (*.sol)
contracts/test/   Solidity unit tests (*.t.sol)
script/           Forge deployment scripts (*.s.sol)
scripts/          TypeScript utility scripts
src/              Auto-generated ABI + viem wrappers for the app
out/              Forge compilation output (gitignored)
broadcast/        Forge deployment receipts (gitignored)
foundry.toml
```

## Working in this project

- `forge build` — compile contracts (outputs to `out/`)
- `forge test` — run Solidity unit tests
- `forge script script/DeployCelo.s.sol --broadcast --rpc-url celoSepolia` — deploy to Celo Sepolia
- `anvil --state .anvil-state --port 8545 --disable-code-size-limit` — local dev node with persistence
- `pnpm dev:deploy` — deploy MockUSDm + IkiminaFactory to localhost, writes `FACTORY_ADDRESS` to `local.json`
- `pnpm extract-abis` — extracts ABIs from `out/` to `src/abi/`
- `pnpm dev` — `forge build` + anvil + deploy (concurrent)

State persists in `.anvil-state` — stop and restart anvil without losing your deployed contracts.
Delete `.anvil-state` to reset the chain.

## Docs

- Foundry Book — https://book.getfoundry.sh/
- forge-std — https://book.getfoundry.sh/reference/forge-std/
- viem — https://viem.sh/llms.txt
