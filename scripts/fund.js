const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
  const { deployer } = getNamedAccounts();
  const fundMe = await ethers.getContract("FundMe", deployer);
  console.log("Funding Contract....");
  const txRes = await fundMe.fund({
    value: ethers.utils.parseEther("0.1"),
  });
  await txRes.wait(1);
  console.log("COntract Funded!");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
