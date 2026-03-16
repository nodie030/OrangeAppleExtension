document.getElementById('saveBtn').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    chrome.storage.local.set({ openai_api_key: apiKey }, () => {
        const status = document.getElementById('status');
        status.textContent = '設定已儲存！可以使用擴充功能了。';
        setTimeout(() => { status.textContent = ''; }, 3000);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['openai_api_key'], (result) => {
        if (result.openai_api_key) {
            document.getElementById('apiKey').value = result.openai_api_key;
        }
    });
});
