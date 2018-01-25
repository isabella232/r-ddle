var RiddleContract = artifacts.require("RiddleContract");
var utils = require('web3-utils')
contract('RiddleContract', function(accounts) {
    let riddle;

    beforeEach(async function() { 
        riddle = await RiddleContract.new();
    });
    
    describe("contract pure function", function() {
        it("hashAnswer should produce same hash as web3", async function() {
            const answer = 'An Egg.'
            const answerHash = utils.sha3(answer)
            const contractHash = await riddle.generateHash(answer);
            assert.equal(answerHash, contractHash);
        });
    });
    describe("adding a riddle", function() {
        it("should change riddle count", async function() {

            const question = 'I am a container with no sides and no lid, yet golden treasure lays inside. What am I?'
            const answer = 'An Egg.'
            const answerHash = utils.sha3(answer)

            var initialRiddleCount = await riddle.getRiddleCount()
            assert.equal(initialRiddleCount.toNumber(), 0);
            await riddle.askRiddle(question, answerHash, {from: accounts[0], value: 1000})
            const subsequentRiddleCount = await riddle.getRiddleCount();
            assert.equal(subsequentRiddleCount.toNumber(), 1);
        });

        it("twice should fail", async function() {

            const question = 'I am a container with no sides and no lid, yet golden treasure lays inside. What am I?'
            const answer = 'An Egg.'
            const answerHash = utils.sha3(answer)

            await riddle.askRiddle(question, answerHash, {from: accounts[0], value: 1000})
            var riddleCount = await riddle.getRiddleCount();
            assert.equal(riddleCount.toNumber(), 1);

            var tx = await riddle.askRiddle(question, answerHash, {from: accounts[0], value: 1000})
            assert.equal(utils.toBN(tx.receipt.status).toNumber(), 0);

            const subsequentRiddleCount = await riddle.getRiddleCount();
            assert.equal(subsequentRiddleCount.toNumber(), 1);
        });

        it("with no value should fail", async function() {
            const question = 'I am a container with no sides and no lid, yet golden treasure lays inside. What am I?'
            const answer = 'An Egg.'
            const answerHash = utils.sha3(answer)
            const amount = 0
            var tx = await askQuestion(question, answerHash, amount)

            assert.equal(utils.toBN(tx.receipt.status).toNumber(), 0);
        })

        it("should return the same riddle by key", async function() {
            const question = 'I am a container with no sides and no lid, yet golden treasure lays inside. What am I?'
            const answer = 'An Egg.'
            const amount = 1000
            const answerHash = utils.sha3(answer)
            var tx = await askQuestion(question, answerHash, amount)
            
            var riddleReturn = await riddle.getRiddleAtKey(0)

            riddleEquals(question, answer, amount, riddleReturn)
        })

        it("should return the same riddle by hash", async function() {
            var question = 'I am a container with no sides and no lid, yet golden treasure lays inside. What am I?'
            const answer = 'An Egg.'
            const amount = 1000
            const answerHash = utils.sha3(answer)

            const qa = utils.soliditySha3(question, answerHash)
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

            await riddle.askRiddle(question, answerHash, {from: accounts[0], value: amount})
            await riddle.answerRiddle(question, answer, {from: accounts[1]})

            var riddleReturn = await riddle.getRiddleAtKey(0)
            riddleEquals(question, answer, amount, riddleReturn, accounts[1])
        });
        it("should raise your balance by amount", async function() {

            const question = 'I am a container with no sides and no lid, yet golden treasure lays inside. What am I?'
            const answer = 'An Egg.'
            const answerHash = utils.sha3(answer)
            const amount = 10000000000000000

            await riddle.askRiddle(question, answerHash, {from: accounts[0], value: amount})

            const preBalance = web3.eth.getBalance(accounts[1])

            var tx = await riddle.answerRiddle(question, answer, {from: accounts[1]})

            const gasPrice = 100000000000
            const gasUsed = tx.receipt.gasUsed * gasPrice
            const postBalance = web3.eth.getBalance(accounts[1])
            assert.equal(preBalance.add(amount).minus(gasUsed).toNumber(), postBalance.toNumber())
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

        return await riddle.askRiddle(question, answerHash, {from: accounts[0], value: amount})
    }
});
