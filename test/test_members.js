const assert = require('assert');

const Members = artifacts.require('./Members.sol')

contract('Members', ([owner]) => {

    it('Should deploy smart contract', async () => {
        const members = await Members.deployed()
        assert(members.address !== '')
    })

    it('create mod', async () => {
        const accounts = await web3.eth.getAccounts()
        const members = await Members.deployed()
        await members.addMod(accounts[1])
        const member_check = await members.mod(accounts[1])
        assert(member_check)
    })

    it('remove mod', async () => {
        const accounts = await web3.eth.getAccounts()
        const members = await Members.deployed()
        await members.removeMod(accounts[1])
        const member_check = await members.mod(accounts[1])
        assert(member_check === false)
    })

    it('create support', async () => {
        const accounts = await web3.eth.getAccounts()
        const members = await Members.deployed()
        await members.addSupport(accounts[1])
        const member_check = await members.support(accounts[1])
        assert(member_check)
    })

    it('remove support', async () => {
        const accounts = await web3.eth.getAccounts()
        const members = await Members.deployed()
        await members.removeSupport(accounts[1])
        const member_check = await members.support(accounts[1])
        assert(member_check == false)
    })

    it('register 5 members', async () => {
        const accounts = await web3.eth.getAccounts()
        const members = await Members.deployed()
        await members.addMember(owner, owner)
        await members.addMember(accounts[1], owner)
        await members.addMember(accounts[2], accounts[1])
        await members.addMember(accounts[3], accounts[2])
        await members.addMember(accounts[4], accounts[3])
        const member_1 = await members.isMember(owner)
        const member_2 = await members.isMember(accounts[1])
        const member_3 = await members.isMember(accounts[2])
        const member_4 = await members.isMember(accounts[3])
        const member_5 = await members.isMember(accounts[4])
        assert(member_1 == true && member_2 == true && member_3 == true && member_4 == true && member_5 == true)
    })    

    it('has an Ownership', async () => {
        const members = await Members.deployed()
        assert(await members.owner(), owner)
    })

    it('change Ownership', async () => {
        const accounts = await web3.eth.getAccounts()
        const members = await Members.deployed()
        const owner_last = await members.owner()
        await members.transferOwnership(accounts[1])
        const owner_new = await members.owner()
        assert(owner_last != owner_new)
    })

    it('renounce Ownership', async () => {
        const accounts = await web3.eth.getAccounts()
        const members = await Members.deployed()
        const owner_last = await members.owner()
        await members.renounceOwnership({ from: accounts[1] })
        const owner_new = await members.owner()
        assert(owner_last != owner_new)
    })

})