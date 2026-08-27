cronAdd('billing_processor', '*/10 * * * *', () => {
  try {
    const tenants = $app.findRecordsByFilter('tenants', 'active = true', '', 50, 0)
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    const dayOfWeek = now.getUTCDay() // 0 = Sunday, 6 = Saturday

    for (const tenant of tenants) {
      // 1. Check window & business days
      const winStart = tenant.get('default_send_window_start') || '09:00'
      const winEnd = tenant.get('default_send_window_end') || '18:00'
      const currentHours = now.getUTCHours() - 3 // roughly BRT
      const currentHHMM = `${String((currentHours + 24) % 24).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`

      if (currentHHMM < winStart || currentHHMM > winEnd) {
        continue
      }

      // Check holidays
      const holidays = $app.findRecordsByFilter(
        'holidays',
        `(scope = 'national' || tenant = '${tenant.id}') && date >= '${todayStr} 00:00:00.000Z' && date <= '${todayStr} 23:59:59.999Z'`,
        '',
        5,
        0,
      )
      if (holidays.length > 0 || dayOfWeek === 0 || dayOfWeek === 6) {
        continue
      }

      // 2. Fetch active rules for this tenant
      const rules = $app.findRecordsByFilter(
        'dunning_rules',
        `tenant = '${tenant.id}' && is_active = true`,
        'priority',
        20,
        0,
      )
      if (rules.length === 0) continue

      // 3. Fetch open receivables
      const receivables = $app.findRecordsByFilter(
        'receivables',
        `tenant = '${tenant.id}' && status = 'open' && open_amount > 0`,
        'due_date',
        200,
        0,
      )

      for (const rec of receivables) {
        const customerId = rec.get('customer')
        let cust
        try {
          cust = $app.findRecordById('customers', customerId)
        } catch (_) {
          continue
        }

        // Suppressions check
        if (cust.get('is_opted_out') || cust.get('human_only')) continue

        // Active suppression record check
        const activeSupp = $app.findRecordsByFilter(
          'suppressions',
          `tenant = '${tenant.id}' && customer = '${customerId}' && starts_at <= '${todayStr} 23:59:59.999Z' && (ends_at = '' || ends_at >= '${todayStr} 00:00:00.000Z')`,
          '',
          1,
          0,
        )
        if (activeSupp.length > 0) continue

        // Calculate offset
        const dueDate = new Date(rec.get('due_date'))
        const diffDays = Math.round((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

        for (const rule of rules) {
          const steps = $app.findRecordsByFilter(
            'dunning_steps',
            `dunning_rule = '${rule.id}' && is_active = true`,
            'order',
            10,
            0,
          )
          for (const step of steps) {
            const stepOffset = step.get('offset_days')
            if (diffDays === stepOffset) {
              // Check if task already exists
              const existingTasks = $app.findRecordsByFilter(
                'dunning_tasks',
                `tenant = '${tenant.id}' && customer = '${customerId}' && dunning_step = '${step.id}' && scheduled_for >= '${todayStr} 00:00:00.000Z' && scheduled_for <= '${todayStr} 23:59:59.999Z'`,
                '',
                1,
                0,
              )

              if (existingTasks.length === 0) {
                const tasksCol = $app.findCollectionByNameOrId('dunning_tasks')
                const task = new Record(tasksCol)
                task.set('tenant', tenant.id)
                task.set('customer', customerId)
                task.set('receivable_ids', [rec.id])
                task.set('dunning_step', step.id)
                task.set('scheduled_for', now.toISOString())
                task.set('status', 'sent')
                $app.save(task)

                // Create or reuse conversation
                let conv
                const existingConv = $app.findRecordsByFilter(
                  'conversations',
                  `tenant = '${tenant.id}' && customer = '${customerId}' && status != 'closed'`,
                  '-updated',
                  1,
                  0,
                )
                if (existingConv.length > 0) {
                  conv = existingConv[0]
                } else {
                  const convCol = $app.findCollectionByNameOrId('conversations')
                  conv = new Record(convCol)
                  conv.set('tenant', tenant.id)
                  conv.set('customer', customerId)
                  conv.set('channel', step.get('channel'))
                  conv.set('status', 'bot')
                  $app.save(conv)
                }

                // Create message
                const msgCol = $app.findCollectionByNameOrId('messages')
                const msg = new Record(msgCol)
                msg.set('conversation', conv.id)
                msg.set('direction', 'out')
                msg.set('channel', step.get('channel'))
                msg.set(
                  'body',
                  `Olá ${cust.get('name')}, lembramos cordialmente do título ${rec.get('document_number')} no valor de R$ ${Number(rec.get('open_amount')).toFixed(2)}. Acesse: ${rec.get('boleto_url') || rec.get('payment_link_url')}`,
                )
                msg.set('status', 'sent')
                msg.set('sent_at', now.toISOString())
                $app.save(msg)
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('billing_processor cron error:', err)
  }
})
