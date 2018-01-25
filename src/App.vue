<template>
  <div id="app">
    <ae-header name="Ræddle">
      <span style="color: white">
        <a :href="etherscan" target="_blank">
          <ae-identity-avatar :address="'account'"></ae-identity-avatar>
        </a>
      </span>
    </ae-header>
    <div class="riddles">
      <form @submit.prevent="askRiddle">
        <input v-model="question" placeholder="Ask a riddle...">
        <input v-model="answer" placeholder="What's the answer?">
<!--         <input :value="hashedAnswer" placeholder="Here's the hashed answer" readonly="true"> -->
        <label class="eth-input"><input v-model="reward" type="number" placeholder="What's the reward?"></label>
        <ae-button type="dramatic">Submit</ae-button>
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
    <small v-if="loading">loading...</small>
  </div>
</template>

<script>
import {AeHeader, AeButton, AeIdentityAvatar} from '@aeternity/aepp-components'
import Riddle from '@/components/Riddle'
import RiddleContract from '../dapp-scratch-wrapper/RiddleContract/index.js'
import utils from 'web3-utils'

export default {
  name: 'app',
  components: {Riddle, AeHeader, AeButton, AeIdentityAvatar},
  data () {
    return {
      riddleContract: null,
      question: null,
      answer: null,
      reward: null,
      loading: false,
      riddles: [],
      account: null,
      networkId: null
    }
  },
  computed: {
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
      console.log('calc')
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
  },
  methods: {
    timeOutReload () {
      console.log('timeoutreload')
      setTimeout(() => {
        this.getAllRiddles()
      }, 3000)
    },
    loadEvent (loading) {
      this.loading = loading
    },
    askRiddle () {
      console.log('askRiddle', this.riddleContract)
      this.loading = true
      return this.riddleContract.getRiddleAtHash(this.hashedAnswer).then((riddle) => {
        if (!riddle.exists) {
          return this.riddleContract.askRiddle(this.question, this.hashedAnswer, this.reward).then(() => {
            return this.getAllRiddles()
          })
        } else {
          alert('riddle exists')
        }
      })
    },
    getAllRiddles () {
      this.riddles = []
      this.loading = true
      return this.riddleContract.getRiddleCount().then((count) => {
        return this.getRiddleAtKey(0, count)
      })
    },
    getRiddleAtKey (key, total) {
      if (key >= total) {
        this.loading = false
      } else {
        return this.riddleContract.getRiddleAtKey(key).then((riddle) => {
          this.riddles.push(riddle)
          return this.getRiddleAtKey(key + 1, total)
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
  button {
    display: block;
    margin-left: auto;
    margin-right: auto;
  }
  .riddles {


   > form {
      padding:10px;
      padding-bottom:30px;

    }
    input {
      display: block;
      width:100%;
      padding:5px;
      margin-bottom:10px;
    }
  }
  > small {
    position: fixed;
    bottom:0px;
    left:0px;
    right:0px;
    width:100%;
    height:30px;
    line-height:30px;
    text-align: center;
  }
}
</style>
