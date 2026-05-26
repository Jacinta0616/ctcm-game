/* ==========================================
   CTCM Game — 核心邏輯（同步 + 快取）
   ========================================== */

const STORAGE_KEYS = {
  quiz:       'ctcm_quiz_custom',
  sorting:    'ctcm_sorting_custom',
  steps:      'ctcm_steps_custom',
  scriptUrl:  'ctcm_apps_script_url',
  lastSync:   'ctcm_last_sync',
};

// 快取有效期：24 小時
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

// Apps Script 預設網址（已部署）
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxuz80_jqKX0JBqFW6No-pAGnEfikbfaU9-oq_z892HernsfM2pTqZJB_x2yLq49eF8/exec';

/* ── 取得 Apps Script 網址（localStorage 優先，沒有則用預設）── */
function getScriptUrl() {
  return localStorage.getItem(STORAGE_KEYS.scriptUrl) || DEFAULT_SCRIPT_URL;
}

/* ── 從 Google Sheets 同步資料 ── */
async function syncFromSheets() {
  const url = getScriptUrl();
  if (!url) {
    console.info('[CTCM] 尚未設定 Google Apps Script 網址，略過同步');
    return false;
  }

  try {
    const res  = await fetch(url);
    const json = await res.json();

    if (json.error) throw new Error(json.error);

    if (json.quiz    && json.quiz.length)    localStorage.setItem(STORAGE_KEYS.quiz,    JSON.stringify(json.quiz));
    if (json.sorting && json.sorting.length) localStorage.setItem(STORAGE_KEYS.sorting, JSON.stringify(json.sorting));
    if (json.steps   && json.steps.length)   localStorage.setItem(STORAGE_KEYS.steps,   JSON.stringify(json.steps));

    localStorage.setItem(STORAGE_KEYS.lastSync, Date.now().toString());
    console.info('[CTCM] 資料已從 Google Sheets 同步完成');
    return true;

  } catch (err) {
    console.warn('[CTCM] 同步失敗，使用快取資料：', err.message);
    return false;
  }
}

/* ── 自動同步（快取過期才抓）── */
async function autoSync() {
  const url = getScriptUrl();
  if (!url) return;

  const lastSync = parseInt(localStorage.getItem(STORAGE_KEYS.lastSync) || '0');
  const expired  = (Date.now() - lastSync) > CACHE_EXPIRY_MS;

  if (expired) {
    await syncFromSheets();
  } else {
    console.info('[CTCM] 快取有效，略過同步');
  }
}

/* ── 取得上次同步時間（格式化字串）── */
function getLastSyncText() {
  const ts = parseInt(localStorage.getItem(STORAGE_KEYS.lastSync) || '0');
  if (!ts) return '從未同步';
  const d = new Date(ts);
  return d.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
}

/* ── 初始化 ── */
autoSync();
