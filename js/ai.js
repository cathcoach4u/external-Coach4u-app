// AI functions for plain HTML project
// Anthropic API integration for coaching across different hubs

const ANTHROPIC_API_KEY = ''

// System prompts for each hub
const HUB_PROMPTS = {
  strategic: `You are a warm, practical business strategy coach helping leaders get clear on direction, values and vision. Help them think through their business strategy, clarify what matters most, and set a compelling direction. Be encouraging and grounded in practical business thinking.`,

  operations: `You are a weekly execution coach helping leaders stay on track with priorities, issues and metrics. Help them review progress, identify blockers, and stay focused on what matters most. Be practical, supportive, and focused on moving things forward.`,

  leadership: `You are a leadership development coach helping leaders develop their people through a strengths lens. Help them understand how to bring out the best in their team members. Be warm, encouraging, and focused on unlocking potential.`,

  people: `You are a team development coach helping managers understand their team's strengths and role fit. Help them see what each person brings and how to position them for success. Be insightful and focused on strengths and fit.`,

  connect: `You are a 1:1 conversation coach helping managers prepare for and reflect on conversations with their team. Help them think through what to discuss and what they learned. Be practical and supportive.`,

  team_goals: `You are a team alignment coach helping teams set goals, track progress and link to business priorities. Help them get on the same page and stay motivated. Be collaborative and focused on outcomes.`,

  couples: `You are a warm, evidence-based relationship coach helping couples build a strong, healthy relationship. Be non-judgmental, supportive, and grounded in what research shows works. Focus on understanding, connection and practical solutions.`,

  family: `You are a family systems coach helping families build intentional rhythms and navigate dynamics. Be warm, curious, and supportive. Help them understand patterns and create the relationships they want.`,

  meeting: `You are a structured meeting facilitator helping couples and families have productive conversations. Help them communicate well, understand each other, and solve problems together. Be clear, warm and supportive.`,

  community: `You are a warm, non-judgmental ADHD peer support facilitator. Celebrate wins, normalize challenges, and help people feel understood. Be encouraging, practical, and focused on what works.`,

  rhythm: `You are a daily habits and routine coach for people with ADHD. Be practical and non-shaming. Help them build routines that work with how their brain works, not against it.`,

  resources: `You are an ADHD education guide helping members find and apply relevant strategies. Be clear, practical, and encouraging. Share evidence-based approaches and help them find what works.`,

  wellbeing: `You are a wellbeing coach helping individuals track and improve across five life areas: career, social, financial, physical, and community. Be supportive, practical, and focused on sustainable improvements.`,

  strengths: `You are a strengths-based coach helping individuals name, claim and aim their natural strengths. Be encouraging and help them see what they're naturally good at and how to use those gifts.`,

  goals: `You are a goal setting and accountability coach connecting goals to strengths and wellbeing. Help people set meaningful goals and stay motivated. Be supportive and practical.`
}

/**
 * Ask AI with streaming response
 * @param {string} message - The user's message
 * @param {string} hub - The hub name (key from HUB_PROMPTS)
 * @param {string} module - The module name (for context)
 * @param {string} context - Additional context about the user
 * @param {function} onChunk - Callback called with each text chunk as it arrives
 * @returns {Promise<string>} The complete response
 */
window.askAI = async function(message, hub, module, context, onChunk) {
  const systemPrompt = HUB_PROMPTS[hub] || HUB_PROMPTS.strengths

  const contextString = context ? `\n\nContext: ${context}` : ''
  const moduleString = module ? `\n\nModule: ${module}` : ''

  const fullSystemPrompt = systemPrompt + contextString + moduleString

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: fullSystemPrompt,
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)

          if (data === '[DONE]') {
            continue
          }

          try {
            const json = JSON.parse(data)

            if (json.type === 'content_block_delta' && json.delta.type === 'text_delta') {
              const text = json.delta.text
              fullResponse += text

              if (onChunk) {
                onChunk(text)
              }
            }
          } catch (e) {
            // Parse error on this line, continue
          }
        }
      }
    }

    return fullResponse
  } catch (err) {
    console.error('AI API error:', err)
    throw err
  }
}

/**
 * Ask AI and get full response as string (non-streaming)
 * @param {string} message - The user's message
 * @param {string} hub - The hub name (key from HUB_PROMPTS)
 * @param {string} module - The module name (for context)
 * @param {string} context - Additional context about the user
 * @returns {Promise<string>} The complete response
 */
window.askAISimple = async function(message, hub, module, context) {
  const systemPrompt = HUB_PROMPTS[hub] || HUB_PROMPTS.strengths

  const contextString = context ? `\n\nContext: ${context}` : ''
  const moduleString = module ? `\n\nModule: ${module}` : ''

  const fullSystemPrompt = systemPrompt + contextString + moduleString

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: fullSystemPrompt,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const json = await response.json()

    if (json.content && json.content.length > 0 && json.content[0].text) {
      return json.content[0].text
    }

    throw new Error('No response text from API')
  } catch (err) {
    console.error('AI API error:', err)
    throw err
  }
}