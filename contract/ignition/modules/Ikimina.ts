import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

// USDm (cUSD) address on Celo Sepolia
const CUSD_ADDRESS = "0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80";

// 0.01 USDm per contribution - small enough for our 0.37 USDm balance
const CONTRIBUTION_AMOUNT = parseEther("0.01");

// 1 day round duration for testing
const ROUND_DURATION_DAYS = 1n;

export default buildModule("IkiminaModule", (m) => {
  const ikimina = m.contract("Ikimina", [
    CUSD_ADDRESS,
    CONTRIBUTION_AMOUNT,
    ROUND_DURATION_DAYS,
  ]);

  return { ikimina };
});
