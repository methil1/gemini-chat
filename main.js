import { GoogleGenAI, Type } from "@google/genai";
import confetti from "canvas-confetti";
import './style.css';

// DOM 要素
const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');
const loadingIndicator = document.getElementById('loading-indicator');

// API Key管理
const STORAGE_KEY = 'gemini_api_key';
let apiKey = localStorage.getItem(STORAGE_KEY) || '';

// システムインスタンスの作成
let ai;
let chatSession;

// ツールの定義
const toolsDef = [{
  functionDeclarations: [{
    name: "change_theme_color",
    description: "Changes the application's theme color (accent and border color).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        color: {
          type: Type.STRING,
          description: "The color to change to. Can be a hex code (e.g., #ff0000) or a named color (e.g., red, blue)."
        }
      },
      required: ["color"]
    }
  }]
}];

// クライアントサイドのツール実装
function changeThemeColor(color) {
  console.log(`Executing tool: change_theme_color with color=${color}`);
  try {
    document.documentElement.style.setProperty('--color-accent', color);
    document.documentElement.style.setProperty('--color-border', color);
    return "Theme color successfully changed to " + color;
  } catch (e) {
    return "Failed to change color: " + e.message;
  }
}

function initSession() {
  try {
    if (apiKey && apiKey !== 'YOUR_API_KEY') {
      if (!ai) {
        ai = new GoogleGenAI({ apiKey });
      }
      // 新しいチャットセッションを作成
      chatSession = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "あなたは関西弁で話す陽気なAIです。",
          temperature: 0,
          tools: toolsDef,
        }
      });
      console.log("System Online. Session Initialized.");
      return true;
    }
  } catch (error) {
    console.error("Initialization Error:", error);
    appendMessage("system", `SYSTEM FAILURE: ${error.message}`);
    return false;
  }
}

// API Key モーダル
const modal = document.getElementById('api-key-modal');
const apiKeyInput = document.getElementById('api-key-input');
const apiKeySubmit = document.getElementById('api-key-submit');

function showModal() { modal.classList.remove('hidden'); }
function hideModal() { modal.classList.add('hidden'); }

apiKeySubmit.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (!key) return;
  localStorage.setItem(STORAGE_KEY, key);
  apiKey = key;
  hideModal();
  initSession();
  appendMessage("system", ">> CONNECTION ESTABLISHED");
});

apiKeyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') apiKeySubmit.click();
});

// 初回起動
if (apiKey) {
  initSession();
} else {
  showModal();
}

// イベントリスナー
sendBtn.addEventListener('click', handleSendMessage);
clearBtn.addEventListener('click', handleClearChat);

chatInput.addEventListener('keydown', (e) => {
  // エンターキーでの送信処理
  if (e.key === 'Enter' && !e.shiftKey) {
    // IME入力中（日本語変換など）の場合は送信しない
    if (e.isComposing) {
      return;
    }
    e.preventDefault();
    handleSendMessage();
  }
});

async function handleSendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  if (!chatSession) {
    appendMessage("system", "ERROR: CONNECTION NOT ESTABLISHED. CHECK API KEY.");
    return;
  }

  // UI更新: 入力をクリアし、ユーザーメッセージを追加
  chatInput.value = '';
  appendMessage('user', message);
  scrollToBottom();

  // ロード状態を設定
  setLoading(true);

  try {
    // Gemini へ送信 (ループ処理でツール実行に対応)
    let result = await chatSession.sendMessage({ message });

    // Function Calling のループ
    // SDKの仕様に合わせて functionCalls をチェック
    // 注: result.functionCalls は配列の可能性がある
    while (result.functionCalls && result.functionCalls.length > 0) {
      const call = result.functionCalls[0]; // 最初のツール呼び出しを処理
      const { name, args } = call;

      if (name === "change_theme_color") {
        // ツールの実行
        const toolResult = changeThemeColor(args.color);

        // 結果をモデルに返す
        const content = [{
          functionResponse: {
            name: "change_theme_color",
            response: { result: toolResult }
          }
        }];

        // 結果を送信して次のレスポンスを待つ
        result = await chatSession.sendMessage({
          message: content
        });
      } else {
        // 未知のツール呼び出しの場合（念のため）
        console.warn("Unknown tool called:", name);
        break;
      }
    }

    // 最終的なテキストレスポンスを表示
    if (result.text) {
      appendMessage('model', result.text);
      triggerConfetti();
    }

  } catch (error) {
    console.error("Transmission Error:", error);
    appendMessage('system', `TRANSMISSION ERROR: ${error.message}`);
  } finally {
    setLoading(false);
    // スクロール前にDOMが確実に更新されるよう requestAnimationFrame を使用
    requestAnimationFrame(() => {
      scrollToBottom();
    });
    chatInput.focus();
  }
}

function appendMessage(role, text) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message');

  if (role === 'user') {
    msgDiv.classList.add('user-message');
  } else if (role === 'model') {
    msgDiv.classList.add('model-message');
  } else {
    msgDiv.classList.add('system-intro'); // エラーまたはシステムメッセージ
  }

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('msg-content');
  contentDiv.textContent = text;

  msgDiv.appendChild(contentDiv);

  // コピーボタンを追加
  if (role !== 'system') {
    const copyBtn = createCopyButton(text);
    msgDiv.appendChild(copyBtn);
  }

  chatHistory.appendChild(msgDiv);
}

function createCopyButton(text) {
  const btn = document.createElement('button');
  btn.classList.add('copy-btn');
  btn.title = 'Copy to clipboard';
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  `;

  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text);

      // 視覚的フィードバック
      const originalHTML = btn.innerHTML;
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      btn.classList.add('copied');

      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  });

  return btn;
}

function handleClearChat() {
  if (!confirm('Execute Memory Purge Protocol? This will erase all session data.')) return;

  // UI をクリア
  chatHistory.innerHTML = '';

  // システムイントロを再追加
  const introMsg = document.createElement('div');
  introMsg.classList.add('message', 'system-intro');
  introMsg.innerHTML = `
    <div class="msg-content">
      <p>>> MEMORY PURGE COMPLETE</p>
      <p>>> MODEL: gemini-3-flash-preview</p>
      <p>>> SYSTEM READY</p>
    </div>
  `;
  chatHistory.appendChild(introMsg);

  // セッションをリセット
  initSession();
}

function setLoading(isLoading) {
  if (isLoading) {
    loadingIndicator.classList.remove('hidden');
    sendBtn.disabled = true;
    chatInput.disabled = true;
  } else {
    loadingIndicator.classList.add('hidden');
    sendBtn.disabled = false;
    chatInput.disabled = false;
  }
}

function scrollToBottom() {
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function triggerConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 1.0 }, // 画面下部
    colors: ['#4d5dff', '#ff4dfd', '#ffae4d', '#4dff7e'] // オプション: カスタムカラー
  });
}
