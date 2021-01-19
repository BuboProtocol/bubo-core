

const MasterChef = artifacts.require('./MasterChef.sol')
const Dapp = artifacts.require('./Dapp.sol')
const Members = artifacts.require('./Members.sol')

module.exports = async function (deployer) {
    const members = await Members.deployed()
    const masterChef = await MasterChef.deployed()
    await deployer.deploy(Dapp, members.address, masterChef.address)
}