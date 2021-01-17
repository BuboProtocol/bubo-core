const MasterChef = artifacts.require('./MasterChef.sol')
const GBTToken = artifacts.require('./GBTToken.sol')
const BuboToken = artifacts.require('./BuboToken.sol')
const Members = artifacts.require('./Members.sol')

module.exports = async function (deployer) {
    const gbtToken = await GBTToken.deployed()
    const buboToken = await BuboToken.deployed()
    const members = await Members.deployed()
    await deployer.deploy(
        MasterChef, 
        buboToken.address, // Bubo address
        gbtToken.address, // GBT address
        members.address, // Members address
        process.env.DEV_ADDRESS, // Your address where you get bubo tokens - should be a multisig
        web3.utils.toWei(process.env.TOKENS_PER_BLOCK), // Number of tokens rewarded per block, e.g., 100
        process.env.START_BLOCK // Block number when token mining starts
    )
}