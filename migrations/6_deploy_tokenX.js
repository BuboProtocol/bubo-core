//const TokenX = artifacts.require('./TokenX.sol')
const TokenX = artifacts.require('./libraries/TokenX.sol')

module.exports = async function (deployer) {
    await deployer.deploy(TokenX)
}