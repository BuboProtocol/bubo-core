const TokenX = artifacts.require('./TokenX.sol')

module.exports = async function (deployer) {
    await deployer.deploy(TokenX)
}