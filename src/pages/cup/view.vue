<template>
  <!-- ✅ 페이지 전역 팬/줌 래퍼 -->
  <div
    class="page-wrap"
    ref="pageWrap"
    @mousedown="onPanStart"
    @mousemove="onPanMove"
    @mouseup="onPanEnd"
    @mouseleave="onPanEnd"
    @wheel.passive="onWheelZoom"
    @dblclick="resetZoom"
  >
    <!-- ✅ 실제 콘텐츠: 여기에 scale(zoom) 적용 -->
    <div
      class="page-inner"
      ref="pageInner"
      :style="{ transform: `scale(${zoom})`, transformOrigin: 'top left' }"
    >
      <v-container class="pa-6">
        <!-- 상단 컨트롤 -->
        <div class="d-flex justify-center mb-6" style="gap: 16px">
          <v-btn
            v-if="can('CUP', 'SYS-SET-CUP-C')"
            color="primary"
            @click="shot"
            :disabled="isConfirmed"
            >SHOT</v-btn
          >
          <v-btn
            v-if="can('CUP', 'SYS-SET-CUP-C')"
            color="success"
            @click="confirm"
            :disabled="isConfirmed"
            >CONFIRM</v-btn
          >
        </div>

        <!-- 4팀 컬럼 -->
        <v-row dense>
          <v-col
            v-for="team in teams"
            :key="team.key"
            cols="12"
            sm="6"
            md="3"
            class="d-flex flex-column"
          >
            <!-- 팀 헤더 -->
            <v-card class="mb-3 team-header" rounded="xl">
              <v-card-text class="py-3">
                <div class="text-subtitle-1 font-weight-medium mb-1">팀명 : {{ team.name }}</div>
                <div class="text-body-2">
                  총점 : <strong>{{ teamTotal(team).toLocaleString() }}</strong>
                </div>
              </v-card-text>
            </v-card>

            <!-- 팀 멤버 슬롯 -->
            <v-card class="team-body" rounded="xl">
              <v-card-text class="py-3">
                <div v-for="(member, idx) in team.cup_members" :key="idx" class="mb-2">
                  <v-card
                    rounded="xl"
                    class="px-3 py-2 d-flex align-center justify-space-between member-card"
                  >
                    <div class="d-flex flex-column">
                      <span class="text-body-2 font-weight-medium">
                        {{ member.player.nickname }}#{{ member.player.tagname }}
                      </span>
                      <span class="text-caption text-medium-emphasis">
                        Tier: {{ member.player.tier.name }}
                      </span>
                      <span class="text-caption text-medium-emphasis">
                        Point: {{ member.player.tier.point }}
                      </span>
                    </div>
                  </v-card>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- 스낵바 -->
        <v-snackbar v-model="snackbar.show" :timeout="2000">
          {{ snackbar.msg }}
        </v-snackbar>
      </v-container>

      <section class="bracket-section">
        <div class="text-center mb-4">
          <div class="text-h6">Single Elimination</div>
        </div>

        <!-- 기존 브래킷 래퍼는 스크롤만 담당 -->
        <div class="bracket-wrap" ref="bracketWrap">
          <div class="bracket" ref="bracketRail">
            <div v-for="(round, rIdx) in rounds" :key="rIdx" class="round">
              <div class="round-title sticky">
                {{ rIdx === rounds.length - 1 ? 'FINAL' : `ROUND ${rIdx + 1}` }}
              </div>

              <div v-for="(m, mIdx) in round" :key="mIdx" class="match">
                <!-- 부전승 칩: R1에서만, 한쪽이 null -->
                <div v-if="isBye(m, rIdx)" class="bye-chip">부전승</div>

                <!-- A 쪽 -->
                <v-card
                  class="seed"
                  :class="[{ winner: m.winner === m.a }, { bye: isByeSide('a', m, rIdx) }]"
                  variant="flat"
                  density="compact"
                  @click="canPick('a', m, rIdx) && pickWinner(rIdx, mIdx, 'a')"
                >
                  <v-card-text class="py-1 px-3">
                    {{ displayLabel('a', m, rIdx) }}
                  </v-card-text>
                </v-card>

                <!-- B 쪽 -->
                <v-card
                  class="seed"
                  :class="[{ winner: m.winner === m.b }, { bye: isByeSide('b', m, rIdx) }]"
                  variant="flat"
                  density="compact"
                  @click="canPick('b', m, rIdx) && pickWinner(rIdx, mIdx, 'b')"
                >
                  <v-card-text class="py-1 px-3">
                    {{ displayLabel('b', m, rIdx) }}
                  </v-card-text>
                </v-card>

                <div v-if="rIdx < rounds.length - 1" class="connector"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    <!-- /page-inner -->
  </div>
  <!-- /page-wrap -->
</template>

<script lang="ts" setup>
import { can } from '@/stores/usePermissionStore';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { nextTick, onMounted, ref, watch } from 'vue';
import api from '@/@core/composable/useAxios';
import { useRoute } from 'vue-router';
import type { Cup, CupMember, CupTeam } from '@/data/types/cup';
const route = useRoute();

const TEAM_SIZE = ref<number>(0);
const TEAM_LABELS = ref<string[]>([]);
const cup = ref<Cup | null>(null);
const teams = ref<CupTeam[]>([]);
const isConfirmed = ref(false);
const snackbar = ref({ show: false, msg: '' });

const teamTotal = (team: CupTeam) =>
  team.cup_members.reduce((sum, m) => sum + (m.player?.tier.point ?? 0), 0);

watch(
  teams,
  (val) => {
    if (val.length) buildBracketFromTeams(val.map((t) => t.name));
  },
  { deep: true }
);

/* ---------- 전역 팬/줌 래퍼 ---------- */
const pageWrap = ref<HTMLDivElement | null>(null); // 스크롤 주체
const pageInner = ref<HTMLDivElement | null>(null); // transform(scale) 적용

/* 기존 브래킷 레퍼런스는 레이아웃 계산용 */
const bracketWrap = ref<HTMLDivElement | null>(null);
const bracketRail = ref<HTMLDivElement | null>(null);

/* 브래킷 높이/가운데 정렬 */
async function fitBracketHeight() {
  await nextTick();
  const rail = bracketRail.value;
  if (!rail) return;
  const cols = Array.from(rail.querySelectorAll<HTMLElement>('.round'));
  const tallest = cols.reduce((m, el) => Math.max(m, el.offsetHeight), 0);
  rail.style.minHeight = `${tallest}px`;
}

async function centerBracket() {
  await nextTick();
  const wrap = pageWrap.value;
  const inner = pageInner.value;
  const rail = bracketRail.value;
  if (!wrap || !inner || !rail) return;

  // 현재 줌 반영하여 브래킷 중앙이 화면 중앙에 오도록 가로 스크롤 조정
  const zoomedWidth = inner.scrollWidth * zoom.value;
  const target = Math.max(0, (zoomedWidth - wrap.clientWidth) / 2 / Math.max(zoom.value, 0.01));
  wrap.scrollLeft = target;
}

/* ---------- Pan(중클릭) ---------- */
const isPanning = ref(false);
const panState = { x: 0, y: 0, sl: 0, st: 0 };

function onPanStart(e: MouseEvent) {
  if (e.button !== 1) return; // 가운데 버튼만
  const wrap = pageWrap.value;
  if (!wrap) return;
  isPanning.value = true;
  panState.x = e.clientX;
  panState.y = e.clientY;
  panState.sl = wrap.scrollLeft;
  panState.st = wrap.scrollTop;
  wrap.classList.add('is-panning');
  e.preventDefault();
}
function onPanMove(e: MouseEvent) {
  if (!isPanning.value) return;
  const wrap = pageWrap.value;
  if (!wrap) return;
  wrap.scrollLeft = panState.sl - (e.clientX - panState.x);
  wrap.scrollTop = panState.st - (e.clientY - panState.y);
}
function onPanEnd() {
  if (!isPanning.value) return;
  const wrap = pageWrap.value;
  if (wrap) wrap.classList.remove('is-panning');
  isPanning.value = false;
}

/* ---------- Zoom(Ctrl/⌘+휠) ---------- */
const zoom = ref(1);
const Z_MIN = 0.6,
  Z_MAX = 2.0,
  Z_STEP = 0.1;

function onWheelZoom(e: WheelEvent) {
  if (!(e.ctrlKey || e.metaKey)) return; // 일반 휠 스크롤은 그대로
  e.preventDefault();

  const wrap = pageWrap.value;
  const inner = pageInner.value;
  if (!wrap || !inner) return;

  const oldZ = zoom.value;
  const dir = e.deltaY > 0 ? -1 : 1;
  const nextZ = Math.min(Z_MAX, Math.max(Z_MIN, +(oldZ + dir * Z_STEP).toFixed(2)));
  if (nextZ === oldZ) return;

  // 포인터 기준 줌 고정
  const r1 = inner.getBoundingClientRect();
  const ox = (e.clientX - r1.left) / oldZ;
  const oy = (e.clientY - r1.top) / oldZ;

  zoom.value = nextZ;

  nextTick().then(() => {
    const r2 = inner.getBoundingClientRect();
    const nx = ox * nextZ - (e.clientX - r2.left);
    const ny = oy * nextZ - (e.clientY - r2.top);
    wrap.scrollLeft += nx;
    wrap.scrollTop += ny;
  });
}

function resetZoom() {
  zoom.value = 1;
  centerBracket();
}

/* ---------- 데이터 로드 ---------- */
async function fetch() {
  const { data } = await api.get(`${getBaseUrl('DATA')}/cup/find?id=${route.params.id}`);
  cup.value = data.datas;
  isConfirmed.value = data.datas.is_confirm;

  TEAM_SIZE.value = cup.value?.cup_teams.length as number;

  for (let i = 0; i < TEAM_SIZE.value; i++) {
    TEAM_LABELS.value.push(String.fromCharCode(65 + i));
  }

  let ttt: any[];
  if (cup.value?.cup_teams && cup.value.cup_teams.length > 0) {
    TEAM_SIZE.value = cup.value?.cup_teams.length;
    for (let i = 0; i < TEAM_SIZE.value; i++) {
      TEAM_LABELS.value.push(cup.value?.cup_teams[i].name);
    }
    ttt = cup.value.cup_teams.map((team) => ({
      key: team.name,
      name: team.name,
      cup_members: team.cup_members,
    }));
    teams.value = ttt;
  } else {
    TEAM_SIZE.value = (cup.value?.cup_members.length as number) / 5;
    for (let i = 0; i < TEAM_SIZE.value; i++) {
      TEAM_LABELS.value.push(String.fromCharCode(65 + i));
    }
    const members: CupMember[] = cup.value?.cup_members ?? [];
    teams.value = buildTeams(members);
  }

  buildBracketFromTeams(teams.value.map((t) => t.name));
  await fitBracketHeight();
  await centerBracket();
}

function buildTeams(members: CupMember[]): CupTeam[] {
  return TEAM_LABELS.value.map((label, idx) => ({
    key: label,
    name: label,
    cup_members: members.slice(idx * 5, (idx + 1) * 5),
  }));
}

/* ---------- 샷/컨펌 로직은 기존 그대로 ---------- */
// ... (네가 쓰던 shot(), confirm() 그대로 유지 — 아래에 그대로 둠)
async function shot() {
  if (isConfirmed.value) {
    snackbar.value = { show: true, msg: '이미 확정된 매치입니다.' };
    return;
  }
  if (!cup.value) return;

  const base = [...(cup.value.cup_members ?? [])];
  const teamCount = teams.value.length || Math.ceil(base.length / 5);
  const teamSize = teams.value[0]?.cup_members.length || 5;
  const labels = Array.from({ length: teamCount }, (_, i) => String.fromCharCode(65 + i));
  const score = (m: CupMember) => (m.player?.tier?.point ?? 0) + (m.player?.point ?? 0);

  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  base.sort((a, b) => {
    const diff = score(b) - score(a);
    return diff !== 0 ? diff : Math.random() - 0.5;
  });

  const acc = labels.map((l) => ({ key: l, name: l, cup_members: [] as CupMember[], sum: 0 }));
  for (const m of base) {
    const candidates = acc.filter((t) => t.cup_members.length < teamSize);
    const minSum = Math.min(...candidates.map((t) => t.sum));
    const ties = candidates
      .map((t) => ({ t, idx: acc.indexOf(t) }))
      .filter((x) => x.t.sum === minSum);
    const pick = ties[Math.floor(Math.random() * ties.length)].idx;
    acc[pick].cup_members.push(m);
    acc[pick].sum += score(m);
  }

  const maxDiff = 200,
    maxPasses = 300;
  const curDiff = () => {
    const sums = acc.map((t) => t.sum);
    return Math.max(...sums) - Math.min(...sums);
  };

  let passes = 0,
    improved = true;
  while (passes < maxPasses && curDiff() > maxDiff && improved) {
    passes++;
    improved = false;
    let maxIdx = 0,
      minIdx = 0;
    for (let i = 1; i < acc.length; i++) {
      if (acc[i].sum > acc[maxIdx].sum) maxIdx = i;
      if (acc[i].sum < acc[minIdx].sum) minIdx = i;
    }
    const strong = acc[maxIdx],
      weak = acc[minIdx];

    let bestGain = 0,
      ai = -1,
      bi = -1;
    for (let i = 0; i < strong.cup_members.length; i++) {
      const a = strong.cup_members[i],
        as = score(a);
      for (let j = 0; j < weak.cup_members.length; j++) {
        const b = weak.cup_members[j],
          bs = score(b);
        const before = Math.abs(strong.sum - weak.sum);
        const after = Math.abs(strong.sum - as + bs - (weak.sum - bs + as));
        const gain = before - after;
        if (gain > bestGain) {
          bestGain = gain;
          ai = i;
          bi = j;
        }
      }
    }
    if (bestGain > 0 && ai >= 0 && bi >= 0) {
      const a = strong.cup_members[ai],
        as = score(a);
      const b = weak.cup_members[bi],
        bs = score(b);
      strong.cup_members.splice(ai, 1, b);
      weak.cup_members.splice(bi, 1, a);
      strong.sum = strong.sum - as + bs;
      weak.sum = weak.sum - bs + as;
      improved = true;
    }
  }

  teams.value = acc.map((t) => ({ key: t.key, name: t.name, cup_members: t.cup_members }));
  buildBracketFromTeams(teams.value.map((t) => t.name));
  await fitBracketHeight();
  await centerBracket();
  snackbar.value = { show: true, msg: '밸런스를 고려해 팀을 재배치했습니다.' };
}

async function confirm() {
  if (isConfirmed.value) return;
  isConfirmed.value = true;
  snackbar.value = { show: true, msg: '팀 구성이 확정되었습니다.' };

  try {
    await api.post(`${getBaseUrl('DATA')}/cup/update`, {
      id: route.params.id,
      is_confirm: isConfirmed.value,
    });
  } catch (error: any) {
    console.error('Cup 업데이트 실패:', error);
  }

  for (const team of teams.value) {
    try {
      await api.post(`${getBaseUrl('DATA')}/cupteam/create`, {
        cup_id: route.params.id,
        name: team.name,
        cup_members: team.cup_members,
      });
    } catch (error: any) {
      console.error('Match 생성 실패:', error);
    }
  }
}

function isBye(m: BracketMatch, rIdx: number) {
  // 부전승은 R1에서만 표기: 한쪽만 있고 다른쪽이 null
  return rIdx === 0 && !!((m.a && !m.b) || (!m.a && m.b));
}

function isByeSide(side: 'a' | 'b', m: BracketMatch, rIdx: number) {
  if (!isBye(m, rIdx)) return false;
  return side === 'a' ? !m.a && !!m.b : !m.b && !!m.a;
}

function displayLabel(side: 'a' | 'b', m: BracketMatch, rIdx: number) {
  const name = side === 'a' ? m.a : m.b;
  if (name) return name;

  // R1에서 진짜 부전승인 빈 슬롯은 '부전승' 표기
  if (isByeSide(side, m, rIdx)) return '부전승';

  // 그 외에는 미정 슬롯
  return '？';
}

function canPick(side: 'a' | 'b', m: BracketMatch, rIdx: number) {
  const name = side === 'a' ? m.a : m.b;
  // 빈 슬롯은 클릭 불가
  if (!name) return false;
  // 부전승으로 이미 결정된 매치는 클릭 불필요
  if (isBye(m, rIdx)) return false;
  return true;
}

/* ---------- 브래킷 데이터 ---------- */
type BracketMatch = { a: string | null; b: string | null; winner?: string | null };
const rounds = ref<BracketMatch[][]>([]);

function propagateWinners() {
  for (let rIdx = 0; rIdx < rounds.value.length - 1; rIdx++) {
    const cur = rounds.value[rIdx];
    const nxt = rounds.value[rIdx + 1];

    for (let mIdx = 0; mIdx < cur.length; mIdx++) {
      const m = cur[mIdx];
      if (!m.winner) continue;

      const nextIdx = Math.floor(mIdx / 2);
      const isLeft = mIdx % 2 === 0;
      const nm = nxt[nextIdx];

      if (isLeft) nm.a = m.winner;
      else nm.b = m.winner;

      // 다음 매치에 이미 다른 승자가 들어와 있었고 충돌하면 초기화
      if (nm.winner && nm.winner !== m.winner) nm.winner = null;
    }
  }
}

function seedOrder(size: number): number[] {
  if (size === 1) return [1];
  const prev = seedOrder(size / 2);
  const mirror = prev.map((x) => size + 1 - x);
  return prev.concat(mirror);
}

// 🔽 다음 2의 거듭제곱
function nextPow2(n: number) {
  return 1 << Math.ceil(Math.log2(Math.max(1, n)));
}

function buildBracketFromTeams(teamNames: string[]) {
  const n = teamNames.length;
  const size = nextPow2(n); // 예: 12 -> 16
  const order = seedOrder(size); // 길이 size, 1-based 시드 순서
  const slots: (string | null)[] = Array(size).fill(null);

  // 시드 순서에 맞춰 팀을 앞에서부터 채우기
  // 남는 시드는 null로 남아 자동 부전승이 됨
  for (let i = 0; i < n; i++) {
    const pos = order[i] - 1; // 0-based 인덱스
    slots[pos] = teamNames[i];
  }

  // Round 1: 슬롯을 2개씩 페어링 (null-null 매치는 생성되지 않음)
  const r1: BracketMatch[] = [];
  for (let i = 0; i < size; i += 2) {
    const a = slots[i] ?? null;
    const b = slots[i + 1] ?? null;

    // 둘 다 null이면 스킵 (이론상 seedOrder 배치면 발생하지 않지만 안전망)
    if (!a && !b) continue;

    const m: BracketMatch = { a, b, winner: null };
    // 한쪽만 있으면 R1 부전승
    if (a && !b) m.winner = a;
    if (!a && b) m.winner = b;

    r1.push(m);
  }

  // 이후 라운드 골격: R1 길이의 절반씩
  const rAll: BracketMatch[][] = [r1];
  let sizeR = r1.length;
  while (sizeR > 1) {
    sizeR = Math.floor(sizeR / 2);
    rAll.push(Array.from({ length: sizeR }, () => ({ a: null, b: null, winner: null })));
  }

  rounds.value = rAll;

  // 부전승 등 이미 결정된 승자 전파
  propagateWinners();
}
function pickWinner(rIdx: number, mIdx: number, side: 'a' | 'b') {
  const m = rounds.value[rIdx][mIdx];
  const name = side === 'a' ? m.a : m.b;
  if (!name) return;
  m.winner = name;

  if (rIdx >= rounds.value.length - 1) return;
  const nextIdx = Math.floor(mIdx / 2);
  const isLeft = mIdx % 2 === 0;
  const nextMatch = rounds.value[rIdx + 1][nextIdx];
  if (isLeft) nextMatch.a = name;
  else nextMatch.b = name;
  if (nextMatch.winner && nextMatch.winner !== name) nextMatch.winner = null;
}

onMounted(() => {
  setTimeout(() => {
    if (teams.value.length) buildBracketFromTeams(teams.value.map((t) => t.name));
  }, 0);
});
onMounted(fetch);
</script>

<style scoped>
/* ✅ 전역 팬/줌 컨테이너 */
.page-wrap {
  position: relative;
  height: 100vh; /* 화면 가득 */
  overflow: auto; /* 가로/세로 스크롤 모두 */
  cursor: grab;
}
.page-wrap.is-panning {
  cursor: grabbing;
  user-select: none;
}

/* scale 대상 */
.page-inner {
  min-width: 100%; /* 축소 시 좌여백 방지 */
}

/* 기존 스타일 그대로 */
.team-header {
  text-align: center;
}
.team-body {
  background-color: #1f2933;
}
.member-card {
  background-color: #243447;
  color: #fff;
}

.bracket-section {
  margin-top: 48px;
  padding-bottom: 120px;
}

.bracket-wrap {
  overflow-x: auto;
  overflow-y: auto;
  max-height: none; /* 전역 스크롤이 있으니 제한 해제 */
  padding: 16px 0 24px;
  display: flex;
  justify-content: center;
}

.bracket {
  display: flex;
  gap: 32px;
  width: max-content;
  min-height: 100%;
  padding: 0 8px;
  align-items: stretch;
}

.round {
  min-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
}
.round-title {
  text-align: center;
  font-weight: 600;
  opacity: 0.9;
  margin-bottom: 4px;
}
.round-title.sticky {
  position: sticky;
  top: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  z-index: 1;
  padding: 6px 0;
  border-radius: 8px;
}
.match {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.seed {
  background: #243447;
  color: #fff;
  cursor: pointer;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.2;
}
.seed.winner {
  outline: 2px solid #ffd54f;
  box-shadow: 0 0 0 2px #ffd54f inset;
}
.connector {
  position: absolute;
  right: -16px;
  top: 50%;
  width: 16px;
  height: 2px;
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-50%);
}

@media (max-width: 768px) {
  .round {
    min-width: 220px;
  }
}

.bye-chip {
  position: absolute;
  top: -10px;
  right: -8px;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  background: #ffd54f;
  color: #222;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.seed.bye {
  opacity: 0.7;
  pointer-events: none; /* 빈 슬롯 클릭 방지 */
  border-style: dashed;
}
</style>
