// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;
import "./PriceConverter.sol";
import "hardhat/console.sol";

error FundMe__NotOwner();

contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant minUsd = 50 * 1e18;
    address[] public funders;
    address public immutable owner;
    mapping(address => uint256) public addressToAmountFunded;

    AggregatorV3Interface public priceFeed;

    constructor(address priceFeedAddress) {
        owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function fund() public payable {
        // set minimum send amount
        require(
            msg.value.getConversionRate(priceFeed) >= minUsd,
            "Did't send enough"
        );
        funders.push(msg.sender);
        addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public onlyOwner {
        // conso   le.log("sender", owner);
        address[] memory m_funders = funders;
        for (uint256 _index = 0; _index < m_funders.length; _index++) {
            address funder = m_funders[_index];
            addressToAmountFunded[funder] = 0;
        }

        funders = new address[](0);
        //call
        (bool callSuccess, ) = owner.call{value: address(this).balance}("");
        require(callSuccess, "call failed");
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert FundMe__NotOwner();
        // if (msg.sender != i_owner) revert NotOwner();
        _;
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }
}
