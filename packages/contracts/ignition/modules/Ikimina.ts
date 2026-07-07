import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("EkiminaModule", (m) => {
  const tokenAddress = m.getParameter("tokenAddress", "");

  const usdm = tokenAddress ? m.contractAt("MockUSDm", tokenAddress) : m.contract("MockUSDm", []);

  const factory = m.contract("IkiminaFactory", [usdm], {
    after: [usdm],
  });

  return { usdm, factory };
});
