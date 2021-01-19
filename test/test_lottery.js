const assert = require('assert')
const BigNumber = require('bignumber.js')
const BuboToken = artifacts.require("./BuboToken.sol")
const Lottery = artifacts.require("./Lottery.sol")
const MasterChef = artifacts.require('./MasterChef.sol')
const Token = artifacts.require('./GBTToken.sol')


contract('Lottery', ([owner]) => {

    it('Should deploy smart contract', async () => {
        const lottery = await Lottery.deployed()
        const token = await Token.deployed()
        assert(lottery.address !== '' && token.address !== '')
    })

    it('create mod', async () => {
        const accounts = await web3.eth.getAccounts()
        const lottery = await Lottery.deployed()
        await lottery.addMod(accounts[1])
        const member_check = await lottery.mod(accounts[1])
        assert(member_check)
    })

    it('remove mod', async () => {
        const accounts = await web3.eth.getAccounts()
        const lottery = await Lottery.deployed()
        await lottery.removeMod(accounts[1])
        const member_check = await lottery.mod(accounts[1])
        assert(member_check === false)
    })

    it('create support', async () => {
        const accounts = await web3.eth.getAccounts()
        const lottery = await Lottery.deployed()
        await lottery.addSupport(accounts[1])
        const member_check = await lottery.support(accounts[1])
        assert(member_check)
    })

    it('remove support', async () => {
        const accounts = await web3.eth.getAccounts()
        const lottery = await Lottery.deployed()
        await lottery.removeSupport(accounts[1])
        const member_check = await lottery.support(accounts[1])
        assert(member_check == false)
    })

    it('set change decimals', async () => {
        const lottery = await Lottery.deployed()
        let _last = 18
        await lottery.setDecimals(_last)
        let _new = await lottery.decimals()
        assert(_last == _new)
    })

    it('set change turns for finished', async () => {
        const lottery = await Lottery.deployed()
        let _last = 100
        await lottery.setFinishedCount(_last)
        let _new = await lottery.finishedCount()
        assert(_last == _new)
    })

    it('set change turns for user', async () => {
        const lottery = await Lottery.deployed()
        let _last = 100
        await lottery.setTurns(_last)
        let _new = await lottery.turns()
        assert(_last == _new)
    })

    it('set address payment', async () => {
        const accounts = await web3.eth.getAccounts()
        const lottery = await Lottery.deployed()
        let _last = accounts[10]
        await lottery.addressPayment(_last)
        let _new = await lottery.payment.call()
        assert(_last == _new)
    })

    it('Set percentage game', async () => {
        const lottery = await Lottery.deployed()
        await lottery.setPercent(40, 20, 15, 10, 8, 7)
        let perc_1 = await lottery.gainPercent.call(0)
        let perc_2 = await lottery.gainPercent.call(1)
        let perc_3 = await lottery.gainPercent.call(2)
        assert(perc_1.toString() == '40' && perc_2.toString() == '20' && perc_3.toString() == '15')
    })

    it('Mint governance', async () => {
        const accounts = await web3.eth.getAccounts()
        const token = await Token.deployed()
        await token.mint(accounts[0], new BigNumber((1000 * (10 ** 18))));
        const balance = await token.balanceOf.call(accounts[0])
        assert(balance.toString() == '1000000000000000000000')
    })

    it('Change owner Token governance', async () => {
        const token = await Token.deployed()
        const masterchef = await MasterChef.deployed()
        await token.transferOwnership(masterchef.address)
        const ownerNew = await token.owner()
        assert(ownerNew == MasterChef.address)
    })

    it('Change owner Token', async () => {
        const masterchef = await MasterChef.deployed()
        const buboToken = await BuboToken.deployed()
        await buboToken.transferOwnership(masterchef.address)
        const ownerNew = await buboToken.owner()
        assert(ownerNew == MasterChef.address)
    })

    it('Change address lottery in masterchef', async () => {
        const masterchef = await MasterChef.deployed()
        const lottery = await Lottery.deployed()
        await masterchef.lottery(lottery.address)
        const lotteryaddr = await masterchef.lotteryaddr.call()
        assert(lotteryaddr == lottery.address)
    })

    it('set game', async () => {
        const accounts = await web3.eth.getAccounts()
        const lottery = await Lottery.deployed()
        const token = await Token.deployed()
        const buboToken = await BuboToken.deployed()
        const lastRound_last = await lottery.lastRound()
        await token.transfer(accounts[1], new BigNumber((50 * (10 ** 18))))
        await token.transfer(accounts[2], new BigNumber((20 * (10 ** 18))))
        await token.transfer(accounts[3], new BigNumber((30 * (10 ** 18))))
        await token.approve(lottery.address, new BigNumber((50 * (10 ** 18))), { from: accounts[1] })
        await token.approve(lottery.address, new BigNumber((20 * (10 ** 18))), { from: accounts[2] })
        await token.approve(lottery.address, new BigNumber((30 * (10 ** 18))), { from: accounts[3] })
        await lottery.Game(50, { from: accounts[1] })
        await lottery.Game(20, { from: accounts[2] })
        await lottery.Game(30, { from: accounts[3] })
        const lastRound_new = await lottery.lastRound()
        const balance_account_1 = await buboToken.balanceOf.call(accounts[1])
        const balance_account_2 = await buboToken.balanceOf.call(accounts[2])
        const balance_account_3 = await buboToken.balanceOf.call(accounts[3])
        const totalBalance = parseFloat(balance_account_1.toString()) + parseFloat(balance_account_2.toString()) + parseFloat(balance_account_3.toString())
        assert(lastRound_last.toString() == '0' && lastRound_new.toString() == '1' && (new BigNumber(totalBalance)).toString() == '100000000000000000000')
    })

    it('claim tokens governance', async () => {
        const accounts = await web3.eth.getAccounts()
        const lottery = await Lottery.deployed()
        const token = await Token.deployed()
        await lottery.claim({ from: accounts[1] })
        await lottery.claim({ from: accounts[2] })
        await lottery.claim({ from: accounts[3] })
        const new_token_balance_account_1 = await token.balanceOf.call(accounts[1])
        const new_token_balance_account_2 = await token.balanceOf.call(accounts[2])
        const new_token_balance_account_3 = await token.balanceOf.call(accounts[3])
        const totalBalance = parseFloat(new_token_balance_account_1.toString()) + parseFloat(new_token_balance_account_2.toString()) + parseFloat(new_token_balance_account_3.toString())
        assert(totalBalance.toString() == '100000000000000000000')
    })

    it('has an Ownership', async () => {
        const lottery = await Lottery.deployed()
        assert(await lottery.owner(), owner)
    })

    it('change Ownership', async () => {
        const accounts = await web3.eth.getAccounts()
        const lottery = await Lottery.deployed()
        const owner_last = await lottery.owner()
        await lottery.transferOwnership(accounts[1])
        const owner_new = await lottery.owner()
        assert(owner_last != owner_new)
    })

    it('renounce Ownership', async () => {
        const accounts = await web3.eth.getAccounts()
        const lottery = await Lottery.deployed()
        const owner_last = await lottery.owner()
        await lottery.renounceOwnership({ from: accounts[1] })
        const owner_new = await lottery.owner()
        assert(owner_last != owner_new)
    })

})