const MasterChef = artifacts.require('./MasterChef.sol')

module.exports = async function (deployer) {
    await deployer.deploy(
        MasterChef, 
        "", // Bubo address
        "", // GBT address
        "", // Members address
        process.env.DEV_ADDRESS, // Your address where you get bubo tokens - should be a multisig
        web3.utils.toWei(process.env.TOKENS_PER_BLOCK), // Number of tokens rewarded per block, e.g., 100
        process.env.START_BLOCK // Block number when token mining starts
    )
}