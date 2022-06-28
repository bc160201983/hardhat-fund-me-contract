const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
  const { deployer } = getNamedAccounts();
  const fundMe = await ethers.getContract("FundMe", deployer);
  console.log("Funding....");
  const txRes = await fundMe.withdraw();
  await txRes.wait(1);
  console.log("Got money back");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
