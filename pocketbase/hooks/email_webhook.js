routerAdd('POST', '/backend/v1/webhook/email', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const event = body.event || body.type || 'unknown'
    const email = body.email || body.recipient || ''

    if (email && (event === 'bounce' || event === 'dropped' || event === 'spam_report')) {
      const contacts = $app.findRecordsByFilter(
        'customer_contacts',
        `type = 'email' && value = '${email}'`,
        '',
        10,
        0,
      )
      for (const contact of contacts) {
        contact.set('is_valid', false)
        contact.set('validation_error', `Email bounced or failed (${event})`)
        $app.save(contact)
      }
    }

    return e.json(200, { status: 'processed', event, email })
  } catch (err) {
    console.error('email_webhook error:', err)
    return e.json(500, { error: err.message })
  }
})
