// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IMembers.sol";
import "./interfaces/IMasterChef.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IWBNB.sol";
import "./libraries/Basic.sol";

contract CrowdSale is Basic {
    using SafeMath for uint256;

    IERC20 public token;
    IMembers public member;
    IMasterChef public masterchef;
    
    uint256 public _stage = 0;

    struct StageStruct {
        bool isExist;
        uint256 id;
        uint256 min;
        uint256 max;
        uint256 tokens;
        uint256 start;
        uint256 end;
        uint256 price;
        uint256 member_1;
        uint256 member_2;
        uint256 member_3;
        uint256 tokens_sold;
        uint256 tokens_ref;
        bool status;
    }
    mapping(uint256 => StageStruct) public Stages;

    uint256[3] public refPercent = [0, 0, 0];

    address public payment;

    IUniswapV2Router02 public uniswapRouter;

    IWBNB public WBNB;
    
    constructor(address _token, address _member, address _masterchef, address _wbnb) public {
        token = IERC20(_token);
        member = IMembers(_member);
        masterchef = IMasterChef(_masterchef);
        uniswapRouter = IUniswapV2Router02(masterchef.router());
        WBNB = IWBNB(_wbnb);
    }

    modifier getCurrentStage(bool check, bool checkStart) {
        require(_stage > 0, "There are no stages");
        for (uint256 i = 1; i <= _stage; i++) {
            check = false;
            checkStart = true;
            if (Stages[i].start > now) {
                checkStart = false;
            }
            if (Stages[i].start <= now && Stages[i].end >= now) {
                check = true;
                if (_stage != i) {
                    _stage = i;
                    refPercent[0] = Stages[_stage].member_1;
                    refPercent[1] = Stages[_stage].member_2;
                    refPercent[2] = Stages[_stage].member_3;
                }
                break;
            }
        }
        require(checkStart == true, "The stage has not started yet");
        require(check == true, "Sale is over");
        _;
    }

    function createStage(
        uint256 _min,
        uint256 _max,
        uint256 _tokens,
        uint256 _start,
        uint256 _end,
        uint256 _price,
        uint256 _member_1,
        uint256 _member_2,
        uint256 _member_3
    ) external onlyMod {
        require(Stages[_stage].end <= _start, "Incorrect date");
        require(_start < _end, "End date must be greater than start date");
        _stage = _stage.add(1);
        StageStruct memory Stage_Struct;
        Stage_Struct = StageStruct({
            isExist: true,
            id: _stage,
            min: _min,
            max: _max,
            tokens: _tokens,
            start: _start,
            end: _end,
            price: _price,
            member_1: _member_1,
            member_2: _member_2,
            member_3: _member_3,
            tokens_sold: 0,
            tokens_ref: 0,
            status: true
        });
        Stages[_stage] = Stage_Struct;
        emit eventCreateStage(now, _stage, msg.sender);
    }

    function buyTokens(address ref)
        external
        payable
        getCurrentStage(false, true)
        returns (bool)
    {
        require(owner() != msg.sender);
        require(msg.value > 0, "The value must be greater than zero.");
        require(
            msg.value >= Stages[_stage].min,
            "The purchase amount must be greater"
        );
        require(
            msg.value <= Stages[_stage].max,
            "The purchase amount must be less"
        );
        if (member.isMember(msg.sender) == false) {
            require(member.isMember(ref), "The sponsor is not registered");
            member.addMember(msg.sender, ref);
        }
        return _buyTokens(msg.value, msg.sender, 0);
    }

    function buyTokensFiat(
        address ref,
        address user,
        uint256 value
    ) external getCurrentStage(false, true) onlySupport returns (bool) {
        require(owner() != user);
        require(value > 0, "The value must be greater than zero.");
        require(
            value >= Stages[_stage].min,
            "The purchase amount must be greater"
        );
        require(
            value <= Stages[_stage].max,
            "The purchase amount must be less"
        );
        if (member.isMember(user) == false) {
            require(member.isMember(ref), "The sponsor is not registered");
            member.addMember(user, ref);
        }
        return _buyTokens(value, user, 1);
    }

    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }

    function getReserves(address tokenA, address tokenB) public view returns (uint reserveA, uint reserveB) {
        (address token0,) = sortTokens(tokenA, tokenB);
        (uint reserve0, uint reserve1,) = IUniswapV2Router02(masterchef.buboLP()).getReserves();
        (reserveA, reserveB) = address(tokenA) == address(token0) ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    function quote(uint amount, uint reserveA, uint reserveB) public view returns (uint) {
        return uniswapRouter.quote(amount, reserveB, reserveA);
    }    

    function tokensSend(uint valueWEI) public view returns(uint256){
        (uint reserveA, uint reserveB) = getReserves(address(token), address(WBNB));
        return uniswapRouter.quote(valueWEI, reserveB, reserveA);
    }    

    function _buyTokens(
        uint256 _value,
        address user,
        uint256 _type
    ) internal returns (bool) {
        uint256 tokens_sold = _value.mul(Stages[_stage].price).div(1 ether);
        uint256 tokens_ref = 0;
        require(tokens_sold > 0, "Amount of invalid tokens.");
        masterchef.buyInCrowdsale(user, tokens_sold);
        masterchef.buyInCrowdsale(masterchef.devaddr(), tokens_sold.div(10));
        Stages[_stage].tokens_sold = Stages[_stage].tokens_sold.add(
            tokens_sold
        );
        address[] memory refTree = member.getParentTree(user, 3);
        for (uint256 i = 0; i < 3; i++) {
            uint256 percent = 0;
            if (i == 0) {
                percent = Stages[_stage].member_1;
            } else if (i == 1) {
                percent = Stages[_stage].member_2;
            } else if (i == 2) {
                percent = Stages[_stage].member_3;
            } else {
                percent = 0;
            }
            if (
                refTree[i] != address(0) && refTree[i] != owner() && percent > 0
            ) {
                uint256 refAmount = tokens_sold.mul(percent).div(100 ether);
                
                masterchef.buyInCrowdsale(refTree[i], refAmount);

                Stages[_stage].tokens_ref = Stages[_stage].tokens_ref.add(
                    refAmount
                );
                tokens_ref = tokens_ref.add(refAmount);
                emit eventBonusReferral(
                    now,
                    refTree[i],
                    user,
                    (i + 1),
                    _type,
                    msg.sender,
                    refAmount
                );
            } else {
                break;
            }
        }
        emit eventBuyTokens(
            now,
            _value,
            tokens_sold,
            tokens_ref,
            _type,
            msg.sender,
            user
        );
        if (address(this).balance > 0) {
            uint256 amountWBNB = address(this).balance;

            uint256 tokens_solds = tokensSend(address(this).balance);
            uint256 tokens_solds_min = tokens_sold.sub(tokens_sold.mul(3).div(100));
            uint256 value_min = address(this).balance.sub(address(this).balance.mul(3).div(100));

            masterchef.buyInCrowdsale(address(this), tokens_solds);
            token.approve(address(uniswapRouter), tokens_solds);

            uniswapRouter.addLiquidityETH
            { value: amountWBNB }
            (
                address(token),
                tokens_solds,
                tokens_solds_min,
                value_min,
                address(this),
                now
            );

        }
        if (address(this).balance > 0) {
            address(uint160(masterchef.devaddr())).transfer(address(this).balance);
        }
        if(token.balanceOf(address(this)) > 0){
            token.transfer(masterchef.devaddr(), token.balanceOf(address(this)));
        }
        return true;
    }

    function addressPayment(address _payment) public onlyOwner {
        if (_payment != address(0x0) && _payment != address(0)) {
            emit eventAddressPayment(now, payment, _payment);
            payment = _payment;
        }
    }

    function withdrawExcess() external onlyOwner {
        emit eventWithdrawExcess(
            now,
            address(this).balance,
            0
        );
        if (address(this).balance > 0) {
            address(uint160(masterchef.devaddr())).transfer(address(this).balance);
        }
    }    

    event eventAddressPayment(
        uint256 indexed _time,
        address indexed _last,
        address indexed _new
    );
    event eventWithdrawExcess(
        uint256 indexed _time,
        uint256 indexed _balance,
        uint256 indexed _tokens
    );

    event eventCreateStage(
        uint256 indexed _time,
        uint256 indexed _id,
        address indexed _user
    );

    event eventBuyTokens(
        uint256 indexed _time,
        uint256 _value,
        uint256 _tokens,
        uint256 _tokens_ref,
        uint256 _type,
        address _autor,
        address indexed _user
    );

    event eventBonusReferral(
        uint256 _time,
        address indexed _user,
        address indexed _referrer,
        uint256 indexed _level,
        uint256 _type,
        address _autor,
        uint256 _tokens
    );    

}