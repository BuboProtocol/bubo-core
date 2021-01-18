

const MasterChef = artifacts.require('./MasterChef.sol')
const GBTToken = artifacts.require('./GBTToken.sol')
const Lottery = artifacts.require('./Lottery.sol')

module.exports = async function (deployer) {
    const gBTToken = await GBTToken.deployed()
    const masterChef = await MasterChef.deployed()
    await deployer.deploy(Lottery, gBTToken.address, masterChef.address)
}