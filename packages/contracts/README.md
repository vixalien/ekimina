# E-Kimina

https://celo-sepolia.blockscout.com/address/0x59aEd91402B3273F2A32825c15090373C924D61F?tab=contract

pn deploy -- --sender 0x618894f637880bc9c272b6f9703722e105b8284c --account myKey
$ forge script script/DeployCelo.s.sol --broadcast --rpc-url celoSepolia --sender 0x618894f637880bc9c272b6f9703722e105b8284c --account myKey
[⠊] Compiling...
No files changed, compilation skipped
Script ran successfully.

== Logs ==
MockUSDm deployed to: 0x5ED67148a985ecC7a13f517EEB0BD2Dd7E59BDaf
IkiminaFactory deployed to: 0x59aEd91402B3273F2A32825c15090373C924D61F

## Setting up 1 EVM.

==========================

Chain 11142220

Estimated gas price: 100.000000001 gwei

Estimated total gas used for script: 5286672

Estimated amount required: 0.528667200005286672 CELO

==========================
Enter keystore password:

##### celo-sepolia

✅ [Success] Hash: 0xe20fbe87dfcca1840dff4c0c1e908adb8183253a30a7ed2b48cb99b8799588ed
Contract: IkiminaFactory
Contract Address: 0x59aEd91402B3273F2A32825c15090373C924D61F
Block: 30398895
Paid: 0.1768450000035369 CELO (3536900 gas * 50.000000001 gwei)

##### celo-sepolia

✅ [Success] Hash: 0x50095033f97f6e1d3df4b96f90b37dcd906c1fc1a5aad66611bcb8973e7c7fe9
Contract: MockUSDm
Contract Address: 0x5ED67148a985ecC7a13f517EEB0BD2Dd7E59BDaf
Block: 30398895
Paid: 0.026488550000529771 CELO (529771 gas * 50.000000001 gwei)

✅ Sequence #1 on celo-sepolia | Total Paid: 0.203333550004066671 CELO (4066671 gas * avg 50.000000001 gwei)

==========================

ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.

Transactions saved to: /home/alien/sites/alu/capstone/packages/contracts/broadcast/DeployCelo.s.sol/11142220/run-latest.json

Sensitive values saved to: /home/alien/sites/alu/capstone/packages/contracts/cache/DeployCelo.s.sol/11142220/run-latest.json
