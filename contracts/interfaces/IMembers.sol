// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface IMembers {
    function addMember(address _member, address _sponsor) external;

    function isMember(address _member) external view returns (bool);

    function getParentTree(address _member, uint256 _deep)
        external
        view
        returns (address[] memory);
}
