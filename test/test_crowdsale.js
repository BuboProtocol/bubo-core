const assert = require('assert');
const BigNumber = require('bignumber.js')

const CrowdSale = artifacts.require('./CrowdSale.sol')
const Token = artifacts.require("./BuboToken.sol")
const Members = artifacts.require('./Members.sol')
const MasterChef = artifacts.require('./MasterChef.sol')
const GBTToken = artifacts.require('./GBTToken.sol')

contract('CrowdSale', ([owner]) => {

    it('Should deploy smart contract', async () => {
        const crowdSale = await CrowdSale.deployed()
        assert(crowdSale.address !== '')
    })

    it('create mod', async () => {
        const accounts = await web3.eth.getAccounts()
        const crowdSale = await CrowdSale.deployed()
        await crowdSale.addMod(accounts[1])
        const member_check = await crowdSale.mod(accounts[1])
        assert(member_check)
    })

    it('remove mod', async () => {
        const accounts = await web3.eth.getAccounts()
        const crowdSale = await CrowdSale.deployed()
        await crowdSale.removeMod(accounts[1])
        const member_check = await crowdSale.mod(accounts[1])
        assert(member_check === false)
    })

    it('create support', async () => {
        const accounts = await web3.eth.getAccounts()
        const crowdSale = await CrowdSale.deployed()
        await crowdSale.addSupport(accounts[1])
        const member_check = await crowdSale.support(accounts[1])
        assert(member_check)
    })

    it('remove support', async () => {
        const accounts = await web3.eth.getAccounts()
        const crowdSale = await CrowdSale.deployed()
        await crowdSale.removeSupport(accounts[1])
        const member_check = await crowdSale.support(accounts[1])
        assert(member_check == false)
    })

    it('set address payment', async () => {
        const accounts = await web3.eth.getAccounts()
        const crowdSale = await CrowdSale.deployed()
        let _last = accounts[1]
        await crowdSale.addressPayment(_last)
        let _new = await crowdSale.payment()
        assert(_last == _new)
    }) 

    it('create Stage', async () => {
        const crowdSale = await CrowdSale.deployed()
        const stage_last = await crowdSale._stage()
        const myDate = new Date()
        const date_start = Math.floor(myDate.getTime() / 1000) - (10 * 86400)
        const date_end = Math.floor(myDate.getTime() / 1000) + (30 * 86400)
        await crowdSale.createStage(
            new BigNumber((1 * (10 ** 18))), //_min
            new BigNumber((100 * (10 ** 18))), //_max
            date_start, //_start
            date_end, //_end
            new BigNumber((9 * (10 ** 18))), //_price
            new BigNumber((3 * (10 ** 18))), //_member_1
            new BigNumber((2 * (10 ** 18))), //_member_2
            new BigNumber((1 * (10 ** 18))), //_member_3
            new BigNumber((25 * (10 ** 18))), //_bonus_token
            new BigNumber((25 * (10 ** 18))), //_bonus_gbt
            false // _disable others stages
        )
        const stage_new = await crowdSale._stage()
        assert(stage_last.toString() == '0' && stage_new.toString() == '1')
    })

    it('register 5 referral members', async () => {
        const accounts = await web3.eth.getAccounts()
        const members = await Members.deployed()
        await members.addMember(owner, owner)
        await members.addMember(accounts[1], owner)
        await members.addMember(accounts[2], accounts[1])
        await members.addMember(accounts[3], accounts[2])
        await members.addMember(accounts[4], accounts[3])
        await members.addMember(accounts[5], accounts[4])
        const member_1 = await members.isMember(owner)
        const member_2 = await members.isMember(accounts[1])
        const member_3 = await members.isMember(accounts[2])
        const member_4 = await members.isMember(accounts[3])
        const member_5 = await members.isMember(accounts[4])
        const member_6 = await members.isMember(accounts[5])
        assert(member_1 == true && member_2 == true && member_3 == true && member_4 == true && member_5 == true && member_6 == true)
    })  

    it('Change owner Token', async () => {
        const masterchef = await MasterChef.deployed()
        const token = await Token.deployed()
        const gbtToken = await GBTToken.deployed()
        await token.transferOwnership(masterchef.address)
        await gbtToken.transferOwnership(masterchef.address)
        const ownerNew = await token.owner()
        assert(ownerNew == MasterChef.address)
    })

    it('Change address crowdsale', async () => {
        const masterchef = await MasterChef.deployed()
        const crowdSale = await CrowdSale.deployed()
        await masterchef.crowdsale(crowdSale.address)
        const crowdsaleddr = await masterchef.crowdsaleddr.call()
        assert(crowdsaleddr == crowdSale.address)
    })    

    it('buy tokens', async () => {
        const accounts = await web3.eth.getAccounts()
        const crowdSale = await CrowdSale.deployed()
        const token = await Token.deployed()
        const gbtToken = await GBTToken.deployed()
        const members = await Members.deployed()
        const balance_account_last = await token.balanceOf.call(accounts[6])
        await crowdSale.buyTokens(accounts[5], {from: accounts[6], value: new BigNumber((1 * (10 ** 18)))})
        await crowdSale.buyTokens(accounts[5], {from: accounts[6], value: new BigNumber((5 * (10 ** 18)))})
        await crowdSale.buyTokens(accounts[5], {from: accounts[6], value: new BigNumber((10 * (10 ** 18)))})
        const balance_account_new = await token.balanceOf.call(accounts[6])
        const user = await members.getParentTree(accounts[6], 3)
        const balance_user_1 = await token.balanceOf.call(user[0])
        const balance_user_2 = await token.balanceOf.call(user[1])
        const balance_user_3 = await token.balanceOf.call(user[2])
        const balance_gbt_6 = await gbtToken.balanceOf.call(accounts[6])
        assert(balance_account_last.toString() == '0' && balance_account_new.toString() == '180000000000000000000' && balance_user_1.toString() == '4320000000000000000' && balance_user_2.toString() == '2880000000000000000' && balance_user_3.toString() == '1440000000000000000' && balance_gbt_6.toString() == '36000000000000000000')
    })

    it('buy tokens fiat', async () => {
        const accounts = await web3.eth.getAccounts()
        const crowdSale = await CrowdSale.deployed()
        const token = await Token.deployed()
        const gbtToken = await GBTToken.deployed()
        const members = await Members.deployed()
        const balance_account_last = await token.balanceOf.call(accounts[6])
        await crowdSale.buyTokensFiat(accounts[5], accounts[6], new BigNumber((1 * (10 ** 18))))
        await crowdSale.buyTokensFiat(accounts[5], accounts[6], new BigNumber((5 * (10 ** 18))))
        await crowdSale.buyTokensFiat(accounts[5], accounts[6], new BigNumber((10 * (10 ** 18))))
        const balance_account_new = await token.balanceOf.call(accounts[6])
        const user = await members.getParentTree(accounts[6], 3)
        const balance_user_1 = await token.balanceOf.call(user[0])
        const balance_user_2 = await token.balanceOf.call(user[1])
        const balance_user_3 = await token.balanceOf.call(user[2])
        const balance_gbt_6 = await gbtToken.balanceOf.call(accounts[6])
        assert(balance_account_last.toString() == '180000000000000000000' && balance_account_new.toString() == '360000000000000000000' && balance_user_1.toString() == '8640000000000000000' && balance_user_2.toString() == '5760000000000000000' && balance_user_3.toString() == '2880000000000000000' && balance_gbt_6.toString() == '72000000000000000000')
    })

    it('withdraw excess', async () => {
        const crowdSale = await CrowdSale.deployed()
        await crowdSale.withdrawExcess()
        const balance_coin_new = await web3.eth.getBalance(crowdSale.address)
        assert(balance_coin_new.toString() == '0')
    })

    it('has an Ownership', async () => {
        const crowdSale = await CrowdSale.deployed()
        assert(await crowdSale.owner(), owner)
    })

    it('change Ownership', async () => {
        const accounts = await web3.eth.getAccounts()
        const crowdSale = await CrowdSale.deployed()
        const owner_last = await crowdSale.owner()
        await crowdSale.transferOwnership(accounts[1])
        const owner_new = await crowdSale.owner()
        assert(owner_last != owner_new)
    })

    it('renounce Ownership', async () => {
        const accounts = await web3.eth.getAccounts()
        const crowdSale = await CrowdSale.deployed()
        const owner_last = await crowdSale.owner()
        await crowdSale.renounceOwnership({ from: accounts[1] })
        const owner_new = await crowdSale.owner()
        assert(owner_last != owner_new)
    })

})