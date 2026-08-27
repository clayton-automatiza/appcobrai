migrate(
  (app) => {
    const tenantsCol = app.findCollectionByNameOrId('tenants')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const customersCol = app.findCollectionByNameOrId('customers')
    const contactsCol = app.findCollectionByNameOrId('customer_contacts')
    const receivablesCol = app.findCollectionByNameOrId('receivables')
    const rulesCol = app.findCollectionByNameOrId('dunning_rules')
    const stepsCol = app.findCollectionByNameOrId('dunning_steps')
    const templatesCol = app.findCollectionByNameOrId('message_templates')
    const convsCol = app.findCollectionByNameOrId('conversations')
    const msgsCol = app.findCollectionByNameOrId('messages')
    const promisesCol = app.findCollectionByNameOrId('payment_promises')
    const ticketsCol = app.findCollectionByNameOrId('tickets')
    const holidaysCol = app.findCollectionByNameOrId('holidays')
    const syncCol = app.findCollectionByNameOrId('sync_state')

    // 1. Seed Tenants
    const tenantData = [
      {
        name: 'Vila Porto Comércio Exterior',
        cnpj: '12.345.678/0001-90',
        conexos_api_key: 'cnx_live_vp_comex_89af3b2c',
        whatsapp_api_key: 'wa_token_vp_comex_991823',
        email_api_key: 'sendgrid_vp_comex_sec_81726',
        active: true,
        brand_color: '#0F172A',
        default_send_window_start: '09:00',
        default_send_window_end: '18:00',
      },
      {
        name: 'Vila Porto Logística Integrada',
        cnpj: '98.765.432/0001-10',
        conexos_api_key: 'cnx_live_vp_log_45fc91d2',
        whatsapp_api_key: 'wa_token_vp_log_334211',
        email_api_key: 'sendgrid_vp_log_sec_99231',
        active: true,
        brand_color: '#0EA5E9',
        default_send_window_start: '09:00',
        default_send_window_end: '18:00',
      },
      {
        name: 'Vila Porto Vinhos & Bebidas',
        cnpj: '45.678.901/0001-22',
        conexos_api_key: 'cnx_live_vp_vinhos_11ca76b0',
        whatsapp_api_key: 'wa_token_vp_vinhos_778192',
        email_api_key: 'sendgrid_vp_vinhos_sec_55142',
        active: true,
        brand_color: '#7C3AED',
        default_send_window_start: '09:00',
        default_send_window_end: '18:00',
      },
    ]

    const createdTenants = []
    for (const t of tenantData) {
      let rec
      try {
        rec = app.findFirstRecordByData('tenants', 'cnpj', t.cnpj)
      } catch (_) {
        rec = new Record(tenantsCol)
        rec.set('name', t.name)
        rec.set('cnpj', t.cnpj)
        rec.set('conexos_api_key', t.conexos_api_key)
        rec.set('whatsapp_api_key', t.whatsapp_api_key)
        rec.set('email_api_key', t.email_api_key)
        rec.set('active', t.active)
        rec.set('brand_color', t.brand_color)
        rec.set('default_send_window_start', t.default_send_window_start)
        rec.set('default_send_window_end', t.default_send_window_end)
        app.save(rec)
      }
      createdTenants.push(rec)
    }

    const mainTenant = createdTenants[0]

    // 2. Seed Users
    const userSeeds = [
      {
        email: 'claytonfreire@gmail.com',
        name: 'Clayton Freire',
        role: 'super_admin',
        tenant: mainTenant.id,
      },
      {
        email: 'gestor.financeiro@vilaporto.com.br',
        name: 'Mariana Souza',
        role: 'gestor_financeiro',
        tenant: mainTenant.id,
      },
      {
        email: 'analista.cobranca@vilaporto.com.br',
        name: 'Lucas Mendes',
        role: 'analista_cobranca',
        tenant: createdTenants[1].id,
      },
      {
        email: 'diretoria@vilaporto.com.br',
        name: 'Roberto Vila Porto',
        role: 'diretoria',
        tenant: mainTenant.id,
      },
    ]

    for (const u of userSeeds) {
      try {
        const existing = app.findAuthRecordByEmail('_pb_users_auth_', u.email)
        existing.set('name', u.name)
        existing.set('role', u.role)
        existing.set('tenant', u.tenant)
        app.save(existing)
      } catch (_) {
        const rec = new Record(usersCol)
        rec.setEmail(u.email)
        rec.setPassword('Skip@Pass')
        rec.setVerified(true)
        rec.set('name', u.name)
        rec.set('role', u.role)
        rec.set('tenant', u.tenant)
        app.save(rec)
      }
    }

    // 3. Seed Holidays
    const nationalHolidays = [
      { date: '2025-01-01 00:00:00.000Z', name: 'Confraternização Universal', scope: 'national' },
      { date: '2025-03-03 00:00:00.000Z', name: 'Carnaval', scope: 'national' },
      { date: '2025-03-04 00:00:00.000Z', name: 'Carnaval', scope: 'national' },
      { date: '2025-04-18 00:00:00.000Z', name: 'Sexta-feira Santa', scope: 'national' },
      { date: '2025-04-21 00:00:00.000Z', name: 'Tiradentes', scope: 'national' },
      { date: '2025-05-01 00:00:00.000Z', name: 'Dia do Trabalho', scope: 'national' },
      { date: '2025-06-19 00:00:00.000Z', name: 'Corpus Christi', scope: 'national' },
      { date: '2025-09-07 00:00:00.000Z', name: 'Independência do Brasil', scope: 'national' },
      { date: '2025-10-12 00:00:00.000Z', name: 'Nossa Senhora Aparecida', scope: 'national' },
      { date: '2025-11-02 00:00:00.000Z', name: 'Finados', scope: 'national' },
      { date: '2025-11-15 00:00:00.000Z', name: 'Proclamação da República', scope: 'national' },
      { date: '2025-11-20 00:00:00.000Z', name: 'Dia da Consciência Negra', scope: 'national' },
      { date: '2025-12-25 00:00:00.000Z', name: 'Natal', scope: 'national' },
    ]

    for (const h of nationalHolidays) {
      try {
        app.findFirstRecordByData('holidays', 'name', h.name)
      } catch (_) {
        const rec = new Record(holidaysCol)
        rec.set('date', h.date)
        rec.set('name', h.name)
        rec.set('scope', h.scope)
        app.save(rec)
      }
    }

    // 4. Seed Message Templates
    for (const tenant of createdTenants) {
      const templates = [
        {
          channel: 'email',
          name: 'Lembrete Amigável D-2',
          category: 'billing_reminder',
          external_template_name: 'email_friendly_reminder_d2',
          language: 'pt_BR',
          body: 'Olá, {{customer_name}}!\n\nEsperamos que esteja tudo bem. Passando para lembrar que o título {{document_number}} no valor de {{amount}} vence em {{due_date}}.\n\nPara facilitar, você pode acessar a 2ª via pelo link: {{boleto_url}}\n\nQualquer dúvida, estamos à disposição!\nAtenciosamente,\nFinanceiro - Grupo Vila Porto',
          approval_status: 'approved',
          variables: ['customer_name', 'document_number', 'amount', 'due_date', 'boleto_url'],
        },
        {
          channel: 'whatsapp',
          name: 'Vencimento Hoje D0 (WhatsApp)',
          category: 'utility',
          external_template_name: 'hsm_vencimento_hoje_v1',
          language: 'pt_BR',
          body: 'Olá, {{customer_name}}! Aqui é do Grupo Vila Porto. Lembramos que a fatura {{document_number}} ({{amount}}) vence hoje ({{due_date}}). Segue o link com código PIX e boleto: {{payment_link_url}}. Caso já tenha efetuado o pagamento, por favor desconsidere.',
          approval_status: 'approved',
          variables: ['customer_name', 'document_number', 'amount', 'due_date', 'payment_link_url'],
        },
        {
          channel: 'whatsapp',
          name: 'Aviso de Atraso D+5 (WhatsApp com IA)',
          category: 'utility',
          external_template_name: 'hsm_aviso_atraso_ia_v2',
          language: 'pt_BR',
          body: 'Olá, {{customer_name}}, tudo bem? Identificamos que o título {{document_number}} no valor de {{amount}} venceu em {{due_date}}. Podemos te ajudar com uma 2ª via atualizada ou verificar o status do pagamento? Basta nos responder por aqui.',
          approval_status: 'approved',
          variables: ['customer_name', 'document_number', 'amount', 'due_date'],
        },
      ]

      for (const tpl of templates) {
        try {
          const existing = app.findRecordsByFilter(
            'message_templates',
            `tenant = '${tenant.id}' && name = '${tpl.name}'`,
            '',
            1,
            0,
          )
          if (existing.length === 0) throw new Error('not found')
        } catch (_) {
          const rec = new Record(templatesCol)
          rec.set('tenant', tenant.id)
          rec.set('channel', tpl.channel)
          rec.set('name', tpl.name)
          rec.set('category', tpl.category)
          rec.set('external_template_name', tpl.external_template_name)
          rec.set('language', tpl.language)
          rec.set('body', tpl.body)
          rec.set('variables', tpl.variables)
          rec.set('approval_status', tpl.approval_status)
          app.save(rec)
        }
      }

      // 5. Seed Dunning Rules & Steps
      const defaultRules = [
        {
          name: 'Régua Padrão B2B - Vila Porto',
          scope: 'tenant',
          priority: 10,
          is_active: true,
          min_amount: 50,
          send_window_start: '09:00',
          send_window_end: '18:00',
          business_days_only: true,
          max_messages_per_customer_per_week: 3,
          group_by_customer: true,
          steps: [
            {
              order: 1,
              offset_days: -2,
              channel: 'email',
              fallback_channel: 'whatsapp',
              fallback_after_hours: 24,
              is_active: true,
            },
            {
              order: 2,
              offset_days: 0,
              channel: 'whatsapp',
              fallback_channel: 'email',
              fallback_after_hours: 12,
              is_active: true,
            },
            {
              order: 3,
              offset_days: 5,
              channel: 'whatsapp',
              fallback_channel: 'email',
              fallback_after_hours: 24,
              is_active: true,
            },
          ],
        },
      ]

      for (const r of defaultRules) {
        let ruleRec
        try {
          const existing = app.findRecordsByFilter(
            'dunning_rules',
            `tenant = '${tenant.id}' && name = '${r.name}'`,
            '',
            1,
            0,
          )
          if (existing.length === 0) throw new Error('not found')
          ruleRec = existing[0]
        } catch (_) {
          ruleRec = new Record(rulesCol)
          ruleRec.set('tenant', tenant.id)
          ruleRec.set('name', r.name)
          ruleRec.set('scope', r.scope)
          ruleRec.set('priority', r.priority)
          ruleRec.set('is_active', r.is_active)
          ruleRec.set('min_amount', r.min_amount)
          ruleRec.set('send_window_start', r.send_window_start)
          ruleRec.set('send_window_end', r.send_window_end)
          ruleRec.set('business_days_only', r.business_days_only)
          ruleRec.set('max_messages_per_customer_per_week', r.max_messages_per_customer_per_week)
          ruleRec.set('group_by_customer', r.group_by_customer)
          app.save(ruleRec)

          for (const s of r.steps) {
            const stepRec = new Record(stepsCol)
            stepRec.set('dunning_rule', ruleRec.id)
            stepRec.set('order', s.order)
            stepRec.set('offset_days', s.offset_days)
            stepRec.set('channel', s.channel)
            stepRec.set('fallback_channel', s.fallback_channel)
            stepRec.set('fallback_after_hours', s.fallback_after_hours)
            stepRec.set('is_active', s.is_active)
            app.save(stepRec)
          }
        }
      }

      // 6. Seed Sync State
      try {
        app.findFirstRecordByData('sync_state', 'tenant', tenant.id)
      } catch (_) {
        const syncRec = new Record(syncCol)
        syncRec.set('tenant', tenant.id)
        syncRec.set('last_synced_at', new Date().toISOString())
        syncRec.set('sync_type', 'full_erp_conexos')
        syncRec.set('consecutive_failures', 0)
        app.save(syncRec)
      }
    }

    // 7. Seed ~200 Customers and ~1500 Receivables across the 3 tenants
    const companyPrefixes = [
      'Transportes & Cargas',
      'Indústria Metalúrgica',
      'Distribuidora Nacional',
      'Trading Comex',
      'Importadora Global',
      'Logística Express',
      'Armazéns Gerais',
      'Agropecuária Vale',
      'Bebidas & Alimentos',
      'Farma Distribuição',
      'Auto Peças Brasil',
      'Química Industrial',
      'Têxtil & Confecções',
      'Frigorífico Sul',
      'Comércio de Máquinas',
      'Navegação Portuária',
      'Papel & Embalagens',
      'Mineração Santos',
      'Consultoria Aduaneira',
      'Supermercados Estrela',
    ]

    const segments = [
      'Comex Grande Porte',
      'Médio Porte',
      'Varejo Distribuição',
      'Operações Portuárias',
      'Indústria',
    ]
    const riskFlags = ['baixo', 'medio', 'alto', 'critico']

    const now = new Date()
    let totalCustomersCreated = 0
    let totalReceivablesCreated = 0

    for (let tIdx = 0; tIdx < createdTenants.length; tIdx++) {
      const tenant = createdTenants[tIdx]
      const customerCountForTenant = tIdx === 0 ? 80 : tIdx === 1 ? 60 : 60

      for (let c = 1; c <= customerCountForTenant; c++) {
        const prefix = companyPrefixes[(c + tIdx * 7) % companyPrefixes.length]
        const name = `${prefix} ${String.fromCharCode(65 + (c % 26))} S.A. ${c}`
        const docRaw = (10000000000000 + tIdx * 1000000 + c * 137).toString()
        const cnpjFormatted = `${docRaw.slice(0, 2)}.${docRaw.slice(2, 5)}.${docRaw.slice(5, 8)}/0001-${docRaw.slice(12, 14)}`
        const segment = segments[(c + tIdx) % segments.length]
        const risk = riskFlags[c % riskFlags.length]
        const isOptedOut = c === 19 || c === 57
        const humanOnly = c === 11 || c === 42

        let custRec
        try {
          const existing = app.findRecordsByFilter(
            'customers',
            `tenant = '${tenant.id}' && external_id = 'CNX-CUST-${tIdx + 1}-${c}'`,
            '',
            1,
            0,
          )
          if (existing.length > 0) {
            custRec = existing[0]
          } else {
            throw new Error('not found')
          }
        } catch (_) {
          custRec = new Record(customersCol)
          custRec.set('tenant', tenant.id)
          custRec.set('external_id', `CNX-CUST-${tIdx + 1}-${c}`)
          custRec.set('document', cnpjFormatted)
          custRec.set('name', name)
          custRec.set('segment', segment)
          custRec.set('risk_flag', risk)
          custRec.set('is_opted_out', isOptedOut)
          custRec.set('human_only', humanOnly)
          custRec.set('notes', c % 5 === 0 ? 'Cliente com negociação frequente via diretoria' : '')
          app.save(custRec)
          totalCustomersCreated++

          // Add contacts (whatsapp + email)
          const waRec = new Record(contactsCol)
          waRec.set('customer', custRec.id)
          waRec.set('type', 'whatsapp')
          waRec.set('value', `+55119${String(80000000 + c * 123).slice(0, 8)}`)
          waRec.set('is_primary', true)
          waRec.set('is_valid', true)
          app.save(waRec)

          const emailRec = new Record(contactsCol)
          emailRec.set('customer', custRec.id)
          emailRec.set('type', 'email')
          emailRec.set(
            'value',
            `financeiro@${name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '')
              .slice(0, 15)}.com.br`,
          )
          emailRec.set('is_primary', true)
          emailRec.set('is_valid', true)
          app.save(emailRec)
        }

        // Receivables for this customer (between 6 and 9 per customer to reach ~1500 total)
        const receivablesPerCust = (c % 4) + 6
        for (let r = 1; r <= receivablesPerCust; r++) {
          // distribute due_date from -45 days ago to +30 days in future
          const offsetDays = ((c * 7 + r * 11) % 75) - 45
          const dueDateObj = new Date(now.getTime() + offsetDays * 86400000)
          const issueDateObj = new Date(dueDateObj.getTime() - 30 * 86400000)
          const amount = Math.round((1200 + ((c * 313 + r * 947) % 48000)) * 100) / 100

          let status = 'open'
          let openAmount = amount

          if (offsetDays < -15) {
            if (r % 3 === 0) {
              status = 'paid'
              openAmount = 0
            } else if (r % 7 === 0) {
              status = 'partially_paid'
              openAmount = Math.round(amount * 0.4 * 100) / 100
            } else if (r % 13 === 0) {
              status = 'disputed'
            }
          } else if (offsetDays >= -15 && offsetDays < 0) {
            if (r % 4 === 0) {
              status = 'paid'
              openAmount = 0
            }
          }

          const extRecId = `REC-${tIdx + 1}-${c}-${r}`
          try {
            const existing = app.findRecordsByFilter(
              'receivables',
              `tenant = '${tenant.id}' && external_id = '${extRecId}'`,
              '',
              1,
              0,
            )
            if (existing.length === 0) throw new Error('not found')
          } catch (_) {
            const recItem = new Record(receivablesCol)
            recItem.set('tenant', tenant.id)
            recItem.set('customer', custRec.id)
            recItem.set('external_id', extRecId)
            recItem.set('document_number', `FAT-${20250000 + c * 10 + r}`)
            recItem.set('installment', 1)
            recItem.set('issue_date', issueDateObj.toISOString())
            recItem.set('due_date', dueDateObj.toISOString())
            recItem.set('amount', amount)
            recItem.set('open_amount', openAmount)
            recItem.set('currency', 'BRL')
            recItem.set('status', status)
            recItem.set('payment_link_url', `https://fatura.vilaporto.com.br/pay/${extRecId}`)
            recItem.set('boleto_url', `https://fatura.vilaporto.com.br/boleto/${extRecId}.pdf`)
            recItem.set('last_synced_at', now.toISOString())
            recItem.set('source_hash', `hash_${c}_${r}_${amount}`)
            app.save(recItem)
            totalReceivablesCreated++
          }
        }

        // Seed a few active conversations, payment promises and tickets for backoffice demo
        if (c <= 12) {
          try {
            const existingConv = app.findRecordsByFilter(
              'conversations',
              `tenant = '${tenant.id}' && customer = '${custRec.id}'`,
              '',
              1,
              0,
            )
            if (existingConv.length === 0) {
              const conv = new Record(convsCol)
              conv.set('tenant', tenant.id)
              conv.set('customer', custRec.id)
              conv.set('channel', c % 2 === 0 ? 'whatsapp' : 'email')
              conv.set('external_thread_id', `thread_${tenant.id.slice(0, 4)}_${c}`)
              conv.set(
                'status',
                c === 1
                  ? 'human_needed'
                  : c === 2
                    ? 'human_active'
                    : c === 3
                      ? 'awaiting_customer'
                      : 'bot',
              )
              conv.set('last_inbound_at', new Date(now.getTime() - c * 3600000).toISOString())
              conv.set(
                'last_outbound_at',
                new Date(now.getTime() - (c - 1) * 3600000).toISOString(),
              )
              conv.set('window_expires_at', new Date(now.getTime() + 18 * 3600000).toISOString())
              app.save(conv)

              // Add messages to conversation
              const msgOut = new Record(msgsCol)
              msgOut.set('conversation', conv.id)
              msgOut.set('direction', 'out')
              msgOut.set('channel', conv.get('channel'))
              msgOut.set(
                'body',
                `Olá! Lembramos que o título FAT-${20250000 + c * 10 + 1} no valor de R$ ${(3400 + c * 250).toFixed(2)} venceu recentemente. Como podemos te ajudar?`,
              )
              msgOut.set('status', 'read')
              msgOut.set('sent_at', new Date(now.getTime() - c * 3600000).toISOString())
              app.save(msgOut)

              const msgIn = new Record(msgsCol)
              msgIn.set('conversation', conv.id)
              msgIn.set('direction', 'in')
              msgIn.set('channel', conv.get('channel'))
              if (c === 1) {
                msgIn.set(
                  'body',
                  'Olá, tivemos uma divergência de alíquota no faturamento deste frete. Gostaria de falar com um analista para ajustar antes do pagamento.',
                )
                msgIn.set('detected_intent', 'dispute_amount')
                msgIn.set('sentiment', 'neutro')
              } else if (c === 2) {
                msgIn.set(
                  'body',
                  'Bom dia, farei o pagamento do título na próxima sexta-feira dia 28 com certeza.',
                )
                msgIn.set('detected_intent', 'payment_promise')
                msgIn.set('sentiment', 'positivo')
              } else {
                msgIn.set('body', 'Poderia reenviar a 2ª via do boleto e o código PIX atualizados?')
                msgIn.set('detected_intent', 'request_invoice_copy')
                msgIn.set('sentiment', 'positivo')
              }
              msgIn.set('intent_confidence', 0.94)
              msgIn.set('status', 'replied')
              msgIn.set('sent_at', new Date(now.getTime() - (c - 1) * 3600000).toISOString())
              app.save(msgIn)

              if (c === 2) {
                const promise = new Record(promisesCol)
                promise.set('customer', custRec.id)
                promise.set('receivable_ids', [`REC-${tIdx + 1}-${c}-1`])
                promise.set('promised_date', new Date(now.getTime() + 4 * 86400000).toISOString())
                promise.set('promised_amount', 4500.0)
                promise.set('source', 'agent')
                promise.set('status', 'open')
                promise.set('captured_from_message', msgIn.id)
                app.save(promise)
              }

              if (c === 1) {
                const ticket = new Record(ticketsCol)
                ticket.set('tenant', tenant.id)
                ticket.set('customer', custRec.id)
                ticket.set('conversation', conv.id)
                ticket.set('reason', 'Divergência de alíquota de frete / contestação')
                ticket.set('status', 'open')
                ticket.set('due_at', new Date(now.getTime() + 24 * 3600000).toISOString())
                app.save(ticket)
              }
            }
          } catch (_) {}
        }
      }
    }
  },
  (app) => {
    // down migration
  },
)
