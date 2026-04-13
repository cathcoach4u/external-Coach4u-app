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

// ─── AI Strategy Coach ──────────────────────────────────────────────────

const aiCoachMessages = []; // {role, content}

function openAICoach() {
  const sidebar = document.getElementById('ai-coach-sidebar');
  sidebar.classList.remove('hidden');
  if (aiCoachMessages.length === 0) {
    appendAIMessage('assistant', "Hi! I'm your AI Strategy Coach. I'm here to help you build out your Vision & Strategy — from core values to your 10-year target.\n\nLet's start simple: **what industry is your business in, and what do you do?**", false);
  }
  setTimeout(() => document.getElementById('ai-coach-input').focus(), 100);
}

function closeAICoach() {
  document.getElementById('ai-coach-sidebar').classList.add('hidden');
}

function appendAIMessage(role, content, trackHistory = true) {
  const messages = document.getElementById('ai-coach-messages');
  const div = document.createElement('div');
  div.className = `ai-msg ai-msg-${role}`;
  const html = escHtml(content)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
  div.innerHTML = html;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  if (trackHistory) aiCoachMessages.push({ role, content });
  return div;
}

async function sendAICoachMessage() {
  const input = document.getElementById('ai-coach-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.disabled = true;
  document.getElementById('ai-coach-send').disabled = true;

  appendAIMessage('user', text);

  // Placeholder for streaming response
  const messages = document.getElementById('ai-coach-messages');
  const placeholder = document.createElement('div');
  placeholder.className = 'ai-msg ai-msg-assistant ai-msg-streaming';
  placeholder.innerHTML = '<span class="ai-typing-dot"></span><span class="ai-typing-dot"></span><span class="ai-typing-dot"></span>';
  messages.appendChild(placeholder);
  messages.scrollTop = messages.scrollHeight;

  try {
    let fullText = '';

    // Call window.askAI with streaming callback
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
        placeholder.innerHTML = html;
        messages.scrollTop = messages.scrollHeight;
      }
    );

    placeholder.classList.remove('ai-msg-streaming');
    if (fullText) aiCoachMessages.push({ role: 'assistant', content: fullText });
  } catch(err) {
    placeholder.innerHTML = `<em style="color:var(--danger)">Error: ${escHtml(err.message)}</em>`;
  } finally {
    input.disabled = false;
    document.getElementById('ai-coach-send').disabled = false;
    input.focus();
  }
}

// ─── Event Listeners ────────────────────────────────────────────────────

document.getElementById('ai-coach-fab').addEventListener('click', openAICoach);
document.getElementById('ai-coach-close').addEventListener('click', closeAICoach);
document.getElementById('ai-coach-send').addEventListener('click', sendAICoachMessage);

document.getElementById('ai-coach-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendAICoachMessage();
  }
});
