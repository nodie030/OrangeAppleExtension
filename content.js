// content.js - 此腳本由 manifest.json 注入到聯絡簿頁面

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageData') {
        sendResponse(getPageData());
    } else if (request.action === 'fillPage') {
        const result = fillContactBookOnPage(request.text);
        sendResponse({ success: result });
    }
    return true; // 讓 sendResponse 可以非同步呼叫
});

function getPageData() {
    let studentName = '';
    let courseText = '';

    // 抓學生姓名：<h4 class="modal-title">林冠廷 課堂記錄</h4>
    const titleEl = document.querySelector('h4.modal-title');
    if (titleEl) {
        studentName = titleEl.textContent.replace('課堂記錄', '').replace('課堂紀錄', '').trim();
    }

    // 抓課程：<select name="dt_admission_lesson_report[learning_stage]"> 選中的 option
    const courseSelect = document.querySelector('select[name="dt_admission_lesson_report[learning_stage]"]');
    if (courseSelect) {
        const selected = courseSelect.options[courseSelect.selectedIndex];
        if (selected && selected.value !== '0' && selected.value !== '') {
            courseText = selected.textContent.trim();
        }
    }

    // Fallback: 任何 select.form-control 選到的課程關鍵字
    if (!courseText) {
        const selects = document.querySelectorAll('select.form-control');
        for (const sel of selects) {
            const selected = sel.options[sel.selectedIndex];
            if (selected && selected.textContent.match(/Python|Scratch|HTML|JavaScript|DB|AI|演算法|Lesson/i)) {
                courseText = selected.textContent.trim();
                break;
            }
        }
    }

    return { studentName, courseText };
}

function fillContactBookOnPage(generatedText) {
    // 找 modal 容器
    let container = document.querySelector('.modal-content') || document.querySelector('.modal-body') || document.body;

    let targetTextarea = null;
    let foundBoxes = false;

    try {
        // 找學習表現的 textarea
        const textareas = container.querySelectorAll('textarea');
        for (const ta of textareas) {
            if (ta.placeholder && (ta.placeholder.includes('填寫學生評量') || ta.placeholder.includes('學習表現'))) {
                targetTextarea = ta;
                break;
            }
        }
        // Fallback 抓標籤附近的 textarea
        if (!targetTextarea) {
            for (const label of container.querySelectorAll('label, div, span, p')) {
                if (label.textContent.includes('學習表現') && label.children.length === 0) {
                    const nearest = label.parentElement?.querySelector('textarea');
                    if (nearest) { targetTextarea = nearest; break; }
                }
            }
        }
        // 最終 fallback: 第一個 textarea
        if (!targetTextarea && textareas.length > 0) {
            targetTextarea = textareas[0];
        }

        if (targetTextarea) {
            targetTextarea.value = generatedText;
            targetTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            targetTextarea.dispatchEvent(new Event('change', { bubbles: true }));
            foundBoxes = true;
        }

        // 勾選確認 checkbox
        for (const cb of container.querySelectorAll('input[type="checkbox"]')) {
            const labelText = cb.labels?.[0]?.textContent || cb.parentElement?.textContent || '';
            if (labelText.includes('確認學生姓名') || labelText.includes('資訊正確')) {
                cb.checked = true;
                cb.dispatchEvent(new Event('change', { bubbles: true }));
                break;
            }
        }

        // 自動點星星（課程參與 & 課堂秩序）
        ['課程參與', '課堂秩序'].forEach(labelTxt => {
            const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
            let node = walker.nextNode();
            while (node) {
                if (node.textContent.trim() === labelTxt) {
                    let cur = node.parentElement;
                    let found = false;
                    for (let i = 0; i < 5; i++) {
                        if (!cur) break;
                        
                        // 處理半星制 input radio value="10" (滿分5星)
                        const input10 = cur.querySelector('input[type="radio"][value="10"]');
                        if (input10) {
                            input10.checked = true;
                            input10.dispatchEvent(new Event('change', { bubbles: true }));
                            // UI 通常是綁在 label 上，觸發對應 label 的點擊事件
                            const label10 = cur.querySelector(`label[for="${input10.id}"]`);
                            if (label10) label10.click();
                            found = true;
                            break;
                        }

                        // 其他備案
                        const stars = cur.querySelectorAll('svg, i.fa-star, span.star, [class*="star"]');
                        if (stars.length >= 5) {
                            stars[4].dispatchEvent(new MouseEvent('click', { bubbles: true }));
                            found = true;
                            break;
                        }
                        cur = cur.parentElement;
                    }
                    if (found) break;
                }
                node = walker.nextNode();
            }
        });

        // 自動選擇「能跟上進度」
        const statusSelect = container.querySelector('select[name="dt_admission_lesson_report[learning_status]"]') 
                          || container.querySelector('#admission_lesson_report_learning_status');
        if (statusSelect) {
            statusSelect.value = '能跟上進度';
            statusSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

    } catch (e) {
        console.error('[OAA] DOM Error:', e);
    }

    return foundBoxes;
}
