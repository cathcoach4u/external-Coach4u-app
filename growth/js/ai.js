/* ═══════════════════════════════════════════════════════════════
   ai.js — AI Growth Assistant integration
   ═══════════════════════════════════════════════════════════════ */

const aiMessages = [];

function initAI() {
  // Quick action buttons
  document.querySelectorAll('.ai-action-btn').forEach(btn => {
    btn.addEventListener('click', handleQuickAction);
  });

  // Send button
  const sendBtn = document.getElementById('ai-send-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', sendAIMessage);
  }

  // Enter to send
  const input = document.getElementById('ai-chat-input');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAIMessage();
      }
    });
  }
}

function handleQuickAction(e) {
  const action = e.currentTarget.dataset.action;
  let prompt = '';

  switch(action) {
    case 'campaign-ideas':
      prompt = 'Generate 3 campaign ideas based on our company priorities and target market. Include campaign name, goal, and key tactics.';
      break;
    case 'content-calendar':
      prompt = 'Create a 4-week content calendar for our target audience. Include content type, topic, posting day, and brief description.';
      break;
    case 'content-topics':
      prompt = 'Suggest 10 content topics that would resonate with our target personas. Include topic, format (blog/video/social), and why it matters.';
      break;
    case 'campaign-analysis':
      prompt = 'Analyze our recent campaign performance and suggest 3 specific optimizations we could implement.';
      break;
    default:
      return;
  }

  const input = document.getElementById('ai-chat-input');
  if (input) {
    input.value = prompt;
    input.focus();
  }
}

async function sendAIMessage() {
  const input = document.getElementById('ai-chat-input');
  const text = input.value.trim();
  if (!text) return;

  // Check if window.askAI is available
  if (!window.askAI || typeof window.askAI !== 'function') {
    alert('AI is not ready. Please refresh the page.');
    return;
  }

  // Add user message
  appendAIMessage('user', text);
  input.value = '';
  input.disabled = true;

  const sendBtn = document.getElementById('ai-send-btn');
  if (sendBtn) sendBtn.disabled = true;

  // Create placeholder for response
  const messagesDiv = document.getElementById('ai-messages');
  const placeholder = document.createElement('div');
  placeholder.className = 'ai-message ai-message-assistant';
  placeholder.innerHTML = '<div class="ai-message-text"><span style="opacity:0.6;">Thinking...</span></div>';
  messagesDiv.appendChild(placeholder);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  try {
    let fullText = '';

    await window.askAI(
      text,
      'growth',
      'growth',
      null,
      (chunk) => {
        fullText += chunk;
        const html = escHtml(fullText)
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n/g, '<br>');
        placeholder.innerHTML = `<div class="ai-message-text">${html}</div>`;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
    );

    if (fullText) {
      aiMessages.push({ role: 'assistant', content: fullText });
    }
  } catch(err) {
    console.error('AI error:', err);
    placeholder.innerHTML = `<div class="ai-message-text" style="color:#c62828;">Error: ${escHtml(err.message)}</div>`;
  } finally {
    input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    input.focus();
  }
}

function appendAIMessage(role, content) {
  const messagesDiv = document.getElementById('ai-messages');
  const msgDiv = document.createElement('div');
  msgDiv.className = `ai-message ai-message-${role}`;

  const html = escHtml(content)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  msgDiv.innerHTML = `<div class="ai-message-text">${html}</div>`;
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  aiMessages.push({ role, content });
  return msgDiv;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.initAI = initAI;
