const Token = artifacts.require("./BuboToken.sol")
const Members = artifacts.require('./Members.sol')
const CrowdSale = artifacts.require('./CrowdSale.sol')
const MasterChef = artifacts.require('./MasterChef.sol')

module.exports = async function (deployer) {
    const token = await Token.deployed()
    const members = await Members.deployed()
    const masterChef = await MasterChef.deployed()
    await deployer.deploy(CrowdSale, token.address, members.address, masterChef.address, process.env.WBNB)
    const crowdSale = await CrowdSale.deployed()
    await members.addMod(crowdSale.address)
    await members.addSupport(crowdSale.address)    
}