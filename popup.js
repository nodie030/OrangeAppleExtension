// db.js is loaded as a regular script before this file (see popup.html)

let pageData = {
    studentName: '未知學生',
    courseText: ''
};

// hasPrevious checkbox toggle
const hasPreviousCb = document.getElementById('hasPrevious');
const previousGroup = document.getElementById('previousGroup');
hasPreviousCb.addEventListener('change', (e) => {
    previousGroup.style.display = e.target.checked ? 'block' : 'none';
});

// Options link
document.getElementById('optionsLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
});

// 讀取當前畫面學生 (content.js 通訊)
document.getElementById('collectDataBtn').addEventListener('click', async () => {
    const studentEl = document.getElementById('studentName');
    const courseEl = document.getElementById('courseName');
    const statusEl = document.getElementById('courseStatus');

    studentEl.textContent = '讀取中...';
    courseEl.textContent = '讀取中...';
    statusEl.textContent = '讀取中...';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
        studentEl.textContent = '找不到頁籤';
        return;
    }

    chrome.tabs.sendMessage(tab.id, { action: 'getPageData' }, (response) => {
        if (chrome.runtime.lastError) {
            studentEl.textContent = '無法連線（請先重新整理目標頁面）';
            console.error(chrome.runtime.lastError.message);
            return;
        }
        if (!response) {
            studentEl.textContent = '無回應';
            return;
        }

        if (response.studentName) {
            pageData.studentName = response.studentName;
            studentEl.textContent = response.studentName;
        } else {
            studentEl.textContent = '未找到學生名稱';
        }

        if (response.courseText) {
            pageData.courseText = response.courseText;
            const details = getCourseDetailsByText(response.courseText);
            courseEl.textContent = details.name;
            statusEl.textContent = `第 ${details.number} 課`;
        } else {
            courseEl.textContent = '未找到課程';
            statusEl.textContent = '—';
        }
    });
});

// 產生並填入 / 純複製
document.getElementById('generateBtn').addEventListener('click', () => generateAndFill(false));
document.getElementById('copyBtn').addEventListener('click', () => generateAndFill(true));

async function generateAndFill(copyOnly = false) {
    const btn = document.getElementById('generateBtn');
    const status = document.getElementById('status');
    const copyBtn = document.getElementById('copyBtn');

    btn.disabled = true;
    copyBtn.style.display = 'none';
    status.textContent = '產生中...';
    status.style.color = '#E65100';

    try {
        const config = await chrome.storage.local.get(['openai_api_key', 'openai_model']);
        const apiKey = config.openai_api_key;
        const model = (config.openai_model || 'gpt-4o-mini').trim() || 'gpt-4o-mini';

        let questionsText = document.getElementById('questions').value.trim();
        let performance = document.getElementById('performance').value.trim() || '未提供';
        let useAI = document.getElementById('useAI').checked;
        let hasPrevious = document.getElementById('hasPrevious').checked;
        let previousQuestions = document.getElementById('previousQuestions').value.trim() || '未提供';

        if (!questionsText && useAI) throw new Error('請填本堂課驗收問題');
        if (!questionsText) questionsText = '未提供';

        const details = getCourseDetailsByText(pageData.courseText);
        let contactBody = `${pageData.studentName}今天在${details.name}完成第 ${details.number} 課〈${details.topic}〉。本堂課內容是${details.topic}。${pageData.studentName}上課表現：${performance}。\n\n本堂課驗收問題：【${questionsText}】。`;

        let opening = '';
        if (hasPrevious) {
            opening = `已完成上週內容，驗收問題為：【${previousQuestions}】。\n\n`;
        }

        let finalOutput = opening + contactBody;

        if (useAI) {
            if (!apiKey) throw new Error('請點右上角設定 API Key');
            const aiOutput = await callOpenAI(finalOutput, apiKey, model);
            let cleaned = aiOutput.trim();

            const marker = '已完成上週內容，驗收問題為：【';
            if (cleaned.includes(marker)) {
                let idx = cleaned.indexOf(marker);
                cleaned = cleaned.substring(idx + marker.length);
                let endIdx = cleaned.indexOf('】');
                if (endIdx !== -1) cleaned = cleaned.substring(endIdx + 1).replace(/^\s*[。\n]\s*/, '');
            }
            finalOutput = hasPrevious ? (opening + cleaned) : cleaned;

            if (!finalOutput.includes('本堂課驗收問題')) {
                finalOutput = finalOutput.trimEnd() + `\n\n本堂課驗收問題：【${questionsText}】。`;
            }
        }

        if (copyOnly) {
            await navigator.clipboard.writeText(finalOutput);
            status.style.color = 'green';
            status.textContent = '已複製！';
            btn.disabled = false;
            return;
        }

        // 傳送給 content.js 執行填入
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) throw new Error('找不到目前頁籤');
        chrome.tabs.sendMessage(tab.id, { action: 'fillPage', text: finalOutput }, (response) => {
            if (chrome.runtime.lastError) {
                status.style.color = 'orange';
                status.textContent = '填入失敗，已複製到剪貼簿。';
                navigator.clipboard.writeText(finalOutput);
                copyBtn.style.display = 'block';
            } else if (!response || !response.success) {
                const missingText = response?.missingFields?.length
                    ? `未完成欄位：${response.missingFields.join('、')}`
                    : '填入失敗';
                status.style.color = 'orange';
                status.textContent = `${missingText}，已複製到剪貼簿。`;
                navigator.clipboard.writeText(finalOutput);
                copyBtn.style.display = 'block';
            } else {
                status.style.color = 'green';
                status.textContent = '已填入網頁！';
            }
            btn.disabled = false;
        });

    } catch (e) {
        status.style.color = 'red';
        status.textContent = '錯誤: ' + e.message;
        btn.disabled = false;
    }
}

async function callOpenAI(msg, apiKey, model) {
    const systemPrompt = '你是老師，請把輸入內容整理成聯絡簿文章。語氣自然、口語，不要官腔，不要敬語或客套語。保持成段落、不要條列或標題。若開頭包含「已完成上週內容，驗收問題為：【...】。」這句，請原封不動保留在最前面。內容需包含：學生、課程、課堂內容、學習表現、驗收問題。';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: msg }
            ]
        })
    });

    if (!response.ok) {
        let errorMessage = response.statusText;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error?.message || errorMessage;
        } catch (parseError) {
            // Keep the HTTP status text when the error body is not JSON.
        }
        throw new Error('API請求失敗：' + errorMessage);
    }
    const data = await response.json();
    return data.choices[0].message.content;
}
