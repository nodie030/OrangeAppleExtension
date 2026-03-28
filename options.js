const defaultModel = 'gpt-4o-mini';
const apiKeyInput = document.getElementById('apiKey');
const modelInput = document.getElementById('model');
const showApiKeyCb = document.getElementById('showApiKey');

document.getElementById('saveBtn').addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    const model = modelInput.value.trim() || defaultModel;
    chrome.storage.local.set({ openai_api_key: apiKey, openai_model: model }, () => {
        const status = document.getElementById('status');
        status.textContent = '設定已儲存！可以使用擴充功能了。';
        setTimeout(() => { status.textContent = ''; }, 3000);
    });
});

showApiKeyCb.addEventListener('change', (event) => {
    apiKeyInput.type = event.target.checked ? 'text' : 'password';
});

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['openai_api_key', 'openai_model'], (result) => {
        if (result.openai_api_key) {
            apiKeyInput.value = result.openai_api_key;
        }
        modelInput.value = result.openai_model || defaultModel;
    });
});
