var RiddleContract = artifacts.require("./RiddleContract.sol");

module.exports = function(deployer, helper, accounts) {
  return deployer.deploy(RiddleContract)
}
