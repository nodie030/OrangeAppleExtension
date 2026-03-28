# OrangeApple 聯絡簿自動填寫助手

這是一個專為 OrangeApple 教職員設計的 Chrome 擴充功能，運用 OpenAI 強大的生成能力幫助教師自動化撰寫與填寫學生的「課堂紀錄/學習表現」。

主要功能為：
1. **一鍵擷取與產生**：自動從聯絡簿彈出視窗（Modal）抓取學生姓名與上課進度（如：Python 進階 Lesson 24），並呼叫 OpenAI API 產生一段通順的學習評語。
2. **自動填寫與勾選**：
   - 自動將生成的評語填入「學習表現」欄位。
   - 自動給予「課程參與」與「課堂秩序」滿分五顆星的評分。
   - 自動將「學習狀態」設為「能跟上進度」。
   - 自動勾選「我已確認學生姓名與上課資訊正確」。
3. **失敗備案（剪貼簿複製）**：若網頁結構改變、自動填寫只完成部分欄位，或內容腳本失敗，擴充功能會自動將生成的評語複製到你的剪貼簿，方便手動貼上。
4. **本機設定 API Key**：使用者須在擴充功能的「選項（Options）」頁面設定自己的 OpenAI API Key，金鑰會儲存在瀏覽器本地（`chrome.storage.local`）。若是共用電腦，建議使用自己的 Chrome 個人資料或避免長期保存金鑰。

---

## 🛠️ 安裝方式 (安裝開發中版本)

這支擴充功能目前尚未上架至 Chrome 線上應用程式商店，但您可以透過「載入未封裝項目」的方式輕鬆安裝：

1. 下載或 Clone 本專案。
2. 打開 Google Chrome，在網址列輸入 `chrome://extensions/` 並進入。
3. 在頁面右上角，開啟 **「開發人員模式」**。
4. 點擊左上角的 **「載入未封裝項目」**。
5. 選擇本專案資料夾所在的位置。
6. 安裝完成！你會在 Chrome 右上角的擴充功能列看到它。

---

## ⚙️ 初始設定

在使用之前，你必須先設定好你的 OpenAI API Key：

1. 對著右上角的擴充功能圖示點擊**右鍵**，選擇 **「選項」(Options)**。
2. 貼上你的 OpenAI API Key，並點擊儲存。
3. (選擇性) 你也可以在選項頁面中自訂想要使用的 GPT 模型，留空時會使用 `gpt-4o-mini`。

---

## 🚀 使用方式

1. 登入 OrangeApple 後台，並開啟填寫課堂紀錄的彈出視窗頁面。
2. 點擊 Chrome 右上角的擴充功能圖示，打開擴充功能彈出面板 (Popup)。
3. 點擊 **「讀取當前畫面學生」**，擷取目前彈出視窗上的「學生姓名」及「學習課程」。
4. 輸入本堂課驗收問題，視需要補上學習表現、上週未完成內容，並決定是否使用 AI 潤飾。
5. 點擊 **「產生並填入網頁」** 按鈕。
6. 若 OrangeApple 頁面結構與預期一致，擴充功能會自動填寫文字、星等、學習狀態與確認勾選；若只完成部分欄位，會提示未完成欄位並把文字複製到剪貼簿。

---

## 💻 開發者資訊
- 可參考 [howardtuan/OrangeAppleAssistant](https://github.com/howardtuan/OrangeAppleAssistant)
### 專案架構概覽
- `manifest.json`：擴充功能的設定檔 (Manifest V3)。
- `popup.html` / `popup.js` / `popup.css`：擴充功能主操作面板的介面與邏輯。負責串接 OpenAI API。
- `content.js`：注入到目標網頁的腳本，負責讀取畫面資訊（如：學生姓名）以及執行 DOM 操作（填寫表單、點星星等）。
- `options.html` / `options.js`：讓使用者設定 API Key 以及自訂選項的頁面。
- `db.js`：儲存了課程資料大綱，輔助 Prompt 得知該堂課的學習重點。

### 技術棧
- HTML / CSS / Vanilla JavaScript
- Chrome Extension API (Manifest V3)
- OpenAI ChatCompletion API
