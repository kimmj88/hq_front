<template>
  <v-container class="record-page py-8">
    <section class="record-hero">
      <div>
        <span class="eyebrow">CUSTOM GAME RESULT · UI SAMPLE</span>
        <h1>사용자게임 전적</h1>
        <p>참가한 내전 기록을 확인하고 경기를 눌러 상세 결과를 펼쳐보세요.</p>
      </div>
      <div class="game-summary"><strong>{{ gameHistory.length }}</strong><span>전체 경기</span></div>
    </section>

    <section class="history-panel">
      <div class="history-head">
        <div><strong>최근 사용자게임</strong><span>최신 경기순</span></div>
        <v-chip size="small" variant="tonal" color="primary">내전 기록</v-chip>
      </div>
      <template v-for="game in gameHistory" :key="game.id">
      <button
        type="button"
        :class="['history-row', game.result === '승리' ? 'win' : 'loss', { selected: selectedGame?.id === game.id }]"
        @click="selectedGame = selectedGame?.id === game.id ? null : game"
      >
        <div class="history-result"><strong>{{ game.result }}</strong><span>{{ game.queue }}</span></div>
        <div class="history-champion">
          <v-avatar size="54" rounded="lg"><v-img :src="championIcon(game.champion)" cover /></v-avatar>
          <div class="spells"><v-img v-for="spell in game.spells" :key="spell" :src="spellIcon(spell)" width="23" height="23" /></div>
        </div>
        <div class="history-kda"><strong>{{ game.kda }}</strong><span>{{ game.score }} 평점</span></div>
        <div class="history-items">
          <v-img v-for="(item, index) in game.items" :key="index" :src="itemIcon(item)" width="30" height="30" cover />
        </div>
        <div class="history-farm"><strong>CS {{ game.cs }}</strong><span>{{ game.csPerMinute }} /분</span></div>
        <div class="history-time"><strong>{{ game.duration }}</strong><span>{{ game.playedAt }}</span></div>
        <v-icon class="history-arrow">{{ selectedGame?.id === game.id ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      </button>
      <div v-if="selectedGame?.id === game.id" class="accordion-detail">
    <section class="expanded-detail">
      <div>
        <span>선택한 경기</span>
        <strong>{{ selectedGame.title }}</strong>
        <small>소환사의 협곡 · 사용자 설정 게임 · {{ selectedGame.playedAt }}</small>
      </div>
      <div class="detail-actions">
        <div class="game-summary"><strong>{{ selectedGame.duration }}</strong><span>게임 시간</span></div>
        <v-btn variant="tonal" icon="mdi-close" aria-label="상세 닫기" @click="selectedGame = null" />
      </div>
    </section>
    <div class="result-overview">
      <div class="overview-team blue">
        <span>BLUE TEAM</span>
        <strong>승리</strong>
        <small>킬 28 · 골드 61.4K</small>
      </div>
      <div class="score"><b>28</b><span>:</span><b>19</b></div>
      <div class="overview-team red">
        <span>RED TEAM</span>
        <strong>패배</strong>
        <small>킬 19 · 골드 55.8K</small>
      </div>
    </div>

    <section v-for="team in teams" :key="team.key" :class="['team-panel', team.key]">
      <header>
        <div>
          <v-icon :color="team.key === 'blue' ? 'blue-lighten-2' : 'red-lighten-2'">
            {{ team.key === 'blue' ? 'mdi-shield-check' : 'mdi-shield-outline' }}
          </v-icon>
          <strong>{{ team.label }}</strong>
          <span>{{ team.result }}</span>
        </div>
        <small>챔피언 피해량</small>
      </header>

      <div class="player-table">
        <article v-for="player in team.players" :key="player.name" class="player-row">
          <div class="position">
            <v-img :src="positionIcon(player.position)" width="28" height="28" />
            <span>{{ player.position }}</span>
          </div>

          <div class="champion">
            <v-avatar size="52" rounded="lg">
              <v-img :src="championIcon(player.champion)" cover />
            </v-avatar>
            <div class="spells">
              <v-img v-for="spell in player.spells" :key="spell" :src="spellIcon(spell)" width="23" height="23" />
            </div>
          </div>

          <div class="identity">
            <strong>{{ player.name }}</strong>
            <span>{{ player.championKo }} · Lv.{{ player.level }}</span>
          </div>

          <div class="kda">
            <strong>{{ player.kills }} / <em>{{ player.deaths }}</em> / {{ player.assists }}</strong>
            <span>{{ kda(player) }} 평점</span>
          </div>

          <div class="farm">
            <strong>{{ player.cs }} CS</strong>
            <span>{{ (player.cs / 32.3).toFixed(1) }} /분</span>
          </div>

          <div class="damage">
            <div><strong>{{ player.damage.toLocaleString() }}</strong><span>{{ damagePercent(player.damage) }}%</span></div>
            <v-progress-linear
              :model-value="damagePercent(player.damage)"
              :color="team.key === 'blue' ? 'blue-lighten-1' : 'red-lighten-1'"
              height="6"
              rounded
            />
          </div>

          <div class="items">
            <v-tooltip
              v-for="(item, index) in player.items"
              :key="`${player.name}-${index}`"
              location="top"
              :open-on-click="true"
              max-width="290"
            >
              <template #activator="{ props }">
                <button v-bind="props" type="button" class="item-slot" :aria-label="itemInfo(item).name">
                  <v-img v-if="item" :src="itemIcon(item)" width="30" height="30" cover />
                </button>
              </template>
              <div class="item-tooltip">
                <div class="item-tooltip__head">
                  <v-img :src="itemIcon(item)" width="42" height="42" cover class="item-tooltip__image" />
                  <div>
                    <strong>{{ itemInfo(item).name }}</strong>
                    <span>구매 {{ itemInfo(item).price.toLocaleString() }}G · 판매 {{ itemInfo(item).sell.toLocaleString() }}G</span>
                  </div>
                </div>
                <p v-if="itemInfo(item).plaintext">{{ itemInfo(item).plaintext }}</p>
                <div class="item-tooltip__description" v-html="itemInfo(item).description" />
              </div>
            </v-tooltip>
          </div>
        </article>
      </div>
    </section>

    <v-alert class="mt-5" type="info" variant="tonal" rounded="xl">
      이 화면은 UI 확인용 샘플입니다. 실제 적용 시 Riot Match ID를 저장한 뒤 경기 종료 후 상세 데이터를 수집해 표시합니다.
    </v-alert>
      </div>
      </template>
    </section>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import topIcon from '@/assets/positions/top.svg';
import jugIcon from '@/assets/positions/jug.svg';
import midIcon from '@/assets/positions/mid.svg';
import adcIcon from '@/assets/positions/adc.webp';
import supIcon from '@/assets/positions/sup.svg';

type Position = 'TOP' | 'JUG' | 'MID' | 'ADC' | 'SUP';
type SamplePlayer = {
  position: Position; name: string; champion: string; championKo: string; level: number;
  spells: string[]; kills: number; deaths: number; assists: number; cs: number; damage: number; items: string[];
};

type HistoryGame = {
  id: number; title: string; result: '승리' | '패배'; queue: string; champion: string;
  spells: string[]; kda: string; score: string; cs: number; csPerMinute: string;
  duration: string; playedAt: string; items: string[];
};

const gameHistory: HistoryGame[] = [
  { id: 128, title: '힐링큐 정기 내전 #128', result: '승리', queue: '내전 매치', champion: 'Ahri', spells: ['SummonerFlash', 'SummonerTeleport'], kda: '9 / 2 / 11', score: '10.00', cs: 251, csPerMinute: '7.8', duration: '32:18', playedAt: '2026. 9. 5. 오후 9:02', items: ['6655', '3020', '3089', '3135', '1058', '3363'] },
  { id: 127, title: '힐링큐 자유 내전 #127', result: '패배', queue: '내전 매치', champion: 'Syndra', spells: ['SummonerFlash', 'SummonerTeleport'], kda: '6 / 7 / 8', score: '2.00', cs: 218, csPerMinute: '6.5', duration: '33:41', playedAt: '2026. 9. 3. 오후 10:14', items: ['6655', '3020', '3089', '3135', '1058', '3363'] },
  { id: 126, title: '경매내전 시즌 4 #12', result: '승리', queue: '경매내전', champion: 'Kaisa', spells: ['SummonerFlash', 'SummonerBarrier'], kda: '11 / 5 / 7', score: '3.60', cs: 274, csPerMinute: '8.1', duration: '33:50', playedAt: '2026. 8. 30. 오후 8:45', items: ['6672', '3006', '3124', '3085', '1038', '3363'] },
  { id: 125, title: '힐링큐 정기 내전 #125', result: '승리', queue: '내전 컵', champion: 'Jinx', spells: ['SummonerFlash', 'SummonerBarrier'], kda: '8 / 3 / 12', score: '6.67', cs: 236, csPerMinute: '8.0', duration: '29:31', playedAt: '2026. 8. 28. 오후 9:10', items: ['3031', '3006', '3094', '3085', '1038', '3363'] },
  { id: 124, title: '힐링큐 자유 내전 #124', result: '패배', queue: '내전 매치', champion: 'Ahri', spells: ['SummonerFlash', 'SummonerTeleport'], kda: '4 / 8 / 6', score: '1.25', cs: 198, csPerMinute: '5.9', duration: '33:22', playedAt: '2026. 8. 25. 오후 10:02', items: ['6655', '3020', '3135', '1058', '1036', '3363'] },
];
const selectedGame = ref<HistoryGame | null>(null);

const teams: { key: 'blue' | 'red'; label: string; result: string; players: SamplePlayer[] }[] = [
  {
    key: 'blue', label: '블루 팀', result: '승리', players: [
      { position: 'TOP', name: '검은고양이#KR1', champion: 'Gnar', championKo: '나르', level: 17, spells: ['SummonerTeleport', 'SummonerFlash'], kills: 5, deaths: 3, assists: 9, cs: 224, damage: 24580, items: ['3071', '3047', '3053', '3065', '1036', '3340'] },
      { position: 'JUG', name: '정글은내운명#JUG', champion: 'Vi', championKo: '바이', level: 16, spells: ['SummonerSmite', 'SummonerFlash'], kills: 7, deaths: 4, assists: 12, cs: 168, damage: 21240, items: ['3071', '3047', '3065', '3053', '1036', '3364'] },
      { position: 'MID', name: '힐링큐#미드', champion: 'Ahri', championKo: '아리', level: 18, spells: ['SummonerFlash', 'SummonerTeleport'], kills: 9, deaths: 2, assists: 11, cs: 251, damage: 32780, items: ['6655', '3020', '3089', '3135', '1058', '3363'] },
      { position: 'ADC', name: '원딜차이#ADC', champion: 'Jinx', championKo: '징크스', level: 17, spells: ['SummonerFlash', 'SummonerBarrier'], kills: 6, deaths: 4, assists: 8, cs: 279, damage: 30110, items: ['3031', '3006', '3094', '3085', '1038', '3363'] },
      { position: 'SUP', name: '시야먹는서폿#SUP', champion: 'Nautilus', championKo: '노틸러스', level: 14, spells: ['SummonerFlash', 'SummonerExhaust'], kills: 1, deaths: 6, assists: 21, cs: 38, damage: 9860, items: ['3190', '3117', '3109', '1028', '2055', '3364'] },
    ],
  },
  {
    key: 'red', label: '레드 팀', result: '패배', players: [
      { position: 'TOP', name: '탑신병자#TOP', champion: 'Darius', championKo: '다리우스', level: 16, spells: ['SummonerTeleport', 'SummonerFlash'], kills: 6, deaths: 6, assists: 4, cs: 210, damage: 22690, items: ['3078', '3047', '3053', '3065', '1036', '3340'] },
      { position: 'JUG', name: '강타두번씀#KR1', champion: 'LeeSin', championKo: '리 신', level: 15, spells: ['SummonerSmite', 'SummonerFlash'], kills: 4, deaths: 7, assists: 10, cs: 151, damage: 17840, items: ['6630', '3047', '3071', '3156', '1036', '3364'] },
      { position: 'MID', name: '미드오픈#MID', champion: 'Syndra', championKo: '신드라', level: 17, spells: ['SummonerFlash', 'SummonerTeleport'], kills: 5, deaths: 5, assists: 7, cs: 238, damage: 29430, items: ['6655', '3020', '3089', '3135', '1058', '3363'] },
      { position: 'ADC', name: '카이팅중#KR1', champion: 'Kaisa', championKo: '카이사', level: 16, spells: ['SummonerFlash', 'SummonerBarrier'], kills: 3, deaths: 6, assists: 6, cs: 246, damage: 25120, items: ['6672', '3006', '3124', '3085', '1038', '3363'] },
      { position: 'SUP', name: '와드없어요#SUP', champion: 'Thresh', championKo: '쓰레쉬', level: 13, spells: ['SummonerFlash', 'SummonerExhaust'], kills: 1, deaths: 4, assists: 14, cs: 35, damage: 8120, items: ['3190', '3117', '3109', '1028', '2055', '3364'] },
    ],
  },
];

const positionIcons: Record<Position, string> = { TOP: topIcon, JUG: jugIcon, MID: midIcon, ADC: adcIcon, SUP: supIcon };
const ddragonVersion = ref('15.18.1');
type ItemDetail = { name: string; price: number; sell: number; plaintext: string; description: string };
type DDragonItem = { name: string; plaintext?: string; description?: string; gold?: { total?: number; sell?: number } };
const riotItems = ref<Record<string, DDragonItem>>({});
const itemInfos: Record<string, { name: string; price: number; stats: string; description: string }> = {
  '1036': { name: '롱소드', price: 350, stats: '공격력 +10', description: '기본 공격력을 올려 주는 하위 아이템입니다.' },
  '1028': { name: '루비 수정', price: 400, stats: '체력 +150', description: '최대 체력을 올려 주는 하위 아이템입니다.' },
  '1038': { name: 'B.F. 대검', price: 1300, stats: '공격력 +40', description: '높은 공격력을 제공하는 상위 아이템 재료입니다.' },
  '1058': { name: '쓸데없이 큰 지팡이', price: 1250, stats: '주문력 +65', description: '강력한 주문력 아이템의 핵심 재료입니다.' },
  '2055': { name: '제어 와드', price: 75, stats: '시야 장악', description: '주변의 투명 와드와 함정을 드러내는 와드입니다.' },
  '3006': { name: '광전사의 군화', price: 1100, stats: '공격 속도 · 이동 속도', description: '기본 공격 중심 챔피언의 공격 속도와 이동 속도를 높입니다.' },
  '3020': { name: '마법사의 신발', price: 1100, stats: '마법 관통력 · 이동 속도', description: '마법 피해가 적의 마법 저항력을 더 효과적으로 관통합니다.' },
  '3031': { name: '무한의 대검', price: 3600, stats: '공격력 · 치명타', description: '치명타 피해를 크게 강화하는 원거리 딜러 핵심 아이템입니다.' },
  '3047': { name: '판금 장화', price: 1200, stats: '방어력 · 이동 속도', description: '기본 공격으로 받는 피해를 줄여 줍니다.' },
  '3053': { name: '스테락의 도전', price: 3200, stats: '체력 · 공격력', description: '큰 피해를 받으면 생명선 보호막을 제공합니다.' },
  '3065': { name: '정령의 형상', price: 2900, stats: '체력 · 마법 저항력', description: '받는 회복과 보호막 효과를 증가시킵니다.' },
  '3071': { name: '칠흑의 양날 도끼', price: 3000, stats: '공격력 · 체력 · 스킬 가속', description: '물리 피해를 입힐수록 대상의 방어력을 감소시킵니다.' },
  '3078': { name: '삼위일체', price: 3333, stats: '공격력 · 공격 속도 · 체력', description: '스킬 사용 후 다음 기본 공격을 강화합니다.' },
  '3085': { name: '루난의 허리케인', price: 2650, stats: '공격 속도 · 치명타', description: '기본 공격이 주변의 추가 대상에게 탄환을 발사합니다.' },
  '3089': { name: '라바돈의 죽음모자', price: 3600, stats: '주문력 대폭 증가', description: '보유한 총 주문력을 비율로 증가시킵니다.' },
  '3094': { name: '고속 연사포', price: 2650, stats: '공격 속도 · 치명타', description: '충전된 기본 공격의 사거리와 피해를 강화합니다.' },
  '3109': { name: '기사의 맹세', price: 2200, stats: '체력 · 방어력 · 스킬 가속', description: '아군과 결속하여 받는 피해 일부를 대신 부담합니다.' },
  '3117': { name: '기동력의 장화', price: 1000, stats: '비전투 이동 속도', description: '전투에서 벗어나 있을 때 이동 속도가 크게 증가합니다.' },
  '3124': { name: '구인수의 격노검', price: 3000, stats: '공격력 · 주문력 · 공격 속도', description: '기본 공격 적중 효과를 더욱 자주 발동시킵니다.' },
  '3135': { name: '공허의 지팡이', price: 3000, stats: '주문력 · 마법 관통력', description: '높은 마법 저항력을 가진 적에게 효과적입니다.' },
  '3156': { name: '맬모셔스의 아귀', price: 3100, stats: '공격력 · 마법 저항력', description: '큰 마법 피해를 받으면 마법 보호막을 제공합니다.' },
  '3190': { name: '강철의 솔라리 펜던트', price: 2200, stats: '방어력 · 마법 저항력 · 체력', description: '사용 시 주변 아군에게 보호막을 부여합니다.' },
  '6630': { name: '선혈포식자', price: 3300, stats: '공격력 · 체력 · 스킬 가속', description: '주변 적에게 피해를 입히고 체력을 회복합니다.' },
  '6655': { name: '루덴의 동반자', price: 2900, stats: '주문력 · 마나 · 스킬 가속', description: '스킬 적중 시 추가 마법 피해를 입힙니다.' },
  '6672': { name: '크라켄 학살자', price: 3100, stats: '공격력 · 공격 속도', description: '같은 대상을 연속 공격하면 추가 피해를 입힙니다.' },
  '3340': { name: '투명 와드', price: 0, stats: '장신구 · 시야', description: '지정한 위치의 시야를 일정 시간 밝힙니다.' },
  '3363': { name: '망원형 개조', price: 0, stats: '장신구 · 원거리 시야', description: '먼 거리의 지역을 밝히고 와드를 설치합니다.' },
  '3364': { name: '예언자형 렌즈', price: 0, stats: '장신구 · 시야 제거', description: '주변의 적 와드와 투명 함정을 탐지합니다.' },
};
function positionIcon(position: Position) { return positionIcons[position]; }
function championIcon(name: string) { return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion.value}/img/champion/${name}.png`; }
function spellIcon(name: string) { return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion.value}/img/spell/${name}.png`; }
function itemIcon(id: string) { return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion.value}/img/item/${id}.png`; }
function itemInfo(id: string): ItemDetail {
  const riotItem = riotItems.value[id];
  if (riotItem) {
    return {
      name: riotItem.name,
      price: riotItem.gold?.total ?? 0,
      sell: riotItem.gold?.sell ?? 0,
      plaintext: riotItem.plaintext ?? '',
      description: riotItem.description ?? '',
    };
  }
  const fallback = itemInfos[id];
  return fallback
    ? { name: fallback.name, price: fallback.price, sell: Math.floor(fallback.price * 0.7), plaintext: fallback.stats, description: fallback.description }
    : { name: `아이템 #${id}`, price: 0, sell: 0, plaintext: '', description: '아이템 상세 정보를 불러오는 중입니다.' };
}
function kda(player: SamplePlayer) { return ((player.kills + player.assists) / Math.max(1, player.deaths)).toFixed(2); }
function damagePercent(damage: number) { return Math.round((damage / 32780) * 100); }

onMounted(async () => {
  try {
    const versionResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions = await versionResponse.json() as string[];
    const latestVersion = versions[0] || '15.18.1';
    ddragonVersion.value = latestVersion;
    const itemResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/ko_KR/item.json`);
    const itemPayload = await itemResponse.json() as { data?: Record<string, DDragonItem> };
    riotItems.value = itemPayload.data ?? {};
  } catch (error) {
    console.warn('Riot 아이템 상세 정보를 불러오지 못해 기본 설명을 사용합니다.', error);
  }
});
</script>

<style scoped>
.record-page { max-width: 1380px; }
.record-hero { display:flex; align-items:flex-end; justify-content:space-between; gap:24px; padding:30px 34px; border:1px solid rgba(var(--v-theme-primary),.22); border-radius:26px; background:radial-gradient(circle at 84% 20%,rgba(var(--v-theme-primary),.28),transparent 34%),linear-gradient(135deg,#171426,#25203b); }
.eyebrow { color:#b794f6; font-size:11px; font-weight:900; letter-spacing:.15em; }.record-hero h1{margin:7px 0 6px;font-size:32px}.record-hero p{margin:0;color:rgba(255,255,255,.58)}
.detail-actions{display:flex;align-items:center;gap:18px}
.game-summary{display:flex;flex-direction:column;align-items:flex-end}.game-summary strong{font-size:34px}.game-summary span{color:rgba(255,255,255,.48);font-size:11px}
.history-panel{overflow:hidden;margin-top:20px;border:1px solid rgba(255,255,255,.09);border-radius:22px;background:rgba(var(--v-theme-surface),.82)}
.history-head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid rgba(255,255,255,.08)}
.history-head>div{display:flex;align-items:baseline;gap:10px}.history-head span{color:rgba(var(--v-theme-on-surface),.45);font-size:11px}
.history-row{display:grid;width:100%;grid-template-columns:88px 92px 120px minmax(200px,1fr) 94px 190px 22px;align-items:center;gap:14px;min-height:88px;padding:12px 20px;border:0;border-bottom:1px solid rgba(255,255,255,.075);border-left:5px solid transparent;color:inherit;text-align:left;cursor:pointer;transition:background .18s ease,transform .18s ease}
.history-row:last-child{border-bottom:0}.history-row.win{border-left-color:#3b82f6;background:linear-gradient(90deg,rgba(59,130,246,.14),rgba(59,130,246,.035) 65%,transparent)}.history-row.loss{border-left-color:#ef6464;background:linear-gradient(90deg,rgba(239,100,100,.13),rgba(239,100,100,.03) 65%,transparent)}
.history-row:hover{background-color:rgba(var(--v-theme-primary),.1);transform:translateX(2px)}
.history-row.selected{box-shadow:inset 0 0 0 1px rgba(var(--v-theme-primary),.65);background-color:rgba(var(--v-theme-primary),.14)}
.history-result,.history-kda,.history-farm,.history-time{display:flex;flex-direction:column}.history-result strong{font-size:15px}.history-row.win .history-result strong{color:#60a5fa}.history-row.loss .history-result strong{color:#f87171}.history-result span,.history-kda span,.history-farm span,.history-time span{margin-top:3px;color:rgba(var(--v-theme-on-surface),.48);font-size:10px}
.history-champion{display:flex;align-items:center;gap:6px}.history-kda strong{font-size:15px}.history-items{display:grid;grid-template-columns:repeat(6,30px);gap:4px}.history-items .v-img{overflow:hidden;border-radius:5px;background:rgba(255,255,255,.06)}.history-time{align-items:flex-end}.history-arrow{color:rgba(var(--v-theme-on-surface),.35)}
.accordion-detail{padding:18px 20px 22px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(5,7,14,.38);animation:detail-open .22s ease-out}.expanded-detail{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:20px 24px;border:1px solid rgba(var(--v-theme-primary),.28);border-radius:20px;background:linear-gradient(135deg,rgba(var(--v-theme-primary),.14),rgba(var(--v-theme-surface),.86))}.expanded-detail>div:first-child{display:flex;flex-direction:column}.expanded-detail>div:first-child>span{color:#b794f6;font-size:10px;font-weight:900;letter-spacing:.12em}.expanded-detail>div:first-child>strong{margin-top:4px;font-size:20px}.expanded-detail small{margin-top:3px;color:rgba(var(--v-theme-on-surface),.5)}
@keyframes detail-open{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
.result-overview{display:grid;grid-template-columns:1fr 130px 1fr;align-items:center;margin:20px 0;padding:20px 26px;border:1px solid rgba(255,255,255,.08);border-radius:22px;background:rgba(var(--v-theme-surface),.8)}
.overview-team{display:flex;flex-direction:column}.overview-team.red{align-items:flex-end}.overview-team>span{font-size:10px;font-weight:900;letter-spacing:.13em}.overview-team.blue>span,.overview-team.blue>strong{color:#60a5fa}.overview-team.red>span,.overview-team.red>strong{color:#f87171}.overview-team>strong{font-size:25px}.overview-team small{color:rgba(var(--v-theme-on-surface),.5)}
.score{display:flex;align-items:center;justify-content:center;gap:12px}.score b{font-size:30px}.score span{color:rgba(var(--v-theme-on-surface),.35)}
.team-panel{overflow:hidden;margin-top:16px;border:1px solid rgba(255,255,255,.08);border-left:5px solid;border-radius:20px;background:rgba(var(--v-theme-surface),.84)}.team-panel.blue{border-left-color:#3b82f6}.team-panel.red{border-left-color:#ef4444}
.team-panel>header{display:flex;align-items:center;justify-content:space-between;padding:15px 20px;border-bottom:1px solid rgba(255,255,255,.07)}.team-panel>header>div{display:flex;align-items:center;gap:9px}.team-panel>header span{color:rgba(var(--v-theme-on-surface),.5);font-size:12px}.team-panel>header small{color:rgba(var(--v-theme-on-surface),.45)}
.player-row{display:grid;grid-template-columns:70px 85px minmax(150px,1.35fr) 105px 80px minmax(120px,.8fr) 222px;align-items:center;gap:12px;min-height:76px;padding:10px 18px;border-bottom:1px solid rgba(255,255,255,.055)}.player-row:last-child{border-bottom:0}.player-row:hover{background:rgba(var(--v-theme-primary),.045)}
.position{display:flex;flex-direction:column;align-items:center;gap:2px}.position span,.identity span,.kda span,.farm span{color:rgba(var(--v-theme-on-surface),.46);font-size:10px}.champion{display:flex;align-items:center;gap:5px}.spells{display:grid;gap:3px}.spells .v-img,.item-slot{overflow:hidden;border-radius:5px}
.identity,.kda,.farm{display:flex;min-width:0;flex-direction:column}.identity strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kda strong em{color:#f87171;font-style:normal}.damage>div{display:flex;justify-content:space-between;margin-bottom:5px}.damage span{color:rgba(var(--v-theme-on-surface),.45);font-size:10px}
.items{display:grid;grid-template-columns:repeat(6,30px);gap:5px}.item-slot{width:30px;height:30px;padding:0;border:0;background:rgba(255,255,255,.06);cursor:help}.item-slot:hover,.item-slot:focus-visible{outline:2px solid #a78bfa;outline-offset:2px}
.item-tooltip{width:270px;padding:8px 6px;line-height:1.45}.item-tooltip__head{display:flex;align-items:center;gap:10px}.item-tooltip__head>div{display:flex;min-width:0;flex-direction:column}.item-tooltip__head strong{color:#f8fafc;font-size:14px}.item-tooltip__head span{color:#fbbf24;font-size:11px}.item-tooltip__image{overflow:hidden;border:1px solid rgba(255,255,255,.18);border-radius:7px}.item-tooltip p{margin:10px 0 8px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.1);color:#93c5fd;font-size:12px;font-weight:700}.item-tooltip__description{color:#d8dee9;font-size:12px;line-height:1.58}.item-tooltip__description :deep(mainText),.item-tooltip__description :deep(attention),.item-tooltip__description :deep(active){color:#f8fafc;font-weight:800}.item-tooltip__description :deep(stats){display:block;margin-bottom:7px;color:#8bd5ff}.item-tooltip__description :deep(rules){display:block;margin-top:7px;color:#94a3b8}.item-tooltip__description :deep(status){color:#86efac}.item-tooltip__description :deep(magicDamage){color:#c4b5fd}.item-tooltip__description :deep(physicalDamage){color:#fca5a5}.item-tooltip__description :deep(speed){color:#f5d0fe}
@media(max-width:1100px){.history-row{grid-template-columns:80px 84px 110px minmax(190px,1fr) 160px 22px}.history-farm{display:none}}
@media(max-width:900px){.player-row{grid-template-columns:50px 75px 1fr 95px}.farm,.damage{display:none}.items{grid-column:3/-1}.record-hero{align-items:flex-start;flex-direction:column}.game-summary{align-items:flex-start}.result-overview{grid-template-columns:1fr 90px 1fr}.history-row{grid-template-columns:70px 78px 105px 1fr 22px}.history-time{display:none}.history-items{justify-self:end}.detail-actions{width:100%;justify-content:space-between}}
@media(max-width:600px){.record-page{padding-inline:10px!important}.record-hero{padding:22px}.record-hero h1{font-size:25px}.player-row{grid-template-columns:44px 70px 1fr;padding:10px}.kda{grid-column:3}.items{grid-column:2/-1}.result-overview{padding:15px}.overview-team small{display:none}.history-head{padding:15px}.history-row{grid-template-columns:62px 70px 1fr 20px;gap:9px;min-height:80px;padding:10px 12px}.history-items{display:none}.history-champion .v-avatar{width:46px!important;height:46px!important}.history-champion .spells{display:none}.history-kda strong{font-size:13px}.accordion-detail{padding:12px 8px 16px}.expanded-detail{align-items:flex-start;flex-direction:column}.detail-actions{width:100%;flex-direction:row}.detail-actions .v-btn{width:auto}}
</style>
