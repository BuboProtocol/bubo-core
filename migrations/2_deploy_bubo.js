const BuboToken = artifacts.require('./BuboToken.sol')

module.exports = async function (deployer) {
    await deployer.deploy(BuboToken)
}