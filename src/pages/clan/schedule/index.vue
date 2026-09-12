<template>
  <v-container fluid class="schedule-page pa-4 pa-md-7">
    <header class="schedule-hero">
      <div>
        <span>CLAN CALENDAR</span>
        <h1>클랜 일정</h1>
        <p>파티, 대회와 클랜 이벤트 일정을 한곳에서 확인하세요.</p>
      </div>
      <v-btn v-if="canCreate" color="primary" rounded="lg" prepend-icon="mdi-calendar-plus" @click="openCreate(selectedDate)">일정 등록</v-btn>
    </header>

    <div class="calendar-toolbar">
      <div class="month-control">
        <v-btn icon="mdi-chevron-left" variant="text" @click="moveMonth(-1)" />
        <h2>{{ monthTitle }}</h2>
        <v-btn icon="mdi-chevron-right" variant="text" @click="moveMonth(1)" />
      </div>
      <v-btn variant="tonal" rounded="lg" @click="goToday">오늘</v-btn>
    </div>

    <div class="calendar-layout">
      <section class="calendar-panel">
        <div class="weekdays"><span v-for="day in weekdays" :key="day">{{ day }}</span></div>
        <div v-if="loading" class="calendar-loading"><v-progress-circular indeterminate color="primary" /></div>
        <div v-else class="calendar-grid">
          <button
            v-for="day in calendarDays"
            :key="day.key"
            type="button"
            :class="['calendar-day', !day.currentMonth && 'outside', day.isToday && 'today', day.key === selectedKey && 'selected']"
            @click="selectedDate = day.date"
            @dblclick="canCreate && openCreate(day.date)"
          >
            <span class="day-number">{{ day.date.getDate() }}</span>
            <div class="day-events">
              <span
                v-for="event in eventsForDay(day.date).slice(0, 3)"
                :key="`${event.source}-${event.id}`"
                :class="['event-pill', eventMeta(event).className, eventSegment(event, day.date)]"
                :title="`${timeRange(event)} ${event.title}`"
              >
                <template v-if="showEventLabel(event, day.date)">{{ timeLabel(event) }} {{ event.title }}</template>
                <template v-else>&nbsp;</template>
              </span>
              <small v-if="eventsForDay(day.date).length > 3">+{{ eventsForDay(day.date).length - 3 }}개</small>
            </div>
          </button>
        </div>
      </section>

      <aside class="agenda-panel">
        <div class="agenda-head">
          <div><span>{{ selectedDateLabel }}</span><h2>일정</h2></div>
          <v-btn v-if="canCreate" icon="mdi-plus" color="primary" variant="tonal" size="small" @click="openCreate(selectedDate)" />
        </div>
        <div v-if="!selectedEvents.length" class="empty-agenda"><v-icon size="36">mdi-calendar-blank-outline</v-icon><p>등록된 일정이 없습니다.</p></div>
        <div v-else class="agenda-list">
          <button v-for="event in selectedEvents" :key="`${event.source}-${event.id}`" type="button" class="agenda-card" @click="openEvent(event)">
            <i :class="eventMeta(event).className" />
            <div class="agenda-content">
              <span>{{ eventMeta(event).label }} · {{ timeRange(event) }}</span>
              <strong>{{ event.title }}</strong>
            </div>
            <v-icon size="18">mdi-chevron-right</v-icon>
          </button>
        </div>
      </aside>
    </div>

    <v-dialog v-model="formDialog" max-width="620">
      <v-card rounded="xl">
        <v-card-title class="dialog-title"><span>{{ editingId ? '일정 수정' : '새 일정 등록' }}</span><v-btn icon="mdi-close" variant="text" @click="formDialog=false" /></v-card-title>
        <v-card-text class="pa-6 pt-2">
          <v-select v-model="form.schedule_type" :items="typeOptions" item-title="label" item-value="value" label="일정 유형" variant="outlined" />
          <v-text-field v-model="form.title" label="일정 제목" maxlength="100" counter variant="outlined" />
          <v-textarea v-model="form.description" label="설명" maxlength="1000" counter rows="3" variant="outlined" />
          <v-switch v-model="form.is_all_day" label="종일 일정" color="primary" inset />
          <v-row dense>
            <v-col cols="12" sm="6"><v-text-field v-model="form.starts_at" :type="form.is_all_day ? 'date' : 'datetime-local'" label="시작" variant="outlined" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.ends_at" :type="form.is_all_day ? 'date' : 'datetime-local'" label="종료 (선택)" variant="outlined" clearable /></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="px-6 pb-6 justify-space-between">
          <v-btn v-if="editingId && activeEvent?.can_delete" color="error" variant="tonal" :loading="saving" @click="deleteEvent">삭제</v-btn><span v-else />
          <div><v-btn variant="text" @click="formDialog=false">취소</v-btn><v-btn color="primary" :loading="saving" :disabled="!form.title.trim() || !form.starts_at" @click="saveEvent">저장</v-btn></div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="detailDialog" max-width="520">
      <v-card v-if="activeEvent" rounded="xl">
        <v-card-title class="dialog-title"><span>{{ activeEvent.title }}</span><v-btn icon="mdi-close" variant="text" @click="detailDialog=false" /></v-card-title>
        <v-card-text class="px-6 pb-3">
          <v-chip size="small" :color="eventMeta(activeEvent).color" variant="tonal" class="mb-4">{{ eventMeta(activeEvent).label }}</v-chip>
          <div class="detail-row"><v-icon>mdi-clock-outline</v-icon><span>{{ detailDate(activeEvent) }}</span></div>
          <p class="detail-description">{{ activeEvent.description || '등록된 설명이 없습니다.' }}</p>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-btn v-if="activeEvent.discord_url" :href="activeEvent.discord_url" target="_blank" color="indigo" variant="tonal" prepend-icon="mdi-open-in-new">Discord</v-btn>
          <v-spacer />
          <v-btn v-if="activeEvent.source === 'NOTICE' && activeEvent.can_delete" color="error" variant="tonal" @click="deleteNoticeSchedule(activeEvent)">달력에서 삭제</v-btn>
          <v-btn v-if="relatedPath(activeEvent)" color="primary" variant="tonal" @click="goRelated(activeEvent)">관련 화면</v-btn>
          <v-btn v-if="activeEvent.source === 'MANUAL' && activeEvent.can_edit" color="primary" @click="openEdit(activeEvent)">수정</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.message }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/@core/composable/useAxios';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { useAccountStore } from '@/stores/useAccountStore';
import { can } from '@/stores/useClanPermissionStore';
import { CLAN_PATH } from '@/router/clan/type';

type Source = 'MANUAL'|'NOTICE'|'PARTY'|'AUCTION'|'CLAN_MATCH';
interface CalendarEvent { id:number; source:Source; board_id?:number|null; title:string; description?:string|null; schedule_type:string; starts_at:string; ends_at?:string|null; location?:string|null; discord_url?:string|null; is_all_day:boolean; can_edit?:boolean; can_delete?:boolean; }
const account=useAccountStore(); const router=useRouter();
const loading=ref(false), saving=ref(false), formDialog=ref(false), detailDialog=ref(false);
const events=ref<CalendarEvent[]>([]), activeEvent=ref<CalendarEvent|null>(null), editingId=ref<number|null>(null);
const currentMonth=ref(new Date(new Date().getFullYear(),new Date().getMonth(),1)); const selectedDate=ref(new Date());
const snackbar=ref({show:false,message:'',color:'success'});
const weekdays=['일','월','화','수','목','금','토'];
const typeOptions=[{label:'일반 일정',value:'GENERAL'},{label:'클랜 이벤트',value:'EVENT'},{label:'대회',value:'TOURNAMENT'}];
const form=reactive({title:'',description:'',schedule_type:'GENERAL',starts_at:'',ends_at:'',is_all_day:false});
const canCreate=computed(()=>account.isClanMaster||can('SCHEDULE','CLAN-SET-SCHEDULE-C'));
const monthTitle=computed(()=>new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long'}).format(currentMonth.value));
const selectedKey=computed(()=>dateKey(selectedDate.value));
const selectedDateLabel=computed(()=>new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'long'}).format(selectedDate.value));
const selectedEvents=computed(()=>eventsForDay(selectedDate.value));
const calendarDays=computed(()=>{const first=currentMonth.value;const start=new Date(first.getFullYear(),first.getMonth(),1-first.getDay());return Array.from({length:42},(_,i)=>{const date=new Date(start);date.setDate(start.getDate()+i);return {date,key:dateKey(date),currentMonth:date.getMonth()===first.getMonth(),isToday:dateKey(date)===dateKey(new Date())};});});
function dateKey(date:Date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
function eventsForDay(date:Date){const dayStart=new Date(date.getFullYear(),date.getMonth(),date.getDate());const dayEnd=new Date(dayStart);dayEnd.setDate(dayEnd.getDate()+1);return events.value.filter(e=>new Date(e.starts_at)<dayEnd&&new Date(e.ends_at||e.starts_at)>=dayStart).sort((a,b)=>+new Date(a.starts_at)-+new Date(b.starts_at));}
function eventContinuesOn(e:CalendarEvent,date:Date){const dayStart=new Date(date.getFullYear(),date.getMonth(),date.getDate());const dayEnd=new Date(dayStart);dayEnd.setDate(dayEnd.getDate()+1);return new Date(e.starts_at)<dayEnd&&new Date(e.ends_at||e.starts_at)>=dayStart;}
function eventSegment(e:CalendarEvent,date:Date){const previous=new Date(date);previous.setDate(previous.getDate()-1);const next=new Date(date);next.setDate(next.getDate()+1);const joinsPrevious=date.getDay()!==0&&eventContinuesOn(e,previous);const joinsNext=date.getDay()!==6&&eventContinuesOn(e,next);return {'joins-previous':joinsPrevious,'joins-next':joinsNext};}
function showEventLabel(e:CalendarEvent,date:Date){const previous=new Date(date);previous.setDate(previous.getDate()-1);return date.getDay()===0||!eventContinuesOn(e,previous);}
function eventMeta(e:CalendarEvent){if(e.schedule_type==='URGENT')return{label:'긴급 공지',className:'urgent',color:'error'};if(e.source==='NOTICE')return{label:'공지',className:'notice',color:'blue'};if(e.source==='PARTY')return{label:'파티',className:'party',color:'teal'};if(e.source==='AUCTION')return{label:'경매내전',className:'auction',color:'deep-purple'};if(e.source==='CLAN_MATCH'||e.schedule_type==='TOURNAMENT')return{label:'대회',className:'tournament',color:'amber'};if(e.schedule_type==='EVENT')return{label:'이벤트',className:'event',color:'pink'};return{label:'일반',className:'general',color:'blue'};}
function timeLabel(e:CalendarEvent){return e.is_all_day?'종일':new Intl.DateTimeFormat('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(e.starts_at));}
function timeRange(e:CalendarEvent){if(e.is_all_day)return'종일';const start=timeLabel(e);return e.ends_at?`${start} - ${new Intl.DateTimeFormat('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(e.ends_at))}`:start;}
function detailDate(e:CalendarEvent){const format=new Intl.DateTimeFormat('ko-KR',{dateStyle:'full',timeStyle:e.is_all_day?undefined:'short'});return `${format.format(new Date(e.starts_at))}${e.ends_at?` ~ ${format.format(new Date(e.ends_at))}`:''}`;}
function toInput(date:Date,allDay=false){const local=new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString();return allDay?local.slice(0,10):local.slice(0,16);}
function fromInput(value:string,allDay:boolean){if(!value)return undefined;return new Date(allDay?`${value}T00:00:00`:value).toISOString();}
function notify(message:string,color='success'){snackbar.value={show:true,message,color};}
async function loadEvents(){try{loading.value=true;const from=new Date(currentMonth.value.getFullYear(),currentMonth.value.getMonth()-1,1);const to=new Date(currentMonth.value.getFullYear(),currentMonth.value.getMonth()+2,1);const {data}=await api.get(`${getBaseUrl('DATA')}/clan-schedule/calendar`,{params:{clan_id:account.clan.id,from:from.toISOString(),to:to.toISOString()}});events.value=data.datas??[];}catch(e:any){notify(e?.response?.data?.message??'일정을 불러오지 못했습니다.','error');}finally{loading.value=false;}}
function moveMonth(diff:number){currentMonth.value=new Date(currentMonth.value.getFullYear(),currentMonth.value.getMonth()+diff,1);selectedDate.value=new Date(currentMonth.value);}
function goToday(){const now=new Date();currentMonth.value=new Date(now.getFullYear(),now.getMonth(),1);selectedDate.value=now;}
function resetForm(date:Date){editingId.value=null;activeEvent.value=null;Object.assign(form,{title:'',description:'',schedule_type:'GENERAL',starts_at:toInput(new Date(date.getFullYear(),date.getMonth(),date.getDate(),20,0)),ends_at:'',is_all_day:false});}
function openCreate(date:Date){resetForm(date);formDialog.value=true;}
function openEvent(e:CalendarEvent){activeEvent.value=e;detailDialog.value=true;}
function openEdit(e:CalendarEvent){activeEvent.value=e;editingId.value=e.id;Object.assign(form,{title:e.title,description:e.description??'',schedule_type:e.schedule_type,starts_at:toInput(new Date(e.starts_at),e.is_all_day),ends_at:e.ends_at?toInput(new Date(e.ends_at),e.is_all_day):'',is_all_day:e.is_all_day});detailDialog.value=false;formDialog.value=true;}
async function saveEvent(){try{saving.value=true;const body={id:editingId.value??undefined,clan_id:account.clan.id,title:form.title,description:form.description,schedule_type:form.schedule_type,starts_at:fromInput(form.starts_at,form.is_all_day),ends_at:fromInput(form.ends_at,form.is_all_day),is_all_day:form.is_all_day};await api.post(`${getBaseUrl('DATA')}/clan-schedule/${editingId.value?'update':'create'}`,body);formDialog.value=false;await loadEvents();notify(editingId.value?'일정을 수정했습니다.':'일정을 등록했습니다.');}catch(e:any){notify(e?.response?.data?.message??'일정을 저장하지 못했습니다.','error');}finally{saving.value=false;}}
async function deleteEvent(){if(!editingId.value||!confirm('이 일정을 삭제할까요?'))return;try{saving.value=true;await api.post(`${getBaseUrl('DATA')}/clan-schedule/delete`,{id:editingId.value});formDialog.value=false;await loadEvents();notify('일정을 삭제했습니다.');}catch(e:any){notify(e?.response?.data?.message??'일정을 삭제하지 못했습니다.','error');}finally{saving.value=false;}}
async function deleteNoticeSchedule(e:CalendarEvent){if(!confirm('달력 일정만 삭제할까요? 공지사항은 그대로 유지됩니다.'))return;try{await api.post(`${getBaseUrl('DATA')}/clan-schedule/delete`,{id:e.id});detailDialog.value=false;await loadEvents();notify('달력에서 일정을 삭제했습니다. 공지사항은 유지됩니다.');}catch(error:any){notify(error?.response?.data?.message??'달력 일정을 삭제하지 못했습니다.','error');}}
function relatedPath(e:CalendarEvent){if(e.source==='NOTICE'&&e.board_id)return CLAN_PATH.NOTICE_VIEW(account.clan.name,e.board_id);if(e.source==='PARTY')return CLAN_PATH.PARTY(account.clan.name);if(e.source==='AUCTION')return CLAN_PATH.AUCTION_VIEW(account.clan.name,e.id);return null;}
function goRelated(e:CalendarEvent){const path=relatedPath(e);if(path)router.push(path);}
watch(currentMonth,loadEvents);onMounted(loadEvents);
</script>

<style scoped>
.schedule-page{max-width:1500px}.schedule-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:28px}.schedule-hero>div>span{color:rgb(var(--v-theme-primary));font-size:11px;font-weight:900;letter-spacing:.15em}.schedule-hero h1{margin:5px 0;font-size:32px;letter-spacing:-.04em}.schedule-hero p{margin:0;color:rgba(var(--v-theme-on-surface),.55)}.calendar-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.month-control{display:flex;align-items:center;gap:5px}.month-control h2{min-width:150px;text-align:center;font-size:20px}.calendar-layout{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px}.calendar-panel,.agenda-panel{overflow:hidden;border:1px solid rgba(var(--v-theme-on-surface),.1);border-radius:20px;background:rgba(var(--v-theme-surface),.72)}.weekdays,.calendar-grid{display:grid;grid-template-columns:repeat(7,1fr)}.weekdays{border-bottom:1px solid rgba(var(--v-theme-on-surface),.08)}.weekdays span{padding:12px;text-align:center;color:rgba(var(--v-theme-on-surface),.5);font-size:12px;font-weight:800}.weekdays span:first-child{color:#f87171}.calendar-day{min-height:126px;padding:10px;border-right:1px solid rgba(var(--v-theme-on-surface),.07);border-bottom:1px solid rgba(var(--v-theme-on-surface),.07);color:inherit;text-align:left;transition:.15s}.calendar-day:hover,.calendar-day.selected{background:rgba(var(--v-theme-primary),.07)}.calendar-day.outside{opacity:.33}.day-number{display:grid;width:27px;height:27px;place-items:center;border-radius:50%;font-size:12px;font-weight:800}.calendar-day.today .day-number{color:white;background:rgb(var(--v-theme-primary))}.day-events{display:grid;gap:4px;margin-top:7px}.event-pill{overflow:hidden;padding:3px 6px;border-radius:5px;font-size:10px;font-weight:700;text-overflow:ellipsis;white-space:nowrap}.event-pill.general{color:#85baff;background:rgba(59,130,246,.15)}.event-pill.event{color:#fb9acb;background:rgba(236,72,153,.15)}.event-pill.tournament{color:#ffd166;background:rgba(245,158,11,.16)}.event-pill.party{color:#5ee4c1;background:rgba(20,184,166,.15)}.event-pill.auction{color:#c9a0ff;background:rgba(139,92,246,.17)}.day-events small{color:rgba(var(--v-theme-on-surface),.45);font-size:10px}.calendar-loading{display:grid;min-height:756px;place-items:center}.agenda-panel{padding:18px}.agenda-head{display:flex;align-items:center;justify-content:space-between;padding-bottom:15px;border-bottom:1px solid rgba(var(--v-theme-on-surface),.08)}.agenda-head span{color:rgb(var(--v-theme-primary));font-size:11px;font-weight:800}.agenda-head h2{margin:2px 0 0;font-size:20px}.agenda-list{display:grid;gap:9px;margin-top:14px}.agenda-card{display:flex;width:100%;align-items:center;gap:11px;padding:13px;border:1px solid rgba(var(--v-theme-on-surface),.08);border-radius:14px;color:inherit;background:rgba(var(--v-theme-on-surface),.025);text-align:left}.agenda-card:hover{border-color:rgba(var(--v-theme-primary),.35)}.agenda-card>i{width:4px;height:48px;border-radius:5px;background:#60a5fa}.agenda-card>i.event{background:#ec4899}.agenda-card>i.tournament{background:#f59e0b}.agenda-card>i.party{background:#14b8a6}.agenda-card>i.auction{background:#8b5cf6}.agenda-content{display:flex;min-width:0;flex:1;flex-direction:column}.agenda-content>span,.agenda-content>small{color:rgba(var(--v-theme-on-surface),.5);font-size:11px}.agenda-content>strong{overflow:hidden;margin:4px 0;font-size:14px;text-overflow:ellipsis;white-space:nowrap}.empty-agenda{display:grid;min-height:260px;place-items:center;align-content:center;color:rgba(var(--v-theme-on-surface),.35)}.empty-agenda p{margin:8px 0}.dialog-title{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;font-weight:800}.detail-row{display:flex;align-items:center;gap:10px;margin-bottom:11px;color:rgba(var(--v-theme-on-surface),.68)}.detail-description{margin-top:20px;white-space:pre-wrap}.v-card-actions>div{display:flex;gap:6px}@media(max-width:1000px){.calendar-layout{grid-template-columns:1fr}.calendar-day{min-height:105px}.agenda-panel{min-height:280px}}@media(max-width:650px){.schedule-hero{align-items:stretch;flex-direction:column}.calendar-panel{overflow-x:auto}.weekdays,.calendar-grid{min-width:700px}.calendar-day{min-height:100px}.event-pill{max-width:85px}.schedule-hero .v-btn{align-self:flex-start}}
.event-pill.notice{color:#85baff;background:rgba(59,130,246,.15)}
.agenda-card>i.notice{background:#3b82f6}
.event-pill.urgent{color:#fff;background:#dc2626;box-shadow:0 2px 8px rgba(220,38,38,.42);font-weight:900}
.agenda-card>i.urgent{background:#ef4444;box-shadow:0 0 10px rgba(239,68,68,.45)}
.event-pill{position:relative;z-index:1}
.event-pill.joins-previous{margin-left:-11px;padding-left:11px;border-top-left-radius:0;border-bottom-left-radius:0}
.event-pill.joins-next{margin-right:-11px;padding-right:11px;border-top-right-radius:0;border-bottom-right-radius:0}
</style>
