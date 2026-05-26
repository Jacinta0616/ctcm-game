/**
 * ============================================================
 * 中台禪寺環保小遊戲 — Google Apps Script 後端
 * ============================================================
 *
 * 【使用方式】
 * 1. 開啟你的 Google 試算表
 * 2. 點選上方選單：「擴充功能」→「Apps Script」
 * 3. 把這整個檔案的內容貼上，取代原本的程式碼
 * 4. 點「儲存」
 * 5. 點「部署」→「新增部署作業」
 *    - 類型選「網路應用程式」
 *    - 執行者：「我」
 *    - 存取權：「任何人」（不需要登入）
 * 6. 點「部署」，複製產生的「網路應用程式網址」
 * 7. 把網址貼到後台管理 → 設定 → Google Sheets 設定
 *
 * ============================================================
 * 【試算表工作表格式】
 * ============================================================
 *
 * ▸ 工作表名稱：答題題目
 *   第一列為標題列（會被忽略），從第二列開始填資料
 *   A欄：分類      → recycling（垃圾分類）或 cleaning（架房清潔）
 *   B欄：主題標籤  → 垃圾分類 或 架房清潔
 *   C欄：題目
 *   D欄：選項 A
 *   E欄：選項 B
 *   F欄：選項 C
 *   G欄：選項 D
 *   H欄：正確答案  → 填選項的完整文字（例如：寶特瓶）
 *   I欄：解析說明  → 答題後顯示的說明
 *
 * ▸ 工作表名稱：垃圾分類
 *   A欄：物品名稱
 *   B欄：圖示 emoji（例如：📰）
 *   C欄：類別      → 一般垃圾、紙類、塑膠、金屬、玻璃、廚餘 其中一個
 *   D欄：提示說明
 *
 * ▸ 工作表名稱：清潔步驟
 *   A欄：步驟順序（數字，例如：1）
 *   B欄：步驟大標
 *   C欄：步驟說明
 *   D欄：所需工具（用逗號分隔，例如：拖把,水桶,清潔劑）
 *
 * ============================================================
 */

function doGet(e) {
  const result = {};

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // ── 讀取答題題目 ──
    const quizSheet = ss.getSheetByName('答題題目');
    if (quizSheet) {
      const rows = quizSheet.getDataRange().getValues();
      result.quiz = rows.slice(1)
        .filter(r => r[0] && r[2]) // 分類和題目不能空
        .map(r => ({
          cat:     String(r[0]).trim(),
          tag:     String(r[1]).trim(),
          q:       String(r[2]).trim(),
          options: [r[3], r[4], r[5], r[6]].map(o => String(o).trim()),
          answer:  String(r[7]).trim(),
          explain: String(r[8]).trim(),
        }));
    }

    // ── 讀取垃圾分類物品 ──
    const sortSheet = ss.getSheetByName('垃圾分類');
    if (sortSheet) {
      const rows = sortSheet.getDataRange().getValues();
      result.sorting = rows.slice(1)
        .filter(r => r[0]) // 名稱不能空
        .map(r => ({
          name:  String(r[0]).trim(),
          emoji: String(r[1]).trim(),
          bin:   String(r[2]).trim(),
          hint:  String(r[3]).trim(),
        }));
    }

    // ── 讀取清潔步驟 ──
    const stepsSheet = ss.getSheetByName('清潔步驟');
    if (stepsSheet) {
      const rows = stepsSheet.getDataRange().getValues();
      result.steps = rows.slice(1)
        .filter(r => r[0] !== '' && r[1]) // 順序和大標不能空
        .map(r => ({
          order: Number(r[0]),
          title: String(r[1]).trim(),
          desc:  String(r[2]).trim(),
          tools: String(r[3]).trim().split(',').map(t => t.trim()).filter(Boolean),
        }))
        .sort((a, b) => a.order - b.order);
    }

  } catch (err) {
    result.error = err.toString();
  }

  // 回傳 JSON，並允許跨來源存取（CORS）
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
