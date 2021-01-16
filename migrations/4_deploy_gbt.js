const GBTToken = artifacts.require('./GBTToken.sol')

module.exports = async function (deployer) {
    await deployer.deploy(GBTToken, "")
}