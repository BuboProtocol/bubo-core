const Members = artifacts.require('./Members.sol')

module.exports = async function (deployer) {
    await deployer.deploy(Members)
}