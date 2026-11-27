<template>
  <div>
    <section id="buttons" class="section">
      <ButtonSection />
    </section>
    <section id="table" class="section">
      <TableSection />
    </section>
    <section id="form" class="section">
      <FormSection />
    </section>
    <section id="feedback" class="section">
      <FeedbackSection />
    </section>
  </div>
</template>

<script setup>
import ButtonSection from '../components/ButtonSection.vue'
import TableSection from '../components/TableSection.vue'
import FormSection from '../components/FormSection.vue'
import FeedbackSection from '../components/FeedbackSection.vue'
</script>

<style scoped>
.section {
  margin-bottom: 24px;
  scroll-margin-top: 20px;
}
</style>
