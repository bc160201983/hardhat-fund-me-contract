const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");

describe("FundMe", () => {
  let fundMe;
  let deployer;
  let mockV3Aggregator;
  const sendValue = ethers.utils.parseEther("1");
  beforeEach(async () => {
    // const accounts = ethers.getSigners()
    // const accountZero = accounts[0]

    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture(["all"]);
    fundMe = await ethers.getContract("FundMe", deployer);
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
    // console.log(fundMe);
  });

  describe("constructor", async () => {
    it("sets the aggregator address correctly", async () => {
      const res = await fundMe.priceFeed();
      //   console.log(res, mockV3Aggregator.address);
      assert.equal(res, mockV3Aggregator.address);
    });
  });
  describe("fund", async () => {
    // it("fails if you don't send enough ETH", async () => {
    //   await expect(fundMe.fund()).to.be.revertedWith(
    //     "You need to spend more ETH!"
    //   );
    // });
    it("update amount funded data structure", async () => {
      await fundMe.fund({ value: sendValue });
      const res = await fundMe.addressToAmountFunded(deployer);

      // console.log(res.toString(), sendValue.toString());
      assert.equal(res.toString(), sendValue.toString());
    });
    it("add funders to array of funders", async () => {
      await fundMe.fund({ value: sendValue });
      const res = await fundMe.funders(0);

      // console.log(res.toString(), sendValue.toString());
      assert.equal(res, deployer);
    });
  });

  describe("withdraw", async () => {
    beforeEach(async () => {
      await fundMe.fund({ value: sendValue });
    });
    it("withdraw ETH from a single founder", async () => {
      //arrage
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );
      console.log(
        `Starting FundME : ${startingFundMeBalance} Starting Deploper : ${startingDeployerBalance}`
      );
      //act
      const transRes = await fundMe.withdraw();
      const transRecept = await transRes.wait(1);
      const { gasUsed, effectiveGasPrice } = transRecept;
      const gasCost = gasUsed.mul(effectiveGasPrice);
      //assert
      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
      console.log(
        `Ending FundME : ${endingFundMeBalance} Ending Deploper : ${endingDeployerBalance}`
      );
      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
      console.log(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
    });
    it("allows us to withdraw with multiple funders", async () => {
      const accounts = await ethers.getSigners();
      for (let i = 1; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i]);
        await fundMeConnectedContract.fund({ value: sendValue });
      }

      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );
      console.log(`Starting FundME : ${startingFundMeBalance}`);
      //act
      const transRes = await fundMe.withdraw();
      const transRecept = await transRes.wait(1);
      const { gasUsed, effectiveGasPrice } = transRecept;
      const gasCost = gasUsed.mul(effectiveGasPrice);

      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );

      await expect(fundMe.funders(0)).to.be.reverted;
      for (i = 1; i < 6; i++) {
        assert.equal(
          await fundMe.addressToAmountFunded(accounts[i].address),
          0
        );
      }
    });
    it("only allows the owner to withdraw", async () => {
      const accounts = await ethers.getSigners();
      const attakerAccount = accounts[1];
      const attakerConnectedContract = await fundMe.connect(attakerAccount);
      await expect(attakerConnectedContract.withdraw()).to.be.revertedWith(
        "FundMe__NotOwner"
      );
    });
  });
});
