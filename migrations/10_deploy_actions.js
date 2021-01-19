const BigNumber = require('bignumber.js')
const BuboToken = artifacts.require("./BuboToken.sol")
const GBTToken = artifacts.require('./GBTToken.sol')
const Members = artifacts.require('./Members.sol')
const CrowdSale = artifacts.require('./CrowdSale.sol')
const Lottery = artifacts.require("./Lottery.sol")
const MasterChef = artifacts.require('./MasterChef.sol')
const Dapp = artifacts.require('./Dapp.sol')

module.exports = async function (deployer) {
    const buboToken = await BuboToken.deployed()
    const gbtToken = await GBTToken.deployed()
    const members = await Members.deployed()
    const crowdsale = await CrowdSale.deployed()
    const lottery = await Lottery.deployed()
    const masterchef = await MasterChef.deployed()
    const dapp = await Dapp.deployed()

    if (parseInt(process.env.DEPLOY_ACTIONS) == 1) {

        await members.addMod(dapp.address)
        await members.addSupport(dapp.address)
        await members.addMod(masterchef.address)
        await members.addSupport(masterchef.address)
        await members.addMod(crowdsale.address)
        await members.addSupport(crowdsale.address)
        await members.addMod(process.env.DEV_ADDRESS)
        await members.addSupport(process.env.DEV_ADDRESS)
        await members.addMember(process.env.DEV_ADDRESS, process.env.DEV_ADDRESS)

        await crowdsale.addMod(process.env.DEV_ADDRESS)
        await crowdsale.addSupport(process.env.DEV_ADDRESS)
        await crowdsale.addressPayment(process.env.DEV_ADDRESS)

        await dapp.addMod(process.env.DEV_ADDRESS)
        await dapp.addSupport(process.env.DEV_ADDRESS)
        await dapp.setAirDrop(new BigNumber((5 * (10 ** 18))), new BigNumber((3 * (10 ** 18))), new BigNumber((2 * (10 ** 18))))
        await dapp.setKYC(process.env.DEV_ADDRESS, true);

        await lottery.addMod(process.env.DEV_ADDRESS)
        await lottery.addSupport(process.env.DEV_ADDRESS)
        await lottery.setFinishedCount(1000)
        await lottery.setTurns(10)
        await lottery.addressPayment(process.env.DEV_ADDRESS)
        await lottery.setPercent(40, 20, 15, 10, 8, 7)

        await buboToken.mint(process.env.DEV_ADDRESS, web3.utils.toWei(process.env.TOKENS_FARM_MINT))
        await buboToken.transferOwnership(masterchef.address)

        await gbtToken.mint(process.env.DEV_ADDRESS, web3.utils.toWei(process.env.TOKENS_FARM_MINT))
        await gbtToken.transferOwnership(masterchef.address)

        await masterchef.setPercent(new BigNumber((3 * (10 ** 18))), new BigNumber((2 * (10 ** 18))), new BigNumber((1 * (10 ** 18))))
        await masterchef.dapp(dapp.address)
        await masterchef.crowdsale(crowdsale.address)
        await masterchef.lottery(lottery.address)

        if (parseInt(process.env.TRANSFER_OWNER_TO_DEV) == 1) {
            await members.transferOwnership(process.env.DEV_ADDRESS)
            await crowdsale.transferOwnership(process.env.DEV_ADDRESS)
            await dapp.transferOwnership(process.env.DEV_ADDRESS)
            await lottery.transferOwnership(process.env.DEV_ADDRESS)
            await masterchef.transferOwnership(process.env.DEV_ADDRESS)
        }

    }


}