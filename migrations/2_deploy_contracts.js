var RiddleContract = artifacts.require("./RiddleContract.sol");
var MintableToken = artifacts.require('./MintableToken.sol');

const AEAddresses = {
  'kovan': '0x35d8830ea35e6Df033eEdb6d5045334A4e34f9f9',
  'mainnet': '0x5ca9a71b1d01849c0a95490cc00559717fcf0d1d'
}

module.exports = async function(deployer, helper, accounts) {
  console.log(helper)
  if (helper === 'development') {
    try {
      await deployer.deploy(MintableToken).then((instance) => {})
      const mintableToken = await MintableToken.deployed()
      await mintableToken.mint(accounts[0], 100000000000000000000)
      await mintableToken.mint(accounts[1], 100000000000000000000)
      await deployer.deploy(RiddleContract, MintableToken.address)
    } catch (error) {
      console.log(error)
    }
  } else {
    try {
      await deployer.deploy(RiddleContract, AEAddresses[helper])
    } catch (error) {
      console.log(error)
    }
  }
}
