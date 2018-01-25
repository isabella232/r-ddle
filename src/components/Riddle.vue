<template>
  <div>
    <h2>Q: {{riddle.question}}</h2>
    <template v-if="riddle.solved">
      <h3>A: {{riddle.answer}}</h3>
      <small>Answered by {{riddle.solver}} for {{toEth(riddle.reward)}} Æ</small>
    </template>
    <form v-else @submit.prevent="answerRiddle()">
      <h3>Reward: {{toEth(riddle.reward)}} Æ</h3>
      <ae-label >
         Do you have an answer?:
      </ae-label>
      <br>
      <div class="inputWrapper">
        <textarea v-model="answer" />
      </div>
      <br>
      <ae-button type="exciting" size="small">Submit</ae-button>
    </form>
  </div>
</template>

<script>
import utils from 'web3-utils'
import {AeLabel, AeButton} from '@aeternity/aepp-components'

export default {

  name: 'Riddle',
  props: ['riddle', 'riddleContract'],
  components: {AeLabel, AeButton},
  data () {
    return {
      answer: null
    }
  },
  computed: {
    hashedAnswer () {
      return utils.sha3(this.answer)
    }
  },
  methods: {
    toEth (amount) {
      return utils.fromWei(amount)
    },
    answerRiddle () {
      this.$emit('loading', true)

      const qa = utils.soliditySha3(this.riddle.question, this.hashedAnswer)
      return this.riddleContract.getRiddleAtHash(qa).then((riddle) => {
        console.log(riddle)
        if (riddle.exists && !riddle.solved) {
          return this.riddleContract.answerRiddle(this.riddle.question, this.answer).then(() => {
            return this.$emit('reload')
          }).catch(() => {
            return this.$emit('loading', false)
          })
        } else {
          alert('try again!')
        }
      }).catch(() => {
        return this.$emit('loading', false)
      })
    }
  }
}
</script>

<style lang="css" scoped>
div {
  padding: 20px 0px;
  border-top:2px solid black;
}
</style>