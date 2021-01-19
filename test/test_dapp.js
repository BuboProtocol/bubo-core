const assert = require('assert')
const BigNumber = require('bignumber.js')

const Dapp = artifacts.require('./Dapp.sol')
const Members = artifacts.require('./Members.sol')
const Token = artifacts.require("./BuboToken.sol")
const MasterChef = artifacts.require('./MasterChef.sol')

contract('Dapp', ([owner]) => {

    it('Should deploy smart contract', async () => {
        const dapp = await Dapp.deployed()
        const members = await Members.deployed()
        const token = await Token.deployed()
        assert(dapp.address !== '' && members.address !== '' && token.address !== '')
    })

    it('create mod', async () => {
        const accounts = await web3.eth.getAccounts()
        const dapp = await Dapp.deployed()
        await dapp.addMod(accounts[1])
        const member_check = await dapp.mod(accounts[1])
        assert(member_check)
    })

    it('remove mod', async () => {
        const accounts = await web3.eth.getAccounts()
        const dapp = await Dapp.deployed()
        await dapp.removeMod(accounts[1])
        const member_check = await dapp.mod(accounts[1])
        assert(member_check === false)
    })

    it('create support', async () => {
        const accounts = await web3.eth.getAccounts()
        const dapp = await Dapp.deployed()
        await dapp.addSupport(accounts[1])
        const member_check = await dapp.support(accounts[1])
        assert(member_check)
    })

    it('remove support', async () => {
        const accounts = await web3.eth.getAccounts()
        const dapp = await Dapp.deployed()
        await dapp.removeSupport(accounts[1])
        const member_check = await dapp.support(accounts[1])
        assert(member_check == false)
    })

    it('register 5 referral members', async () => {
        const accounts = await web3.eth.getAccounts()
        const members = await Members.deployed()
        const dapp = await Dapp.deployed()
        await members.addMember(owner, owner)
        await members.addMember(accounts[1], owner)
        await members.addMember(accounts[2], accounts[1])
        await members.addMember(accounts[3], accounts[2])
        await members.addMember(accounts[4], accounts[3])
        await dapp.setKYC(accounts[0], true)
        await dapp.setKYC(accounts[1], true)
        await dapp.setKYC(accounts[2], true)
        await dapp.setKYC(accounts[3], true)
        await dapp.setKYC(accounts[4], true)
        const member_1 = await members.isMember(owner)
        const member_2 = await members.isMember(accounts[1])
        const member_3 = await members.isMember(accounts[2])
        const member_4 = await members.isMember(accounts[3])
        const member_5 = await members.isMember(accounts[4])
        const kyc_1 = await dapp.kyc(accounts[0])
        const kyc_2 = await dapp.kyc(accounts[1])
        const kyc_3 = await dapp.kyc(accounts[2])
        const kyc_4 = await dapp.kyc(accounts[3])
        const kyc_5 = await dapp.kyc(accounts[4])
        assert(member_1 == true && member_2 == true && member_3 == true && member_4 == true && member_5 == true && kyc_1 == true && kyc_2 == true && kyc_3 == true && kyc_4 == true && kyc_5 == true)
    })

    it('Change owner Token', async () => {
        const token = await Token.deployed()
        const masterchef = await MasterChef.deployed()
        await token.transferOwnership(masterchef.address)
        const ownerNew = await token.owner()
        assert(ownerNew == MasterChef.address)
    })

    it('Change address dapp in masterchef', async () => {
        const masterchef = await MasterChef.deployed()
        const dapp = await Dapp.deployed()
        await masterchef.dapp(dapp.address)
        const dappaddr = await masterchef.dappaddr.call()
        assert(dappaddr == dapp.address)
    })

    it('set tokens for airdrop', async () => {
        const dapp = await Dapp.deployed()
        let tokens_last_1 = await dapp.getTokentForAirDrop(0)
        let tokens_last_2 = await dapp.getTokentForAirDrop(1)
        let tokens_last_3 = await dapp.getTokentForAirDrop(2)
        let tokens_1 = new BigNumber((25 * (10 ** 18)))
        let tokens_2 = new BigNumber((15 * (10 ** 18)))
        let tokens_3 = new BigNumber((5 * (10 ** 18)))
        await dapp.setAirDrop(tokens_1, tokens_2, tokens_3)
        let tokens_new_1 = await dapp.getTokentForAirDrop(0)
        let tokens_new_2 = await dapp.getTokentForAirDrop(1)
        let tokens_new_3 = await dapp.getTokentForAirDrop(2)
        assert(tokens_last_1 != tokens_new_1 && tokens_last_2 != tokens_new_2 && tokens_last_3 != tokens_new_3)
    })    

    it('set pause for airdrop', async () => {
        const dapp = await Dapp.deployed()
        let status_last = false
        await dapp.setPausedAirDrop(status_last)
        let status_new = await dapp.airdrop_paused()
        assert(status_last == status_new)
    })   

    it('register user by support', async () => {
        const accounts = await web3.eth.getAccounts()
        const members = await Members.deployed()
        const dapp = await Dapp.deployed()
        await dapp.addSupport(accounts[0])
        await members.addSupport(dapp.address)
        await dapp.addMod(accounts[0])
        await members.addMod(dapp.address)        
        await dapp.registerSupport(accounts[4], accounts[5])
        const user_check = await members.isMember(accounts[5])
        await dapp.setKYC(accounts[5], true)
        const kyc_check_1 = await dapp.kyc(accounts[5])
        assert(user_check == true && kyc_check_1 == true)
    })

    it('register user by user', async () => {
        const accounts = await web3.eth.getAccounts()
        const members = await Members.deployed()
        const dapp = await Dapp.deployed()
        await dapp.register(accounts[5], {from: accounts[6]})
        const user_check = await members.isMember(accounts[6])
        assert(user_check == true)
    })
    
    it('validate kyc user', async () => {
        const accounts = await web3.eth.getAccounts()
        const dapp = await Dapp.deployed()
        await dapp.setKYC(accounts[6], true)
        const kyc_check_2 = await dapp.kyc(accounts[6])
        assert(kyc_check_2 == true)
    })

    it('validate tokens for airdrop', async () => {
        const accounts = await web3.eth.getAccounts()
        const dapp = await Dapp.deployed()
        const token = await Token.deployed()
        const members = await Members.deployed()        
        const user_1 = await members.getParentTree(accounts[5], 3)
        const account_1 = accounts[5]
        const account_2 = user_1[0]
        const account_3 = user_1[1]
        const account_4 = user_1[2]
        const balance_account_1 = await token.balanceOf.call(account_1)
        const balance_account_2 = await token.balanceOf.call(account_2)
        const balance_account_3 = await token.balanceOf.call(account_3)
        const balance_account_4 = await token.balanceOf.call(account_4)
        assert(balance_account_1.toString() == '25000000000000000000' && balance_account_2.toString() == '40000000000000000000' && balance_account_3.toString() == '20000000000000000000' && balance_account_4.toString() == '5000000000000000000')
    })

    it('has an Ownership', async () => {
        const dapp = await Dapp.deployed()
        assert(await dapp.owner(), owner)
    })

    it('change Ownership', async () => {
        const accounts = await web3.eth.getAccounts()
        const dapp = await Dapp.deployed()
        const owner_last = await dapp.owner()
        await dapp.transferOwnership(accounts[1])
        const owner_new = await dapp.owner()
        assert(owner_last != owner_new)
    })

    it('renounce Ownership', async () => {
        const accounts = await web3.eth.getAccounts()
        const dapp = await Dapp.deployed()
        const owner_last = await dapp.owner()
        await dapp.renounceOwnership({ from: accounts[1] })
        const owner_new = await dapp.owner()
        assert(owner_last != owner_new)
    })

})