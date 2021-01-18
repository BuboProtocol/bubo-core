// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./libraries/Basic.sol";
import "./interfaces/IMasterChef.sol";

contract Lottery is Basic {

    using SafeMath for uint256;
    IERC20 public token;
    IMasterChef public masterchef;

    uint256 public decimals = 18;
    uint public finishedCount = 1000;
    uint256 public turns = 10;  
    uint public lastRound;
    uint256 public earnings;
    address public payment;
    uint256[6] public gainPercent = [0, 0, 0, 0, 0, 0];

    struct RoundStruct {
        bool isExist;
        bool turn;
        uint id;
        uint start;
        uint finish;
        uint totalParticipants;
        uint256 amount;
    }
    mapping(uint => RoundStruct) public Rounds;
    mapping(uint => mapping (uint => address)) public RoundsParticipants;
    mapping(uint => mapping (address => uint)) public ParticipantsTurns;
    mapping(address => uint) public unclaimedTokens;
    mapping(uint => mapping (uint => address)) public winners;

    constructor(address _token, address _masterchef) public {
        token = IERC20(_token);
        masterchef = IMasterChef(_masterchef);
    }

    function setDecimals(uint256 _count) external onlyMod {
        decimals = _count;
        emit eventDecimals(now, _count);
    }

    function setFinishedCount(uint256 _count) external onlyMod {
        finishedCount = _count;
        emit eventfinishedCount(now, _count);
    }
    
    function setTurns(uint256 _count) external onlyMod {
        turns = _count;
        emit eventTurns(now, _count);
    }
    
    function Game(uint _turns) external returns (bool) {
        require(Rounds[lastRound].turn == false, "The voting is over");
        require(_turns <= turns, "You can't buy so many shifts");
        require((checkTurns() + _turns) <= turns, "You can't buy so many shifts");
        require((_turns + Rounds[lastRound].totalParticipants) <= finishedCount, "Buy fewer shifts");
        require(
            token.balanceOf(msg.sender) >= (_turns * (10 ** decimals)),
            "You do not have the amount of tokens to deposit"
        );
        require(
            token.transferFrom(msg.sender, address(this), (_turns * (10 ** decimals))) == true,
            "You have not approved the deposit"
        );
        if( Rounds[lastRound].isExist == false ){
            RoundStruct memory round_struct;
            round_struct = RoundStruct({
                isExist: true,
                turn: false,
                id: lastRound,
                start: now,
                finish: 0,
                totalParticipants: 0,
                amount: 0
            });
            Rounds[lastRound] = round_struct;
        }
        for(uint i = 1; i<=_turns; i++){
            RoundsParticipants[lastRound][Rounds[lastRound].totalParticipants] = msg.sender;
            Rounds[lastRound].totalParticipants++;
            ParticipantsTurns[lastRound][msg.sender]++;
        }
        if( Rounds[lastRound].totalParticipants >= (finishedCount) ){
            Rounds[lastRound].turn = true;
            finishTurns();
        }
        return true;
    }

    function finishTurns() private {
        require(Rounds[lastRound].turn == true, "The voting is over");
        if( Rounds[lastRound].totalParticipants >= (finishedCount) ){
            finishedGame();
            Rounds[lastRound].finish = now;
            lastRound++;
        }
    }

    function finishedGame() private {
        uint count = 0;
        uint x = 1;
        uint256 balance = token.balanceOf(address(this));
        earnings = earnings.add(balance);
        Rounds[lastRound].amount = balance;
        while(x <= 6){
            count++;
            address _userCheck = RoundsParticipants[lastRound][randomness(count)];
            if(_userCheck != address(0) && _userCheck != address(0x0)){
                winners[lastRound][x] = _userCheck;
                uint256 percentage = getPercentage(x);
                uint256 amount = (balance.mul(percentage)).div(100);
                sendToken(_userCheck, amount);
                x++;
            }
        }
        for(uint i = 0; i<=Rounds[lastRound].totalParticipants; i++){   
            unclaimedTokens[RoundsParticipants[lastRound][i]] = ParticipantsTurns[lastRound][RoundsParticipants[lastRound][i]] * (10 ** 18);
        }
        uint256 amountDevs = (finishedCount.mul(10).div(100)) * (10 ** 18);
        sendToken(payment, amountDevs);
    }

    function claim() public {
        require(unclaimedTokens[msg.sender] > 0, "you don't have tokens to claim");
        token.transfer(msg.sender, unclaimedTokens[msg.sender]);
        unclaimedTokens[msg.sender] = 0;
    }

    function addressPayment(address _payment) public onlyOwner {
        if (_payment != address(0x0) && _payment != address(0)) {
            payment = _payment;
        }
    }

    function setPercent(uint256 r_1, uint256 r_2, uint256 r_3, uint256 r_4, uint256 r_5, uint256 r_6) external onlyOwner {
        gainPercent[0] = r_1;
        gainPercent[1] = r_2;
        gainPercent[2] = r_3;
        gainPercent[3] = r_4;
        gainPercent[4] = r_5;
        gainPercent[5] = r_6;
    }      

    function sendToken(address _user, uint256 _amount) private {
        if( _amount > 0 && (_user != address(0) && _user != address(0x0))){
            masterchef.lotteryGain(_user, _amount);
        }
    }

    function checkTurnsUsers(address _user) public view returns(uint){
        return ParticipantsTurns[lastRound][_user];
    }

    function checkTurns() public view returns(uint){
        return ParticipantsTurns[lastRound][msg.sender];
    }

    function randomness(uint nonce) public view returns (uint) {
        return uint(uint(keccak256(abi.encode(block.timestamp, block.difficulty, nonce)))%(Rounds[lastRound].totalParticipants+1));
    }

    function getPercentage(uint x) public view returns (uint256){
        if(x == 1){return gainPercent[0];}
        else if(x == 2){return gainPercent[1];}
        else if(x == 3){return gainPercent[2];}
        else if(x == 4){return gainPercent[3];}
        else if(x == 5){return gainPercent[4];}
        else if(x == 6){return gainPercent[5];}
    }

    event eventDecimals(uint256 indexed _time, uint256 indexed _count);

    event eventfinishedCount(uint256 indexed _time, uint256 indexed _count);

    event eventTurns(uint256 indexed _time, uint256 indexed _count);

}