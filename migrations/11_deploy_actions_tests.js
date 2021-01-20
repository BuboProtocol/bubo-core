const BigNumber = require('bignumber.js')
const Members = artifacts.require('./Members.sol')
const CrowdSale = artifacts.require('./CrowdSale.sol')
const Lottery = artifacts.require("./Lottery.sol")
const MasterChef = artifacts.require('./MasterChef.sol')
const TokenX = artifacts.require('./libraries/TokenX.sol')

module.exports = async function (deployer) {
    const crowdsale = await CrowdSale.deployed()
    const lottery = await Lottery.deployed()
    const masterchef = await MasterChef.deployed()
    const tokenX = await TokenX.deployed()

    if (parseInt(process.env.DEPLOY_ACTIONS_TEST) == 1) {

        const myDate = new Date()
        const date_start = Math.floor(myDate.getTime() / 1000) - (10 * 86400)
        const date_end = Math.floor(myDate.getTime() / 1000) + (30 * 86400)
        const x = (n) => new BigNumber(n * (10 ** 18))
        await crowdsale.createStage(x(0.1), x(100), x(10000), date_start, date_end, x(9), x(3), x(2), x(1))
    
        const accounts = await web3.eth.getAccounts()
        const members = await Members.deployed()
    
        await members.addMember(accounts[1], accounts[0])
        await members.addMember(accounts[2], accounts[0])
        await members.addMember(accounts[3], accounts[0])
        await members.addMember(accounts[4], accounts[0])
    
        await members.addMember(accounts[5], accounts[1])
        await members.addMember(accounts[6], accounts[1])
        await members.addMember(accounts[7], accounts[1])
    
        await members.addMember(accounts[8], accounts[5])
        await members.addMember(accounts[9], accounts[5])
        await members.addMember(accounts[10], accounts[5])
    
        await members.addMember(accounts[11], accounts[7])
        await members.addMember(accounts[12], accounts[7])
    
        await members.addMember(accounts[13], accounts[11])
    
        await lottery.setFinishedCount(100)
        await lottery.setTurns(100)
    
        await masterchef.add(1000, tokenX.address, false)

    }


}