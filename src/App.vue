<template>
  <div id="app">
    <ae-main>
      <ae-header name="Ræddle">
        <span style="color: white">
          <a :href="etherscan" target="_blank">
            <ae-identity-avatar :address="account"></ae-identity-avatar>
          </a>
        </span>
      </ae-header>
      <ae-notification type="dramatic">
          <span style="color: white">
          Allowed {{allowed}} / {{balance}}
        </span>
        <ae-button @click="modalVisible = true" type="exciting" slot="button">
          <span>Edit Æ Allowance</span>
        </ae-button>
      </ae-notification>
       <ae-modal
        v-if="modalVisible"
        @close="modalVisible = false"
        title="Allowed Æ"
      >
        <form @submit.prevent="allowMore">
          <br>
          <ae-amount-input :step="1" :value="newAllowed" @input='changeInputAllowed' />
          <br>
          <ae-button type="exciting" >
            <span>Allow</span>
        </ae-button>
        <br>
        </form>
      </ae-modal>
      <div class="riddles">
        <form @submit.prevent="askRiddle">
          <ae-label >
             Riddle:
          </ae-label>
          <div class="inputWrapper">
            <textarea v-model="question" />
          </div>
          <ae-label >
             Solution:
          </ae-label>
          <div class="inputWrapper">
            <textarea v-model="answer" />
          </div>
          <ae-label :help-text="rewardText" help-type="danger">
             Reward:
          </ae-label>
          <ae-amount-input
          :max="allowed" :step="1" :value="reward" @input='changeInput' />
          <ae-button id="newQSubmit" type="dramatic">Submit</ae-button>
        </form>
        <riddle
        :riddle-contract="riddleContract"
        :key="i"
        @reload="timeOutReload()"
        @loading="loadEvent()"
        :riddle="riddle"
        v-for="riddle, i in riddles"
        />
        <div v-if="!riddles.length">Sorry, no riddles yet...</div>
      </div>
      <ae-loader v-if="loading"></ae-loader>
    </ae-main>
  </div>
</template>

<script>
import {AeModal, AeNotification, AeLoader, AeMain, AeLabel, AeAmountInput, AeHeader, AeButton, AeIdentityAvatar} from '@aeternity/aepp-components'
import Riddle from '@/components/Riddle'
import RiddleContract from '../dapp-scratch-wrapper/RiddleContract/index.js'
import utils from 'web3-utils'

export default {
  name: 'app',
  components: {AeModal, AeNotification, AeLoader, AeMain, AeLabel, Riddle, AeHeader, AeButton, AeIdentityAvatar, AeAmountInput},
  data () {
    return {
      modalVisible: false,
      newAllowed: 0,
      allowed: 0,
      balance: 0,
      riddleContract: null,
      question: null,
      answer: null,
      reward: 0,
      loading: false,
      riddles: [],
      account: null,
      networkId: null
    }
  },
  watch: {
    modalVisible () {
      this.newAllowed = this.allowed
    }
  },
  computed: {
    rewardText () {
      return this.allowed === 0 ? 'Please Increase Allowed Amount' : ''
    },
    etherscan () {
      switch (this.network) {
        case (1):
          return 'https://etherscan.io/address/' + this.account
        case (4):
          return 'https://rinkeby.etherscan.io/address/' + this.account
        case (42):
          return 'https://kovan.etherscan.io/address/' + this.account
        case (5777):
          return '#'
        default:
          return '#'
      }
    },
    hashedAnswer () {
      return this.answer && utils.sha3(this.answer)
    }
  },
  mounted () {
    this.riddleContract = new RiddleContract()
    this.riddleContract.bind('networkChange', () => {
      this.networkId = this.riddleContract.network
      return this.getAllRiddles()
    })
    this.riddleContract.bind('accountChange', () => {
      this.account = this.riddleContract.account
    })
    this.riddleContract.bind('balanceChange', () => {
      this.balance = utils.fromWei(this.riddleContract.balanceAE) + ' Æ'
    })
    this.riddleContract.bind('allowedChange', () => {
      this.allowed = parseInt(utils.fromWei(this.riddleContract.allowed))
      this.newAllowed = this.allowed
    })
  },
  methods: {
    allowMore () {
      this.loading = true
      this.modalVisible = false
      this.riddleContract.approve(this.newAllowed).then(() => {
        this.loading = false
      }).catch((error) => {
        console.log(error)
        this.loading = false
      })
    },
    changeInputAllowed (newVal) {
      this.newAllowed = newVal
    },
    changeInput (newVal) {
      this.reward = newVal
    },
    timeOutReload () {
      setTimeout(() => {
        this.getAllRiddles()
      }, 3000)
    },
    loadEvent (loading) {
      this.loading = loading
    },
    askRiddle () {
      this.loading = true
      const qa = utils.soliditySha3(this.question, this.hashedAnswer)
      return this.riddleContract.getRiddleAtHash(qa).then((riddle) => {
        if (!riddle.exists) {
          return this.riddleContract.askRiddle(this.question, this.hashedAnswer, this.reward).then(() => {
            this.question = null
            this.answer = null
            this.reward = 0
            setTimeout(this.getAllRiddles, 3000)
          }).catch((error) => {
            console.log(error)
            alert('sorry')
            this.loading = false
          })
        } else {
          alert('riddle exists')
          this.loading = false
        }
      })
    },
    getAllRiddles () {
      this.riddles = []
      this.loading = true
      return this.riddleContract.getRiddleCount().then((count) => {
        console.log(count)
        return count && this.getRiddleAtKey(0, count)
      })
    },
    getRiddleAtKey (key, total) {
      if (key >= total || !total) {
        this.loading = false
      } else {
        return this.riddleContract.getRiddleAtKey(key).then((riddle) => {
          riddle && this.riddles.push(riddle)
          return riddle && this.getRiddleAtKey(key + 1, total)
        })
      }
    },
    getAccount () {
    }
  }
}
</script>

<style lang="scss">
body {
  background-color: white;
  padding:0;
  margin:0;
}
* {
    font-family: arial, sans-serif;
    box-sizing: border-box;;
}
#app {
  .riddles {
    max-width: 480px;
    margin:auto;
  }
  .eth-input {
    position: relative;
    display: block;
    &:before {
      content: 'ETH';
      position: absolute;
      right:10px;
      top:0px;
      line-height:26px;
    }
  }
  #newQSubmit {
    display: block;

    margin:1em auto 0 auto;
  }
  .riddles {


   > form {
      padding:10px;
      padding-bottom:30px;

    }
    .inputWrapper {
      border-radius: 10px;
      border: 2px solid #f5f5f5;
      background-color: #fff;
    }
    textarea {
      padding: 10px;
      background: none;
      border: none;
      font-size: 30px;
      font-weight: 300;
      height: 100%;
      line-height: 100%;
      width:100%;
      display:block;
    }
  }
  .ae-loader {
    position: fixed;
    bottom:50px;
    left:50%;

    margin-left:-10px;
    text-align: center;
  }
}
</style>
