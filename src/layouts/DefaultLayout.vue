<template>
  <v-app>
    <HeaderBar />
    <HeaderNav />
    <v-layout>
      <v-main>
        <router-view />
      </v-main>
    </v-layout>
  </v-app>
</template>

<script lang="ts" setup>
import HeaderBar from "@/components/header/Header.vue";
import HeaderNav from "@/components/header/HeaderNav.vue";
</script>
