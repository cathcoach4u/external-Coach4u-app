/* ═══════════════════════════════════════════════════════════════════════
   Business Coach4U — app.js  (AI Coach Integration)
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

// ─── Helper Functions ───────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── AI Coach Initialization ────────────────────────────────────────────

let aiMessages = [];

function appendAIMessage(role, content) {
  const messagesDiv = document.getElementById('ai-messages');
  const msgDiv = document.createElement('div');
  msgDiv.className = `ai-msg ai-msg-${role}`;

  const html = escHtml(content)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  msgDiv.innerHTML = html;
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  aiMessages.push({ role, content });
  return msgDiv;
}

async function handleAIMessage() {
  const input = document.getElementById('ai-input');
  const text = input.value.trim();
  const sendBtn = document.getElementById('ai-send');

  if (!text) return;

  // Add user message
  appendAIMessage('user', text);
  input.value = '';
  input.disabled = true;
  sendBtn.disabled = true;

  // Show loading indicator
  const messagesDiv = document.getElementById('ai-messages');
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'ai-msg ai-msg-assistant';
  loadingDiv.innerHTML = '<span style="opacity: 0.6;">Thinking...</span>';
  messagesDiv.appendChild(loadingDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  try {
    let fullText = '';

    // Call the AI coach with streaming
    await window.askAI(
      text,
      'strategic',
      'Business Strategy',
      null,
      (chunk) => {
        fullText += chunk;
        const html = escHtml(fullText)
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n/g, '<br>');
        loadingDiv.innerHTML = html;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
    );

    // Move to message history
    loadingDiv.classList.remove('ai-msg-assistant');
    aiMessages.push({ role: 'assistant', content: fullText });

  } catch (err) {
    console.error('AI error:', err);
    loadingDiv.innerHTML = `<em style="color: #c62828;">Error: ${escHtml(err.message || 'Failed to get response')}</em>`;
  } finally {
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

// ─── Event Listeners ────────────────────────────────────────────────────

document.getElementById('ai-send').addEventListener('click', handleAIMessage);

document.getElementById('ai-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleAIMessage();
  }
});

// Initial greeting
window.addEventListener('DOMContentLoaded', () => {
  const messagesDiv = document.getElementById('ai-messages');
  const greeting = document.createElement('div');
  greeting.className = 'ai-msg ai-msg-assistant';
  greeting.innerHTML = `Hi! I'm your <strong>Strategy Coach</strong>. Let's build your business strategy together.<br><br>
Start by telling me: <strong>What industry are you in and what does your company do?</strong>`;
  messagesDiv.appendChild(greeting);

  // Auto-focus input
  setTimeout(() => document.getElementById('ai-input').focus(), 100);
});
