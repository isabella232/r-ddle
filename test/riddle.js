var RiddleContract = artifacts.require("RiddleContract");
var MintableToken = artifacts.require("MintableToken");

var utils = require('web3-utils')
contract('RiddleContract', function(accounts) {
    let riddle;

    beforeEach(async function() { 
        erc20 = await MintableToken.new();
        await erc20.mint(accounts[0], 100000000000000000000)
        await erc20.mint(accounts[1], 100000000000000000000)
        riddle = await RiddleContract.new(erc20.address);
    });
    
    describe("contract pure function", function() {
        it("hashAnswer should produce same hash as web3", async function() {
            const answer = 'An Egg.'
            const answerHash = utils.sha3(answer)
            const contractHash = await riddle.generateHash(answer);
            assert.equal(answerHash, contractHash);
        });
    });
    describe("approving token", function () {
        it("should update allowance", async function () {
            const amount  = 1000
            var tx = await erc20.approve(riddle.address, amount)
            var allowed = await erc20.allowance(accounts[0], riddle.address)
            assert.equal(allowed.toNumber(), amount);
        })
    })
    describe("adding a riddle", function() {
        it("should change riddle count", async function() {

            const question = 'I am a container with no sides and no lid, yet golden treasure lays inside. What am I?'
            const answer = 'An Egg.'
            const answerHash = utils.sha3(answer)
            const amount = 1000
            var initialRiddleCount = await riddle.getRiddleCount()
            assert.equal(initialRiddleCount.toNumber(), 0);

            const myBalance = await erc20.balanceOf(accounts[0])
            assert.equal(myBalance.toNumber(), 100000000000000000000);

            var tx = await erc20.approve(riddle.address, amount)
            await riddle.askRiddle(question, answerHash, amount)
            const subsequentRiddleCount = await riddle.getRiddleCount();
            assert.equal(subsequentRiddleCount.toNumber(), 1);
        });

        it("twice should fail", async function() {

            const question = 'I am a container with no sides and no lid, yet golden treasure lays inside. What am I?'
            const answer = 'An Egg.'
            const answerHash = utils.sha3(answer)
            const amount = 1000

            await erc20.approve(riddle.address, amount)
            await riddle.askRiddle(question, answerHash, amount)
            var riddleCount = await riddle.getRiddleCount();
            assert.equal(riddleCount.toNumber(), 1);

            await erc20.approve(riddle.address, amount)
            var tx = await riddle.askRiddle(question, answerHash, amount)
            assert.equal(utils.toBN(tx.receipt.status).toNumber(), 0);

            const subsequentRiddleCount = await riddle.getRiddleCount();
            assert.equal(subsequentRiddleCount.toNumber(), 1);
        });

        it("with no value should fail", async function() {
            const question = 'I am a container with no sides and no lid, yet golden treasure lays inside. What am I?'
            const answer = 'An Egg.'
            const answerHash = utils.sha3(answer)
            const amount = 0
            await erc20.approve(riddle.address, amount)
            var tx = await riddle.askRiddle(question, answerHash, amount)
            assert.equal(utils.toBN(tx.receipt.status).toNumber(), 0);
        })

        it("should return the same riddle by key", async function() {
            const question = 'I am a container with no sides and no lid, yet golden treasure lays inside. What am I?'
            const answer = 'An Egg.'
            const amount = 1000
            const answerHash = utils.sha3(answer)
            await erc20.approve(riddle.address, amount)
            var tx = await askQuestion(question, answerHash, amount)
            
            var riddleReturn = await riddle.getRiddleAtKey(0)

            riddleEquals(question, answer, amount, riddleReturn)
        })

        it("should return the same riddle by hash", async function() {
            const question = 'I am a container with no sides and no lid, yet golden treasure lays inside. What am I?'
            const answer = 'An Egg.'
            const amount = 1000
            const answerHash = utils.sha3(answer)
            const qa = utils.soliditySha3(question, answerHash)
            await erc20.approve(riddle.address, amount)
            var tx = await askQuestion(question, answerHash, amount)
            var riddleReturn = await riddle.getRiddleAtHash(qa)
            riddleEquals(question, answer, amount, riddleReturn)
        })
    });

    describe("answering a riddle", function() {
        it("should return the solved riddle", async function() {

            const question = 'I am a container with no sides and no lid, yet golden treasure lays inside. What am I?'
            const answer = 'An Egg.'
            const answerHash = utils.sha3(answer)
            const amount = 1000
            await erc20.approve(riddle.address, amount)
            await riddle.askRiddle(question, answerHash, amount)
            await riddle.answerRiddle(question, answer, {from: accounts[1]})

            var riddleReturn = await riddle.getRiddleAtKey(0)
            riddleEquals(question, answer, amount, riddleReturn, accounts[1])
        });
        it("should raise your balance by amount", async function() {

            const question = 'I am a container with no sides and no lid, yet golden treasure lays inside. What am I?'
            const answer = 'An Egg.'
            const answerHash = utils.sha3(answer)
            const amount = 10000000000000000

            await erc20.approve(riddle.address, amount)
            await riddle.askRiddle(question, answerHash, amount)

            const preBalance = await erc20.balanceOf(accounts[1])
            var tx = await riddle.answerRiddle(question, answer, {from: accounts[1]})

            const postBalance = await erc20.balanceOf(accounts[1])
            assert.equal(preBalance.add(amount).toNumber(), postBalance.toNumber())
        });
    })

    function riddleEquals (question, answer, amount, riddleReturn, solved = false) {
        const emptyAddress = '0x0000000000000000000000000000000000000000'

        var exists = riddleReturn[0] 
        assert.equal(exists, true);

        var solved = riddleReturn[1]
        assert.equal(solved, solved);

        var reward = riddleReturn[2].toNumber()
        assert.equal(reward, amount);

        var asker = riddleReturn[3]
        assert.equal(asker, accounts[0]);

        var solver = riddleReturn[4]
        assert.equal(solver, solved ? solver : emptyAddress);

        var q = riddleReturn[5]
        assert.equal(q, question);

        var a = riddleReturn[6]
        assert.equal(a, solved ? answer : '');
    }

    async function askQuestion (question, answerHash, amount) {

        return await riddle.askRiddle(question, answerHash, amount)
    }
});
