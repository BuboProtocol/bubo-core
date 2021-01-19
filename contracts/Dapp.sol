// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./interfaces/IMembers.sol";
import "./interfaces/IMasterChef.sol";
import "./libraries/Basic.sol";

contract Dapp is Basic {
    using SafeMath for uint256;
    IMembers public member;
    IMasterChef public masterchef;

    address public payment;
    uint256 public decimals = 18;

    uint256 public tokens_airdrop;
    bool public airdrop_paused = false;

    mapping(address => bool) public kyc;

    uint256[3] public refPercent = [0, 0, 0];

    constructor(address _member, address _masterchef) public {
        member = IMembers(_member);
        masterchef = IMasterChef(_masterchef);
    }

    function register(address ref) external returns (bool) {
        require(member.isMember(msg.sender) == false,"You are already registered");
        require(member.isMember(ref), "The sponsor is not registered");
        member.addMember(msg.sender, ref);
        emit eventRegister(now, msg.sender, ref);
        airdrop(msg.sender);
        return true;
    }

    function registerSupport(address ref, address user) external onlySupport returns (bool)
    {
        require(member.isMember(user) == false, "You are already registered");
        require(member.isMember(ref), "The sponsor is not registered");
        member.addMember(user, ref);
        emit eventRegister(now, user, ref);
        airdrop(user);
        return true;
    }

    function airdrop(address user) internal {
        if (airdrop_paused == false) {
            address[] memory refTree = member.getParentTree(user, 3);
            for (uint256 i = 0; i < 3; i++) {
                if (
                    refTree[i] != address(0) &&
                    refTree[i] != owner() &&
                    refPercent[i] > 0
                ) {
                    if (kyc[refTree[i]] == true) {
                        masterchef.airdrop(refTree[i], refPercent[i]);
                        tokens_airdrop = tokens_airdrop.add(refPercent[i]);
                        emit eventAirdrop(now, refTree[i], user, (i + 1), refPercent[i]);
                    }
                } else {
                    break;
                }
            }
        }
    }

    function getTokentForAirDrop(uint256 _id) public view returns (uint256) {
        return refPercent[_id];
    }

    function setAirDrop(uint256 r_1, uint256 r_2, uint256 r_3) external onlyMod {
        emit eventSetAirDrop(now, refPercent[0], refPercent[1], refPercent[2], r_1, r_2, r_3);
        refPercent[0] = r_1;
        refPercent[1] = r_2;
        refPercent[2] = r_3;
    }    

    function setPausedAirDrop(bool _status) external onlyMod {
        airdrop_paused = _status;
        emit eventPausedAirDrop(now, _status);
    }

    function setKYC(address user, bool _kyc) external onlySupport {
        kyc[user] = _kyc;
        emit eventKYC(now, user, _kyc);
    }

    event eventRegister(uint256 indexed _time, address indexed _user, address indexed _ref);

    event eventKYC(uint256 indexed _time, address indexed _user,bool indexed _status);

    event eventPausedAirDrop(uint256 indexed _time, bool indexed _status);

    event eventAirdrop(uint256 _time, address indexed _user, address indexed _referrer, uint256 indexed _level, uint256 _tokens);

    event eventSetAirDrop(uint256 _time, uint256 _last_r1, uint256 _last_r2, uint256 _last_r3, uint256 _r1, uint256 _r2, uint256 _r3);

}