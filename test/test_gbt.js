const assert = require('assert');

const Token = artifacts.require("./GBTToken.sol")
const Bubo = artifacts.require("./BuboToken.sol")

contract('GBTToken', ([owner]) => {

    it('Should deploy smart contract', async () => {
        const token = await Token.deployed()
        assert(token.address !== '')
    })

    it('get balance owner token', async () => {
        const token = await Token.deployed()
        const balance = await token.balanceOf.call(owner)
        assert('0', balance.toString())
    })

    it('transfer tokens', async () => {
        const accounts = await web3.eth.getAccounts()
        const token = await Token.deployed()
        const balance_last = await token.balanceOf.call(owner)
        await token.mint(owner, 100)
        await token.transfer(accounts[1], 100)
        const balance_new = await token.balanceOf.call(accounts[1])
        assert(balance_last.toString() != balance_new.toString() && balance_new.toString() == '100')
    })

    it('transferFrom tokens', async () => {
        const accounts = await web3.eth.getAccounts()
        const token = await Token.deployed()
        await token.mint(owner, 100)
        const balance_last = await token.balanceOf.call(owner)
        await token.approve(accounts[2], 100)
        await token.transferFrom(owner, accounts[2], 100, { from: accounts[2] })
        const balance_new = await token.balanceOf.call(accounts[2])
        assert(balance_last.toString() == balance_new.toString() && balance_new.toString() == '100')
    })

    it('transfer Bubo tokens', async () => {
        const accounts = await web3.eth.getAccounts()
        const token = await Token.deployed()
        const bubo = await Bubo.deployed()
        await bubo.mint(token.address, 100)
        const balance_last = await bubo.balanceOf.call(token.address)
        await token.safeBuboTransfer(accounts[3], 100);
        const balance_new = await bubo.balanceOf.call(accounts[3])
        assert(balance_last.toString() == balance_new.toString() && balance_new.toString() == '100')
    })    

    it('burn tokens', async () => {
        const token = await Token.deployed()
        await token.mint(owner, 100)
        const balance_last = await token.balanceOf.call(owner)
        await token.burn(owner, 100)
        const balance_new = await token.balanceOf.call(owner)
        assert(balance_last.toString() != balance_new.toString())
    })

    it('has an Ownership', async () => {
        const token = await Token.deployed()
        assert(await token.owner(), owner)
    })

    it('change Ownership', async () => {
        const accounts = await web3.eth.getAccounts()
        const token = await Token.deployed()
        await token.transferOwnership(accounts[2])
        const ownerNew = await token.owner()
        assert(ownerNew == accounts[2])
    })

    it('renounce Ownership', async () => {
        const accounts = await web3.eth.getAccounts()
        const token = await Token.deployed()
        const owner_last = await token.owner()
        await token.renounceOwnership({ from: accounts[2] })
        const owner_new = await token.owner()
        assert(owner_last != owner_new)
    })

})