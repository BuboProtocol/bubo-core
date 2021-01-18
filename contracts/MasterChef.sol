// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import '@pancakeswap/pancake-swap-lib/contracts/math/SafeMath.sol';
import '@pancakeswap/pancake-swap-lib/contracts/token/BEP20/IBEP20.sol';
import '@pancakeswap/pancake-swap-lib/contracts/token/BEP20/SafeBEP20.sol';
import '@pancakeswap/pancake-swap-lib/contracts/access/Ownable.sol';

import "./BuboToken.sol";
import "./GBTToken.sol";
import "./interfaces/IMigratorChef.sol";
import "./interfaces/IMembers.sol";



// MasterChef is the master of Bubo. He can make Bubo and he is a fair guy.
//
// Note that it's ownable and the owner wields tremendous power. The ownership
// will be transferred to a governance smart contract once BUBO is sufficiently
// distributed and the community can show to govern itself.
//
// Have fun reading it. Hopefully it's bug-free. God bless.
contract MasterChef is Ownable {
    using SafeMath for uint256;
    using SafeBEP20 for IBEP20;

    // Info of each user.
    struct UserInfo {
        uint256 amount;     // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        //
        // We do some fancy math here. Basically, any point in time, the amount of BUBOs
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accBuboPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accBuboPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    // Info of each pool.
    struct PoolInfo {
        IBEP20 lpToken;           // Address of LP token contract.
        uint256 allocPoint;       // How many allocation points assigned to this pool. BUBOs to distribute per block.
        uint256 lastRewardBlock;  // Last block number that BUBOs distribution occurs.
        uint256 accBuboPerShare; // Accumulated BUBOs per share, times 1e12. See below.
    }

    // The BUBO TOKEN!
    BuboToken public bubo;
    // The GBT TOKEN!
    GBTToken public gbt;
    // Members
    IMembers public member;
    // Dev address.
    address public devaddr;
    // Dapp address.
    address public dappaddr;
    // Crowdsale address.
    address public crowdsaleddr;
    // BUBO tokens created per block.
    uint256 public buboPerBlock;
    // Bonus muliplier for early bubo makers.
    uint256 public BONUS_MULTIPLIER = 1;
    // The migrator contract. It has a lot of power. Can only be set through governance (owner).
    IMigratorChef public migrator;

    // Info of each pool.
    PoolInfo[] public poolInfo;
    // Info of each user that stakes LP tokens.
    mapping (uint256 => mapping (address => UserInfo)) public userInfo;
    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;
    // The block number when BUBO mining starts.
    uint256 public startBlock;
    // Percentage of referrals
    uint256[3] public refPercent = [0, 0, 0];

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Referrals(address indexed user, address indexed ref, uint256 indexed pid, uint256 amount);

    constructor(
        BuboToken _bubo,
        GBTToken _gbt,
        IMembers _member,
        address _devaddr,
        uint256 _buboPerBlock,
        uint256 _startBlock
    ) public {
        bubo = _bubo;
        gbt = _gbt;
        member = _member;
        devaddr = _devaddr;
        buboPerBlock = _buboPerBlock;
        startBlock = _startBlock;

        // staking pool
        poolInfo.push(PoolInfo({
            lpToken: _bubo,
            allocPoint: 1000,
            lastRewardBlock: startBlock,
            accBuboPerShare: 0
        }));

        totalAllocPoint = 1000;

    }

    function setPercent(uint256 r_1, uint256 r_2, uint256 r_3) external onlyOwner {
        refPercent[0] = r_1;
        refPercent[1] = r_2;
        refPercent[2] = r_3;
    }  

    function updateMultiplier(uint256 multiplierNumber) public onlyOwner {
        BONUS_MULTIPLIER = multiplierNumber;
    }

    function setBuboPerBlock(uint256 _buboPerBlock) external onlyOwner {
        buboPerBlock = _buboPerBlock;
    } 

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Creation of BUBOs for referrals
    function referrals(address _user, uint256 _pid, uint256 _amount) public {
        address[] memory refTree = member.getParentTree(_user, 3);
        for (uint256 i = 0; i < 3; i++) {
            if (refTree[i] != address(0) && refPercent[i] > 0 && _amount > 0) {
                uint256 refAmount = _amount.mul(refPercent[i]).div(100 ether);
                if(refAmount > 0){
                    bubo.mint(refTree[i], refAmount);
                    emit Referrals(_user, refTree[i], _pid, refAmount);
                }
            } else {
                break;
            }
        }
    }

    // Add a new lp to the pool. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    function add(uint256 _allocPoint, IBEP20 _lpToken, bool _withUpdate) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accBuboPerShare: 0
        }));
        updateStakingPool();
    }

    // Update the given pool's BUBO allocation point. Can only be called by the owner.
    function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 prevAllocPoint = poolInfo[_pid].allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
        if (prevAllocPoint != _allocPoint) {
            totalAllocPoint = totalAllocPoint.sub(prevAllocPoint).add(_allocPoint);
            updateStakingPool();
        }
    }

    function updateStakingPool() internal {
        uint256 length = poolInfo.length;
        uint256 points = 0;
        for (uint256 pid = 1; pid < length; ++pid) {
            points = points.add(poolInfo[pid].allocPoint);
        }
        if (points != 0) {
            points = points.div(3);
            totalAllocPoint = totalAllocPoint.sub(poolInfo[0].allocPoint).add(points);
            poolInfo[0].allocPoint = points;
        }
    }

    // Set the migrator contract. Can only be called by the owner.
    function setMigrator(IMigratorChef _migrator) public onlyOwner {
        migrator = _migrator;
    }

    // Migrate lp token to another lp contract. Can be called by anyone. We trust that migrator contract is good.
    function migrate(uint256 _pid) public {
        require(address(migrator) != address(0), "migrate: no migrator");
        PoolInfo storage pool = poolInfo[_pid];
        IBEP20 lpToken = pool.lpToken;
        uint256 bal = lpToken.balanceOf(address(this));
        lpToken.safeApprove(address(migrator), bal);
        IBEP20 newLpToken = migrator.migrate(lpToken);
        require(bal == newLpToken.balanceOf(address(this)), "migrate: bad");
        pool.lpToken = newLpToken;
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        return _to.sub(_from).mul(BONUS_MULTIPLIER);
    }

    // View function to see pending BUBOs on frontend.
    function pendingBubo(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accBuboPerShare = pool.accBuboPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 buboReward = multiplier.mul(buboPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accBuboPerShare = accBuboPerShare.add(buboReward.mul(1e12).div(lpSupply));
        }
        return user.amount.mul(accBuboPerShare).div(1e12).sub(user.rewardDebt);
    }

    // Update reward variables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }


    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 buboReward = multiplier.mul(buboPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
        bubo.mint(devaddr, buboReward.div(10));
        bubo.mint(address(gbt), buboReward);
        pool.accBuboPerShare = pool.accBuboPerShare.add(buboReward.mul(1e12).div(lpSupply));
        pool.lastRewardBlock = block.number;
    }

    // Deposit LP tokens to MasterChef for BUBO allocation.
    function deposit(uint256 _pid, uint256 _amount, address ref) public {

        require (_pid != 0, 'deposit BUBO by staking');

        if(member.isMember(ref) == false){
            ref = member.membersList(0);
        }

        if(member.isMember(msg.sender) == false){
            member.addMember(msg.sender, ref);
        }

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accBuboPerShare).div(1e12).sub(user.rewardDebt);
            if(pending > 0) {
                safeBuboTransfer(msg.sender, pending);
                referrals(msg.sender, _pid, pending);
            }
        }
        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
            user.amount = user.amount.add(_amount);
        }
        user.rewardDebt = user.amount.mul(pool.accBuboPerShare).div(1e12);
        emit Deposit(msg.sender, _pid, _amount);
    }

    // Withdraw LP tokens from MasterChef.
    function withdraw(uint256 _pid, uint256 _amount) public {

        require (_pid != 0, 'withdraw BUBO by unstaking');
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");

        updatePool(_pid);
        uint256 pending = user.amount.mul(pool.accBuboPerShare).div(1e12).sub(user.rewardDebt);
        if(pending > 0) {
            safeBuboTransfer(msg.sender, pending);
            referrals(msg.sender, _pid, pending);
        }
        if(_amount > 0) {
            user.amount = user.amount.sub(_amount);
            pool.lpToken.safeTransfer(address(msg.sender), _amount);
        }
        user.rewardDebt = user.amount.mul(pool.accBuboPerShare).div(1e12);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Stake BUBO tokens to MasterChef
    function enterStaking(uint256 _amount, address ref) public {
        
        if(member.isMember(ref) == false){
            ref = member.membersList(0);
        }

        if(member.isMember(msg.sender) == false){
            member.addMember(msg.sender, ref);
        }

        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        updatePool(0);
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accBuboPerShare).div(1e12).sub(user.rewardDebt);
            if(pending > 0) {
                safeBuboTransfer(msg.sender, pending);
                referrals(msg.sender, 0, pending);
            }
        }
        if(_amount > 0) {
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
            user.amount = user.amount.add(_amount);
        }
        user.rewardDebt = user.amount.mul(pool.accBuboPerShare).div(1e12);

        gbt.mint(msg.sender, _amount);
        emit Deposit(msg.sender, 0, _amount);
    }

    // Withdraw BUBO tokens from STAKING.
    function leaveStaking(uint256 _amount) public {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(0);
        uint256 pending = user.amount.mul(pool.accBuboPerShare).div(1e12).sub(user.rewardDebt);
        if(pending > 0) {
            safeBuboTransfer(msg.sender, pending);
            referrals(msg.sender, 0, pending);
        }
        if(_amount > 0) {
            user.amount = user.amount.sub(_amount);
            pool.lpToken.safeTransfer(address(msg.sender), _amount);
        }
        user.rewardDebt = user.amount.mul(pool.accBuboPerShare).div(1e12);

        gbt.burn(msg.sender, _amount);
        emit Withdraw(msg.sender, 0, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        pool.lpToken.safeTransfer(address(msg.sender), user.amount);
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
        user.amount = 0;
        user.rewardDebt = 0;
    }

    // Safe bubo transfer function, just in case if rounding error causes pool to not have enough BUBOs.
    function safeBuboTransfer(address _to, uint256 _amount) internal {
        gbt.safeBuboTransfer(_to, _amount);
    }

    // Update dev address by the previous dev.
    function dev(address _devaddr) public {
        require(msg.sender == devaddr, "dev: wut?");
        devaddr = _devaddr;
    }

    function dapp(address _dappaddr) public onlyOwner {
        dappaddr = _dappaddr;
    }

    function airdrop(address _user, uint256 _amount) public {
        require(msg.sender == dappaddr, "dapp: wut?");
        bubo.mint(_user, _amount);
    }

    function crowdsale(address _crowdsaleddr) public onlyOwner {
        crowdsaleddr = _crowdsaleddr;
    }

    function buyInCrowdsale(address _user, uint256 _amount) public {
        require(msg.sender == crowdsaleddr, "crowdsale: wut?");
        bubo.mint(_user, _amount);
    }

}