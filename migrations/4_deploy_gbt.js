const GBTToken = artifacts.require('./GBTToken.sol')
const BuboToken = artifacts.require('./BuboToken.sol')

module.exports = async function (deployer) {
    const buboToken = await BuboToken.deployed()
    await deployer.deploy(GBTToken, buboToken.address)
}