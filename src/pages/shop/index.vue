<template>
  <v-container class="shop-page py-8">
    <section class="shop-hero">
      <div>
        <span class="eyebrow">CLANGG REWARD SHOP</span>
        <h1>클랜 상점</h1>
        <p>활동으로 모은 코인으로 프로필 변경권을 구매하세요.</p>
      </div>
      <div class="coin-balance"><v-icon size="26">mdi-circle-multiple</v-icon><div><span>보유 코인</span><strong>{{ overview.balance.toLocaleString() }} C</strong></div></div>
    </section>

    <div v-if="loading" class="loading-state"><v-progress-circular indeterminate color="primary" /><span>상점 정보를 불러오고 있습니다.</span></div>
    <template v-else>
      <section class="section-head"><div><span>SHOP ITEMS</span><h2>변경권 구매</h2></div><small>구매한 변경권은 아이템함에서 사용할 수 있습니다.</small></section>
      <div class="product-grid">
        <article v-for="product in overview.products" :key="product.id" :class="['product-card', product.code.toLowerCase()]">
          <div class="product-icon"><v-icon size="34">{{ productMeta(product.code).icon }}</v-icon></div>
          <div class="product-copy"><span>{{ productMeta(product.code).label }}</span><h3>{{ product.name }}</h3><p>{{ product.description }}</p></div>
          <div class="product-footer"><strong>{{ product.price.toLocaleString() }} C</strong><v-btn color="primary" variant="flat" rounded="lg" :loading="workingId === product.id" :disabled="overview.balance < product.price" @click="purchase(product)">구매</v-btn></div>
          <div class="product-owned">
            <div>
              <span>MY ITEM</span>
              <strong>보유 {{ inventoryFor(product).quantity }}개</strong>
            </div>
            <v-btn
              color="secondary"
              variant="tonal"
              rounded="lg"
              :disabled="inventoryFor(product).quantity < 1"
              @click="openUse(inventoryFor(product))"
            >
              사용하기
            </v-btn>
          </div>
        </article>
      </div>

      <section class="section-head inventory-head"><div><span>HISTORY</span><h2>최근 이용 내역</h2></div></section>
      <v-card class="history-panel" rounded="xl" variant="outlined">
        <div v-for="transaction in overview.transactions" :key="transaction.id" class="history-row">
          <v-icon :color="transaction.type === 'PURCHASE' ? 'warning' : 'success'">{{ transaction.type === 'PURCHASE' ? 'mdi-cart-outline' : 'mdi-ticket-confirmation-outline' }}</v-icon>
          <div><strong>{{ transaction.description }}</strong><span>{{ formatDateTime(transaction.created_at) }}</span></div>
          <b :class="{ minus: transaction.coin_change < 0 }">{{ transaction.coin_change > 0 ? '+' : '' }}{{ transaction.coin_change.toLocaleString() }} C</b>
        </div>
        <div v-if="!overview.transactions.length" class="empty-state compact">이용 내역이 없습니다.</div>
      </v-card>
    </template>

    <v-dialog v-model="useDialog" max-width="520">
      <v-card rounded="xl" class="use-dialog">
        <v-card-title class="use-title"><v-avatar color="secondary" variant="tonal"><v-icon>{{ selectedItem ? productMeta(selectedItem.product.code).icon : 'mdi-ticket' }}</v-icon></v-avatar><div><small>변경권 사용</small><strong>{{ selectedItem?.product.name }}</strong></div></v-card-title>
        <v-card-text>
          <v-text-field v-if="selectedCode === 'NICKNAME_CHANGE'" v-model="nickname" label="새 닉네임" maxlength="20" counter="20" variant="outlined" />
          <template v-else-if="selectedCode === 'LOL_ACCOUNT_CHANGE'">
            <v-alert type="warning" variant="tonal" density="compact" class="mb-4">기존 경기 기록은 유지되며 현재 연동 플레이어만 변경됩니다.</v-alert>
            <div class="riot-inputs"><v-text-field v-model="riotName" label="게임 이름" variant="outlined" /><span>#</span><v-text-field v-model="riotTag" label="태그" variant="outlined" /></div>
          </template>
          <v-select v-else-if="selectedCode === 'POSITION_CHANGE'" v-model="positionCodes" :items="positions" item-title="name" item-value="code" label="포지션 1~2개" variant="outlined" multiple chips :counter="2" />
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn variant="text" :disabled="usingItem" @click="useDialog = false">취소</v-btn><v-btn color="primary" variant="flat" :loading="usingItem" :disabled="!canUse" @click="useItem">변경권 사용</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="purchaseDialog" max-width="420">
      <v-card rounded="xl" class="pa-2"><v-card-title>변경권을 구매할까요?</v-card-title><v-card-text><strong>{{ selectedProduct?.name }}</strong>을 {{ selectedProduct?.price.toLocaleString() }} 코인에 구매합니다.</v-card-text><v-card-actions><v-spacer /><v-btn variant="text" @click="purchaseDialog = false">취소</v-btn><v-btn color="primary" variant="flat" :loading="purchasing" @click="confirmPurchase">구매하기</v-btn></v-card-actions></v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.message }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import api from '@/@core/composable/useAxios';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { useAccountStore } from '@/stores/useAccountStore';

type ProductCode = 'NICKNAME_CHANGE' | 'LOL_ACCOUNT_CHANGE' | 'POSITION_CHANGE';
interface Product { id: number; code: ProductCode; name: string; description: string; price: number }
interface InventoryItem { id: number; quantity: number; product: Product }
interface ShopTransaction { id: number; type: string; coin_change: number; description: string; created_at: string }
interface PositionOption { name: string; code: string }
const account = useAccountStore();
const loading = ref(true); const workingId = ref(0); const purchasing = ref(false); const usingItem = ref(false);
const overview = ref<{ balance: number; products: Product[]; inventory: InventoryItem[]; transactions: ShopTransaction[] }>({ balance: 0, products: [], inventory: [], transactions: [] });
const purchaseDialog = ref(false); const selectedProduct = ref<Product | null>(null); const useDialog = ref(false); const selectedItem = ref<InventoryItem | null>(null);
const nickname = ref(''); const riotName = ref(''); const riotTag = ref(''); const positionCodes = ref<string[]>([]); const positions = ref<PositionOption[]>([]);
const snackbar = ref({ show: false, message: '', color: 'success' });
const selectedCode = computed(() => selectedItem.value?.product.code);
const canUse = computed(() => selectedCode.value === 'NICKNAME_CHANGE' ? nickname.value.trim().length >= 2 : selectedCode.value === 'LOL_ACCOUNT_CHANGE' ? !!riotName.value.trim() && !!riotTag.value.trim() : selectedCode.value === 'POSITION_CHANGE' ? positionCodes.value.length >= 1 && positionCodes.value.length <= 2 : false);
const metas: Record<ProductCode, { icon: string; label: string }> = {
  NICKNAME_CHANGE: { icon: 'mdi-card-account-details-outline', label: 'PROFILE' },
  LOL_ACCOUNT_CHANGE: { icon: 'mdi-link-variant', label: 'RIOT ACCOUNT' },
  POSITION_CHANGE: { icon: 'mdi-map-marker-path', label: 'POSITION' },
};
function productMeta(code: ProductCode) { return metas[code] ?? { icon: 'mdi-ticket', label: 'ITEM' }; }
function inventoryFor(product: Product): InventoryItem {
  return overview.value.inventory.find((item) => item.product.id === product.id)
    ?? { id: 0, quantity: 0, product };
}
function show(message: string, color = 'success') { snackbar.value = { show: true, message, color }; }
async function loadShop() { loading.value = true; try { const response = await api.get(`${getBaseUrl('DATA')}/shop`); overview.value = response.data.datas; } catch (error) { console.error(error); show('상점 정보를 불러오지 못했습니다.', 'error'); } finally { loading.value = false; } }
function purchase(product: Product) { selectedProduct.value = product; purchaseDialog.value = true; }
async function confirmPurchase() { if (!selectedProduct.value) return; purchasing.value = true; workingId.value = selectedProduct.value.id; try { const response = await api.post(`${getBaseUrl('DATA')}/shop/purchase`, { product_id: selectedProduct.value.id }); overview.value = response.data.datas; purchaseDialog.value = false; show('변경권을 구매했습니다.'); } catch (error: any) { show(error?.response?.data?.message || '변경권을 구매하지 못했습니다.', 'error'); } finally { purchasing.value = false; workingId.value = 0; } }
function openUse(item: InventoryItem) { selectedItem.value = item; nickname.value = account.nickname || ''; riotName.value = ''; riotTag.value = ''; positionCodes.value = []; useDialog.value = true; }
async function useItem() { if (!selectedItem.value || !canUse.value) return; usingItem.value = true; try { let response; if (selectedCode.value === 'NICKNAME_CHANGE') { response = await api.post(`${getBaseUrl('DATA')}/shop/use/nickname`, { nickname: nickname.value.trim() }); account.nickname = nickname.value.trim(); } else if (selectedCode.value === 'LOL_ACCOUNT_CHANGE') { response = await api.post(`${getBaseUrl('DATA')}/shop/use/lol-account`, { nickname: riotName.value.trim(), tagname: riotTag.value.trim() }); } else { response = await api.post(`${getBaseUrl('DATA')}/shop/use/positions`, { position_codes: positionCodes.value }); } overview.value = response.data.datas; useDialog.value = false; show('변경권을 사용했습니다.'); } catch (error: any) { show(error?.response?.data?.message || '변경권을 사용하지 못했습니다.', 'error'); } finally { usingItem.value = false; } }
function formatDateTime(value: string) { return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
onMounted(async () => { await Promise.all([loadShop(), api.get(`${getBaseUrl('DATA')}/position/all`).then((response) => { positions.value = response.data.datas ?? []; }).catch(() => undefined)]); });
</script>

<style scoped>
.shop-page{max-width:1280px}.shop-hero{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:32px 36px;border:1px solid rgba(var(--v-theme-primary),.28);border-radius:26px;background:radial-gradient(circle at 80% 0,rgba(var(--v-theme-primary),.32),transparent 38%),linear-gradient(135deg,#151323,#28203e);box-shadow:0 20px 45px rgba(0,0,0,.18)}.eyebrow,.section-head span{color:#b794f6;font-size:.68rem;font-weight:900;letter-spacing:.14em}.shop-hero h1{margin:5px 0;font-size:2rem}.shop-hero p{margin:0;color:rgba(255,255,255,.58)}.coin-balance{display:flex;align-items:center;gap:13px;min-width:190px;padding:17px 20px;border:1px solid rgba(255,213,79,.28);border-radius:18px;color:#ffd54f;background:rgba(255,193,7,.09)}.coin-balance>div{display:flex;flex-direction:column}.coin-balance span{font-size:.68rem}.coin-balance strong{font-size:1.45rem}.loading-state,.empty-state{display:flex;align-items:center;flex-direction:column;gap:10px;padding:70px;color:rgba(var(--v-theme-on-surface),.55)}.section-head{display:flex;align-items:flex-end;justify-content:space-between;margin:32px 4px 14px}.section-head h2{margin:2px 0 0}.section-head small{color:rgba(var(--v-theme-on-surface),.48)}.product-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.product-card{display:flex;min-height:350px;flex-direction:column;padding:23px;border:1px solid rgba(var(--v-border-color),.8);border-radius:22px;background:linear-gradient(145deg,rgba(var(--v-theme-surface),.95),rgba(var(--v-theme-primary),.045));box-shadow:0 14px 30px rgba(0,0,0,.1)}.product-icon{display:grid;width:60px;height:60px;place-items:center;border-radius:17px;color:#b794f6;background:rgba(var(--v-theme-primary),.13)}.product-copy{flex:1;margin-top:18px}.product-copy>span,.product-owned span{color:rgba(var(--v-theme-on-surface),.4);font-size:.62rem;font-weight:900;letter-spacing:.13em}.product-copy h3{margin:3px 0 7px;font-size:1.2rem}.product-copy p{margin:0;color:rgba(var(--v-theme-on-surface),.56);font-size:.8rem}.product-footer{display:flex;align-items:center;justify-content:space-between;margin-top:20px}.product-footer strong{color:#ffd166;font-size:1.2rem}.product-owned{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:20px -23px -23px;padding:16px 23px;border-top:1px solid rgba(var(--v-border-color),.65);border-radius:0 0 21px 21px;background:rgba(var(--v-theme-primary),.055)}.product-owned>div{display:flex;flex-direction:column;gap:2px}.product-owned strong{font-size:.9rem}.inventory-head{margin-top:38px}.history-panel{overflow:hidden}.history-row{display:grid;grid-template-columns:32px 1fr auto;align-items:center;gap:10px;padding:14px 20px;border-bottom:1px solid rgba(var(--v-border-color),.6)}.history-row:last-child{border-bottom:0}.history-row>div{display:flex;flex-direction:column}.history-row span{color:rgba(var(--v-theme-on-surface),.45);font-size:.68rem}.history-row b{color:#5ee2a0}.history-row b.minus{color:#ffb74d}.empty-state.compact{padding:35px}.use-dialog{padding:8px}.use-title{display:flex;align-items:center;gap:12px}.use-title>div{display:flex;flex-direction:column}.use-title small{color:rgba(var(--v-theme-on-surface),.45);font-size:.65rem}.riot-inputs{display:grid;grid-template-columns:1fr 18px 120px;align-items:center;gap:8px}.riot-inputs>span{text-align:center;font-size:1.2rem;font-weight:900}@media(max-width:900px){.product-grid{grid-template-columns:1fr}.shop-hero{align-items:flex-start;flex-direction:column}.coin-balance{width:100%}}@media(max-width:600px){.shop-page{padding-inline:12px!important}.shop-hero{padding:24px}.section-head small{display:none}.riot-inputs{grid-template-columns:1fr 12px 90px}}
</style>
