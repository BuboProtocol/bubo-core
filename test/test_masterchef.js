const assert = require('assert');
const BigNumber = require('bignumber.js')

const Gbt = artifacts.require("./GBTToken.sol")
const Bubo = artifacts.require("./BuboToken.sol")
const Members = artifacts.require('./Members.sol')
const MasterChef = artifacts.require('./MasterChef.sol')
const TokenX = artifacts.require('./libraries/TokenX.sol')
const BuboToken = artifacts.require('./BuboToken.sol')

contract('MasterChef', ([owner]) => {

    it('Should deploy smart contract', async () => {
        const masterchef = await MasterChef.deployed()
        assert(masterchef.address !== '')
    })

    it('Change owner Bubo', async () => {
        const bubo = await Bubo.deployed()
        await bubo.transferOwnership(MasterChef.address)
        const ownerNew = await bubo.owner()
        assert(ownerNew == MasterChef.address)
    })

    it('Change owner Gbt', async () => {
        const gbt = await Gbt.deployed()
        await gbt.transferOwnership(MasterChef.address)
        const ownerNew = await gbt.owner()
        assert(ownerNew == MasterChef.address)
    })

    it('Set referral percentage', async () => {
        const masterchef = await MasterChef.deployed()
        await masterchef.setPercent(new BigNumber((3 * (10 ** 18))), new BigNumber((2 * (10 ** 18))), new BigNumber((1 * (10 ** 18))))
        let perc_referral_1 = await masterchef.refPercent(0)
        let perc_referral_2 = await masterchef.refPercent(1)
        let perc_referral_3 = await masterchef.refPercent(2)
        assert(perc_referral_1.toString() == '3000000000000000000' && perc_referral_2.toString() == '2000000000000000000' && perc_referral_3.toString() == '1000000000000000000')
    })

    it('Add Farm', async () => {
        const masterchef = await MasterChef.deployed()
        const tokenX = await TokenX.deployed()
        const poolLength_last = await masterchef.poolLength()
        await masterchef.add(1000, tokenX.address, false)
        const poolLength_new = await masterchef.poolLength()
        assert(poolLength_last.toString() == '1' && poolLength_new.toString() == '2')
    })

    it('Create mod in members', async () => {
        const members = await Members.deployed()
        const masterchef = await MasterChef.deployed()
        await members.addMod(masterchef.address)
        const member_check = await members.mod(masterchef.address)
        assert(member_check)
    })    

    it('Send tokensX to 100 addresses', async () => {
        const tokenX = await TokenX.deployed()
        const accounts = await web3.eth.getAccounts()
        if(accounts.length >= 100){
            for (let i = 1; i <= 100; i++) {
                await tokenX.transfer(accounts[i], new BigNumber((100 * (10 ** 18))))
            }
            const balance_account_1 = await tokenX.balanceOf.call(accounts[1])
            const balance_account_100 = await tokenX.balanceOf.call(accounts[100])
            assert(balance_account_1.toString() == '100000000000000000000' && balance_account_100.toString() == '100000000000000000000')
        } else {
            assert(false)
        }
    })

    it('Approve tokensX to 100-address masterchef', async () => {
        const tokenX = await TokenX.deployed()
        const masterchef = await MasterChef.deployed()
        const accounts = await web3.eth.getAccounts()
        if(accounts.length >= 100){
            const balance_account_1 = await tokenX.balanceOf.call(accounts[1])
            const balance_account_100 = await tokenX.balanceOf.call(accounts[100])
            if(balance_account_1.toString() == '100000000000000000000' && balance_account_100.toString() == '100000000000000000000'){
                for (let i = 1; i <= 100; i++) {
                    await tokenX.approve(masterchef.address, new BigNumber((100 * (10 ** 18))), { from: accounts[i] })
                }
                assert(true)
            } else {
                assert(false)
            }
        } else {
            assert(false)
        }
    })

    it('Deposit tokensX to 100-address masterchef', async () => {
        const masterchef = await MasterChef.deployed()
        const accounts = await web3.eth.getAccounts()
        if(accounts.length >= 100){
            const poolInfo_last = await masterchef.poolInfo.call(1)
            const tokens = new BigNumber((100 * (10 ** 18)))
            for (let i = 1; i <= 100; i++) {
                await masterchef.deposit(1, tokens, accounts[0], { from: accounts[i] })
            }
            const poolInfo_new = await masterchef.poolInfo.call(1)
            const pendingBubo_user_1 = await masterchef.pendingBubo.call(1, accounts[1])
            assert(poolInfo_last.accBuboPerShare.toString() == '0' && poolInfo_new.accBuboPerShare.toString() == '1553601655658' && pendingBubo_user_1.toString() == '155360165565800000000')
        } else {
            assert(false)
        }
    })

    it('Claim tokens LP in farm', async () => {
        const masterchef = await MasterChef.deployed()
        const buboToken = await BuboToken.deployed()
        const accounts = await web3.eth.getAccounts()
        const pendingBubo_user_1_last = await masterchef.pendingBubo.call(1, accounts[1])
        const balanceBubo_user_1_last = await buboToken.balanceOf.call(accounts[1])
        await masterchef.deposit(1, 0, accounts[0], { from: accounts[1] })
        const pendingBubo_user_1_new = await masterchef.pendingBubo.call(1, accounts[1])
        const balanceBubo_user_1_new = await buboToken.balanceOf.call(accounts[1])
        assert(pendingBubo_user_1_last.toString() == '155360165565800000000' && balanceBubo_user_1_last.toString() == '0' && pendingBubo_user_1_new.toString() == '0' && balanceBubo_user_1_new.toString() == '164999855019570000000')
    })

    it('Withdraw tokens LP in farm', async () => {
        const masterchef = await MasterChef.deployed()
        const accounts = await web3.eth.getAccounts()
        const pendingBubo_user_1_last = await masterchef.userInfo.call(1, accounts[1])
        await masterchef.withdraw(1, pendingBubo_user_1_last.amount, { from: accounts[1] })
        const pendingBubo_user_1_new = await masterchef.userInfo.call(1, accounts[1])
        assert(pendingBubo_user_1_last.amount.toString() == '100000000000000000000' && pendingBubo_user_1_new.amount.toString() == '0')
    })

    it('Staking token', async () => {
        const masterchef = await MasterChef.deployed()
        const buboToken = await BuboToken.deployed()
        const accounts = await web3.eth.getAccounts()
        const balanceBubo_user_1_last = await buboToken.balanceOf.call(accounts[1])
        await buboToken.approve(masterchef.address, balanceBubo_user_1_last, { from: accounts[1] })
        await masterchef.enterStaking(balanceBubo_user_1_last, accounts[0], { from: accounts[1] })
        const balanceBubo_user_1_new = await buboToken.balanceOf.call(accounts[1])
        assert(balanceBubo_user_1_last.toString() == '165317934539392000000' && balanceBubo_user_1_new.toString() == '0')
    })

    it('Creation of temporary blocks', async () => {
        const masterchef = await MasterChef.deployed()
        const buboToken = await BuboToken.deployed()
        const accounts = await web3.eth.getAccounts()
        for (let i = 1; i <= 100; i++) {
            await buboToken.approve(masterchef.address, new BigNumber(100), { from: accounts[1] })
        }
        assert(true)
    })

    it('Claim staking ', async () => {
        const masterchef = await MasterChef.deployed()
        const buboToken = await BuboToken.deployed()
        const accounts = await web3.eth.getAccounts()
        const pendingBubo_user_1_last = await masterchef.pendingBubo.call(0, accounts[1])
        const balanceBubo_user_1_last = await buboToken.balanceOf.call(accounts[1])
        await masterchef.enterStaking(0, accounts[0], { from: accounts[1] })
        const pendingBubo_user_1_new = await masterchef.pendingBubo.call(0, accounts[1])
        const balanceBubo_user_1_new = await buboToken.balanceOf.call(accounts[1])
        assert(pendingBubo_user_1_last.toString() == '999249812453101032107' && balanceBubo_user_1_last.toString() == '0' && pendingBubo_user_1_new.toString() == '0' && balanceBubo_user_1_new.toString() == '1069796849212302231563')
    })    

    it('Withdraw staking', async () => {
        const masterchef = await MasterChef.deployed()
        const accounts = await web3.eth.getAccounts()
        const pendingBubo_user_1_last = await masterchef.userInfo.call(0, accounts[1])
        await masterchef.leaveStaking(pendingBubo_user_1_last.amount, { from: accounts[1] })
        const pendingBubo_user_1_new = await masterchef.userInfo.call(0, accounts[1])
        assert(pendingBubo_user_1_last.amount.toString() == '165317934539392000000' && pendingBubo_user_1_new.amount.toString() == '0')
    })

    it('emergencyWithdraw LP', async () => {
        const accounts = await web3.eth.getAccounts()
        const masterchef = await MasterChef.deployed()
        const tokenX = await TokenX.deployed()
        const balanceBubo_user_1_last = await tokenX.balanceOf.call(accounts[0])
        await tokenX.approve(masterchef.address, new BigNumber(1), { from: accounts[0] })
        await masterchef.deposit(1, new BigNumber(1), accounts[0], { from: accounts[0] })
        const balanceBubo_user_1_new = await tokenX.balanceOf.call(accounts[0])
        await masterchef.emergencyWithdraw(1, { from: accounts[0] })
        const balanceBubo_user_1_whit_withdraw = await tokenX.balanceOf.call(accounts[0])
        assert(balanceBubo_user_1_last.toString() == '990000000000000000000000' && balanceBubo_user_1_new.toString() == '989999999999999999999999' && balanceBubo_user_1_whit_withdraw.toString() == '990000000000000000000000')
    })

    it('Change address dapp', async () => {
        const accounts = await web3.eth.getAccounts()
        const masterchef = await MasterChef.deployed()
        await masterchef.dapp(accounts[0])
        const dappaddr = await masterchef.dappaddr.call()
        assert(dappaddr == accounts[0])
    })

    it('Airdrop mint tokens', async () => {
        const accounts = await web3.eth.getAccounts()
        const masterchef = await MasterChef.deployed()
        const buboToken = await BuboToken.deployed()
        const balanceBubo_user_1_last = await buboToken.balanceOf.call(accounts[5])
        await masterchef.airdrop(accounts[5], new BigNumber((100 * (10 ** 18))))
        const balanceBubo_user_1_new = await buboToken.balanceOf.call(accounts[5])
        assert(balanceBubo_user_1_last.toString() == '0' && balanceBubo_user_1_new.toString() == '100000000000000000000')
    })

    it('Change address crowdsale', async () => {
        const accounts = await web3.eth.getAccounts()
        const masterchef = await MasterChef.deployed()
        await masterchef.crowdsale(accounts[0])
        const crowdsaleddr = await masterchef.crowdsaleddr.call()
        assert(crowdsaleddr == accounts[0])
    })

    it('Crowdsale mint tokens', async () => {
        const accounts = await web3.eth.getAccounts()
        const masterchef = await MasterChef.deployed()
        const buboToken = await BuboToken.deployed()
        const balanceBubo_user_1_last = await buboToken.balanceOf.call(accounts[6])
        await masterchef.buyInCrowdsale(accounts[6], new BigNumber((100 * (10 ** 18))))
        const balanceBubo_user_1_new = await buboToken.balanceOf.call(accounts[6])
        assert(balanceBubo_user_1_last.toString() == '0' && balanceBubo_user_1_new.toString() == '100000000000000000000')
    })

    it('Change address lottery', async () => {
        const accounts = await web3.eth.getAccounts()
        const masterchef = await MasterChef.deployed()
        await masterchef.lottery(accounts[0])
        const lotteryaddr = await masterchef.lotteryaddr.call()
        assert(lotteryaddr == accounts[0])
    })

    it('Lottery mint tokens', async () => {
        const accounts = await web3.eth.getAccounts()
        const masterchef = await MasterChef.deployed()
        const buboToken = await BuboToken.deployed()
        const balanceBubo_user_1_last = await buboToken.balanceOf.call(accounts[7])
        await masterchef.lotteryGain(accounts[7], new BigNumber((100 * (10 ** 18))))
        const balanceBubo_user_1_new = await buboToken.balanceOf.call(accounts[7])
        assert(balanceBubo_user_1_last.toString() == '0' && balanceBubo_user_1_new.toString() == '100000000000000000000')
    })

})