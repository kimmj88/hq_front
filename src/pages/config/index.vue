<template>
  <v-container>
    <h1>Config Page</h1>
    <v-btn color="primary" @click="goToAbout">Go to Home</v-btn>
  </v-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
const goToAbout = () => router.push('/home');
</script>
