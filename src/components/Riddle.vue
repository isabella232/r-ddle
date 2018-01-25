<template>
  <div>
    <h2>{{riddle.question}}</h2>
    <template v-if="riddle.solved">
      <h3>{{riddle.answer}}</h3>
      <small>Answered by {{riddle.solver}} for {{toEth(riddle.reward)}} ETH</small>
    </template>
    <form v-else @submit.prevent="answerRiddle()">
      <h3>Reward: {{toEth(riddle.reward)}}Ξ</h3>
      <input v-model="answer" placeholder="Do you have an answer?">
    </form>
  </div>
</template>

<script>
import utils from 'web3-utils'

export default {

  name: 'Riddle',
  props: ['riddle', 'riddleContract'],
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
          alert('riddle already solved')
        }
      }).catch(() => {
        return this.$emit('loading', false)
      })
    }
  }
}
</script>

<style lang="css" scoped>
</style>