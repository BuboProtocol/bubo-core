// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface IMasterChef {

    function airdrop(address _user, uint256 _amount) external;

    function buyInCrowdsale(address _user, uint256 _amount) external;

    function buyInCrowdsaleGBT(address _user, uint256 _amount) external;

    function lotteryGain(address _user, uint256 _amount) external;

    function buboLP() external view returns (address);

    function gbtLP() external view returns (address);

    function router() external view returns (address);

    function devaddr() external view returns (address);

}
