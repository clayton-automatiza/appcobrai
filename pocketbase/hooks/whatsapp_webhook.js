routerAdd('POST', '/backend/v1/webhook/whatsapp', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const fromPhone =
      body.from || body.phone || body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || ''
    const messageText =
      body.text ||
      body.body ||
      body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body ||
      ''

    if (!messageText) {
      return e.json(200, { status: 'ignored', reason: 'no_text' })
    }

    // Lookup contact
    const cleanPhone = fromPhone.replace(/[^0-9]/g, '')
    let contacts = []
    if (cleanPhone) {
      contacts = $app.findRecordsByFilter(
        'customer_contacts',
        `type = 'whatsapp' && value ~ '${cleanPhone.slice(-8)}'`,
        '',
        1,
        0,
      )
    }

    let customer = null
    let tenantId = ''
    if (contacts.length > 0) {
      customer = $app.findRecordById('customers', contacts[0].get('customer'))
      tenantId = customer.get('tenant')
    } else {
      // Fallback first active tenant and first customer
      const tenants = $app.findRecordsByFilter('tenants', 'active = true', '', 1, 0)
      if (tenants.length > 0) tenantId = tenants[0].id
    }

    // Call Agent
    const users = $app.findRecordsByFilter('_pb_users_auth_', '', '', 1, 0)
    const userId = users.length > 0 ? users[0].id : ''

    let agentResponse =
      'Olá! Agradecemos sua mensagem. Nossa equipe financeira analisará com prioridade.'
    if (userId) {
      try {
        const agentResult = $ai.agent('cobra-negotiator').chat({
          user_id: userId,
          message: `Mensagem recebida do cliente (${customer ? customer.get('name') : 'Não identificado'}): "${messageText}". Responda cordialmente e informe sobre títulos se solicitado.`,
        })
        if (agentResult && agentResult.content) {
          agentResponse = agentResult.content
        }
      } catch (agentErr) {
        console.error('Agent chat error in whatsapp webhook:', agentErr)
      }
    }

    return e.json(200, {
      status: 'success',
      customer_id: customer ? customer.id : null,
      response: agentResponse,
    })
  } catch (err) {
    console.error('whatsapp_webhook error:', err)
    return e.json(500, { error: err.message })
  }
})
