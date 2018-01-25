
import RiddleContractArtifacts from '../../build/contracts/RiddleContract.json'

import Web3 from 'web3'
const BN = Web3.utils.BN
import ZeroClientProvider from 'web3-provider-engine/zero.js'
import IdManagerProvider from '@aeternity/id-manager-provider'
const MicroEvent = require("microevent");

class RiddleContract {
  constructor (options) {

    this.RiddleContract = null
    this.network = null
    this.pollingInterval = null
    this.account = null
    this.unlocked = false
    this.balanceWei = 0
    this.balance = 0
    this.address = null
    this.genesisBlock = 0
    this.loading = false
    this.options = {
      autoInit: true,
      getPastEvents: false,
      watchFutureEvents: false,
      connectionRetries: 3
    }
    Object.assign(this.options, options)
    if (this.options.autoInit) this.initWeb3()
  }

  // hello world : )
  helloWorld () {
    console.log('hello world!')
  }

  /*
   * Connect
   */

  initWeb3 () {
    return new Promise((resolve, reject) => {

      let web3Provider = false
      let idManager = new IdManagerProvider()

      idManager.checkIdManager().then((idManagerPresent)=>{
        if (idManagerPresent) {
          // check for aedentity app
          web3Provider = idManager.web3.currentProvider

        } else if (global.web3) {
          // check for metamask
          web3Provider = web3.currentProvider

        } else if (this.options.connectionRetries > 0){
          // attempt to try again if no aedentity app or metamask
          this.options.connectionRetries -= 1
          setTimeout(() => {
            this.initWeb3().then(resolve).catch((error) => {
              reject(new Error(error))
            })
          }, 1000)
        } else {
          // revert to a read only version using infura endpoint
          this.readOnly = true
          web3Provider = ZeroClientProvider({
            getAccounts: function(){},
            // rpcUrl: 'https://mainnet.infura.io',
            // rpcUrl: 'https://testnet.infura.io',
            // rpcUrl: 'https://rinkeby.infura.io',
            rpcUrl: 'https://kovan.infura.io'
          })
        }

        if (web3Provider) {
          global.web3 = new Web3(web3Provider)
          this.startChecking()

          if (this.options.getPastEvents) this.getPastEvents()
          if (this.options.watchFutureEvents) this.watchFutureEvents()
        }
      })
    })
  }

  /*
   * Check every second for switching network or wallet
   */

  startChecking () {
    if (this.pollingInterval) clearInterval(this.pollingInterval)
    this.getGenesisBlock()
    .then(() => {
      this.check()
      // this.pollingInterval = setInterval(this.check.bind(this), 1000)
    })
    .catch((err) => {
      throw new Error(err)
    })
  }

  check () {
    this.checkNetwork()
    .then(this.checkAccount.bind(this))
    .catch((error) => {
      console.error(error)
      throw new Error(error)
    })
  }

  checkNetwork () {
    return new Promise((resolve, reject) => {
      if (!global.web3) return reject()
      global.web3.eth.net.getId((err, netId) => {
        console.log(netId)
        if (err) {
          reject(new Error(err))
        } else if (this.network !== netId) {
          this.network = netId
          this.deployContract().then(() => {
            this.trigger('networkChange');
            resolve()
          })
        }
      })
    })


  }

  deployContract () {
    return new Promise ((resolve, reject) => {
      console.log(this.network, RiddleContractArtifacts.networks)
      if (!this.address && this.network && RiddleContractArtifacts.networks[this.network]) {
        this.address = RiddleContractArtifacts.networks[this.network].address
      } else if (!this.address) {
         return reject(new Error('Please provide a contract address'))
      }
      this.RiddleContract = new global.web3.eth.Contract(RiddleContractArtifacts.abi, this.address)
      resolve()
    })
  }

  checkAccount () {
    return global.web3.eth.getAccounts((error, accounts) => {
      if (error) throw new Error(error)
      if (accounts.length && this.account !== accounts[0]) {
        this.unlocked = true
        this.account = accounts[0]
        this.trigger('accountChange')
      } else if (!accounts.length) {
        this.unlocked = false
        this.account = null
        this.trigger('accountChange')
      }
    })
  }


  /*
   * Not Yet Implemented vvvv
   */

  getGenesisBlock () {
    return new Promise((resolve, reject) => {
      resolve()
    })
  }

  getPastEvents () {
    return new Promise((resolve, reject) => {
      resolve()
    })
  }

  watchFutureEvents () {
    return new Promise((resolve, reject) => {
      resolve()
    })
  }




  /*
   *
   * Constant Functions
   *
   */

  generateHash (answer) {
    return this.RiddleContract.methods.generateHash().call()
      .then((resp) => {
      console.log(resp)
      return resp
    }).catch((err) => {
      console.error(err)
    })
  }
  getRiddleCount () {
    return this.RiddleContract.methods.getRiddleCount().call()
      .then((resp) => {
      console.log(resp)
      return resp
    }).catch((err) => {
      console.error(err)
    })
  }
  getRiddleAtKey (key) {
    return this.RiddleContract.methods.getRiddleAtKey(new BN(key, 10)).call()
      .then((resp) => {
      console.log(resp)
      return resp
    }).catch((err) => {
      console.error(err)
    })
  }
  getRiddleAtHash (answerHash) {
    return this.RiddleContract.methods.getRiddleAtHash(answerHash).call()
      .then((resp) => {
      console.log(resp)
      return resp
    }).catch((err) => {
      console.error(err)
    })
  }

  /*
   *
   * Transaction Functions
   *
   */

  askRiddle (question, answerHash, reward) {
    reward = Web3.utils.toWei(reward)
    console.log(question, answerHash, reward)
    if (!this.account) return new Error('Unlock Wallet')
    return this.RiddleContract.methods.askRiddle(question, answerHash).send({from: this.account, value: reward})
    .on('transactionHash', (hash) => {
      console.log(hash)
      this.loading = true
    })
    .then((resp) => {
      this.loading = false
      console.log(resp)
      return resp
    }).catch((err) => {
      this.loading = false
      console.error(err)
    })
  }
  answerRiddle (question, answer) {
    console.log(answer)
    if (!this.account) return new Error('Unlock Wallet')
    return this.RiddleContract.methods.answerRiddle(question, answer).send({from: this.account})
    .on('transactionHash', (hash) => {
      console.log(hash)
      this.loading = true
    })
    .then((resp) => {
      this.loading = false
      console.log(resp)
      return resp
    }).catch((err) => {
      this.loading = false
      console.error(err)
    })
  }

  /*
   *
   * Events
   *
   */




}
MicroEvent.mixin(RiddleContract);

export default RiddleContract
