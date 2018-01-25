<template>
  <div id="app">
    <div class="riddles">
      <form @submit.prevent="askRiddle">
        <input v-model="question" placeholder="Ask a riddle...">
        <input v-model="answer" placeholder="What's the answer?">
        <input :value="hashedAnswer" placeholder="Here's the hashed answer" readonly="true">
        <input v-model="reward" type="number" placeholder="What's the reward?">
        <input type="submit" value="submit">
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
import Riddle from '@/components/Riddle'
import RiddleContract from '../dapp-scratch-wrapper/RiddleContract/index.js'
import utils from 'web3-utils'

export default {
  name: 'app',
  components: {Riddle},
  data () {
    return {
      riddleContract: null,
      question: null,
      answer: null,
      reward: null,
      loading: false,
      riddles: []
    }
  },
  computed: {
    hashedAnswer () {
      console.log('calc')
      return this.answer && utils.sha3(this.answer)
    }
  },
  mounted () {
    this.riddleContract = new RiddleContract()
    this.riddleContract.bind('networkChange', () => {
      return this.getAllRiddles()
    })
  },
  methods: {
    timeOutReload () {
      setTimeout(() => {
        this.getAllRiddles()
      }, 1000)
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
  max-width: 480px;
  margin:auto;
  form {
    input {
      display: block;
      width:100%;
      margin:5px;
      padding:5px;
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
