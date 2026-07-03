import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("EkiminaModule", (m) => {
  const mockUsdm = m.contract("MockUSDm", []);

  const factory = m.contract("IkiminaFactory", [mockUsdm], {
    after: [mockUsdm],
  });

  return { mockUsdm, factory };
});
