<template>
  <v-container>
    <h1 class="text-center mb-4">무작위 포지션</h1>
    <div class="d-flex justify-center">
      <v-btn color="indigo" @click="shuffleTeams">SHOT</v-btn>
    </div>

    <div class="d-flex justify-center">
      <v-simple-table class="text-center full-width-table" style="max-width: 1000px">
        <thead>
          <tr>
            <th>Position</th>
            <th>1팀</th>
            <th>Point</th>
            <th>Tier</th>
            <th>Tier</th>
            <th>Point</th>
            <th>2팀</th>
            <th>Position</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in team1.length" :key="i">
            <td>
              <v-btn :color="getPositionColor(team1[i - 1].position)" small block class="text-wrap">
                {{ team1[i - 1].position }}
              </v-btn>
            </td>
            <td>
              <v-btn color="indigo" small block class="text-wrap">
                {{ team1[i - 1].name }}
              </v-btn>
            </td>
            <td>{{ team1[i - 1].point }}</td>
            <td>
              <span
                :style="{
                  color: getTierColor(team1[i - 1].tier),
                  fontWeight: 'bold',
                }"
              >
                {{ team1[i - 1].tier }}
              </span>
            </td>
            <td>
              <span
                :style="{
                  color: getTierColor(team2[i - 1].tier),
                  fontWeight: 'bold',
                }"
              >
                {{ team2[i - 1].tier }}
              </span>
            </td>
            <td>{{ team2[i - 1].point }}</td>
            <td>
              <v-btn color="indigo" small block class="text-wrap">
                {{ team2[i - 1].name }}
              </v-btn>
            </td>
            <td>
              <v-btn :color="getPositionColor(team2[i - 1].position)" small block class="text-wrap">
                {{ team2[i - 1].position }}
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-simple-table>
    </div>
  </v-container>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const team1 = ref([
  { position: 'Top', name: '아라베스크#12311', point: 0, tier: 'Platinum 2' },
  { position: 'Jg', name: '힐링큐#여 잡 새', point: 0, tier: 'Platinum 3' },
  { position: 'Mid', name: '우정지수#kr1', point: 0, tier: 'Gold 4' },
  { position: 'Adc', name: '새콤도끼#kr1', point: 0, tier: 'Silver 3' },
  { position: 'Sup', name: '아구몬#신나리', point: 0, tier: 'Emerald 2' },
]);

const team2 = ref([
  { position: 'Top', name: '댕 체#kr1', point: 0, tier: 'Gold 2' },
  { position: 'Jg', name: '이병하#이병하', point: 0, tier: 'Gold 4' },
  { position: 'Mid', name: '개그맨님#kr1', point: 0, tier: 'Gold 4' },
  { position: 'Adc', name: '김갈붕#영웅출현', point: 0, tier: 'Platinum 4' },
  { position: 'Sup', name: 'netgate#kr1', point: 0, tier: 'Gold 2' },
]);

function getPositionColor(position: string) {
  switch (position) {
    case 'Top':
      return 'deep-purple';
    case 'Jg':
      return 'green';
    case 'Mid':
      return 'blue';
    case 'Adc':
      return 'red';
    case 'Sup':
      return 'pink';
    default:
      return 'grey';
  }
}

function getTierColor(tier: string): string {
  if (!tier) return 'grey';

  const key = tier.toLowerCase();
  if (key.includes('iron')) return '#615F5F';
  if (key.includes('bronze')) return '#AD5600';
  if (key.includes('silver')) return '#A0A0A0';
  if (key.includes('gold')) return '#FFD700';
  if (key.includes('platinum')) return '#00BBA3';
  if (key.includes('emerald')) return '#00D66B';
  if (key.includes('diamond')) return '#00BFFF';
  if (key.includes('master')) return '#C42AFF';
  if (key.includes('grandmaster')) return '#FF4D4D';
  if (key.includes('challenger')) return '#007BFF';
  return 'black';
}

function shuffleTeams() {
  const combined = [...team1.value, ...team2.value];

  // Fisher–Yates shuffle
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  team1.value = combined.slice(0, 5);
  team2.value = combined.slice(5, 10);
}
</script>

<style scoped>
.text-center {
  text-align: center;
}
.text-wrap {
  white-space: normal !important;
  word-break: break-word;
}

.full-width-table {
  border-collapse: collapse; /* 줄이 겹치지 않도록 */
}

.full-width-table th,
.full-width-table td {
  text-align: center;
  vertical-align: middle;
  border: 1px solid #444; /* 줄 추가 */
  padding: 8px;
}
</style>
