routerAdd(
  'POST',
  '/backend/v1/agent/chat',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const userId = e.auth?.id
      if (!userId) {
        return e.unauthorizedError('auth required')
      }

      const message = body.message
      const conversationId = body.conversation_id || null
      const customerContext = body.customer_context || ''

      if (!message) {
        return e.badRequestError('message is required')
      }

      const fullPrompt = customerContext
        ? `[Contexto do Cliente e Títulos]: ${customerContext}\n\n[Mensagem do Usuário]: ${message}`
        : message

      const result = $ai.agent('cobra-negotiator').chat({
        user_id: userId,
        conversation_id: conversationId,
        message: fullPrompt,
      })

      return e.json(200, {
        conversation_id: result.conversation_id,
        content: result.content,
        citations: result.citations,
        message_id: result.message_id,
      })
    } catch (err) {
      console.error('Agent chat error:', err)
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'AI temporarily unavailable' })
      }
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, { error: status >= 500 ? 'agent request failed' : err.message })
      }
      return e.json(500, { error: err.message || 'Failed to execute agent' })
    }
  },
  $apis.requireAuth(),
)
