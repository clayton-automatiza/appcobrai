routerAdd(
  'POST',
  '/backend/v1/dunning/simulate',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const tenantId = body.tenant_id
      const daysAhead = parseInt(body.days_ahead || '7', 10)

      if (!tenantId) {
        return e.badRequestError('tenant_id is required')
      }

      const receivables = $app.findRecordsByFilter(
        'receivables',
        `tenant = '${tenantId}' && status = 'open' && open_amount > 0`,
        'due_date',
        500,
        0,
      )

      const rules = $app.findRecordsByFilter(
        'dunning_rules',
        `tenant = '${tenantId}' && is_active = true`,
        'priority',
        20,
        0,
      )
      const steps = []
      for (const r of rules) {
        const sList = $app.findRecordsByFilter(
          'dunning_steps',
          `dunning_rule = '${r.id}' && is_active = true`,
          'order',
          20,
          0,
        )
        steps.push(...sList)
      }

      const now = new Date()
      const projections = []

      for (let i = 0; i < daysAhead; i++) {
        const targetDate = new Date(now.getTime() + i * 86400000)
        const targetDateStr = targetDate.toISOString().slice(0, 10)

        let matchedCount = 0
        let matchedAmount = 0
        const matchedCustomers = new Set()

        for (const rec of receivables) {
          const dueDate = new Date(rec.get('due_date'))
          const offset = Math.round(
            (targetDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
          )

          const hasMatchingStep = steps.some((s) => s.get('offset_days') === offset)
          if (hasMatchingStep) {
            matchedCount++
            matchedAmount += Number(rec.get('open_amount') || 0)
            matchedCustomers.add(rec.get('customer'))
          }
        }

        projections.push({
          date: targetDateStr,
          day_offset: i,
          receivables_count: matchedCount,
          unique_customers: matchedCustomers.size,
          total_amount: Math.round(matchedAmount * 100) / 100,
        })
      }

      return e.json(200, {
        tenant_id: tenantId,
        days_simulated: daysAhead,
        total_active_rules: rules.length,
        total_active_steps: steps.length,
        projections,
      })
    } catch (err) {
      console.error('simulate dunning error:', err)
      return e.json(500, { error: err.message })
    }
  },
  $apis.requireAuth(),
)
