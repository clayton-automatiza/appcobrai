migrate(
  (app) => {
    // 1. tenants
    const tenants = new Collection({
      name: 'tenants',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.role = 'super_admin'",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'super_admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'cnpj', type: 'text', required: true },
        { name: 'conexos_api_key', type: 'text' },
        { name: 'whatsapp_api_key', type: 'text' },
        { name: 'email_api_key', type: 'text' },
        { name: 'active', type: 'bool' },
        { name: 'brand_color', type: 'text' },
        { name: 'logo', type: 'file', maxSelect: 1, maxSize: 5242880 },
        { name: 'default_send_window_start', type: 'text' },
        { name: 'default_send_window_end', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_tenants_cnpj ON tenants (cnpj)'],
    })
    app.save(tenants)

    const tenantId = tenants.id

    // Update existing users collection to add role and tenant
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: [
            'super_admin',
            'diretoria',
            'gestor_financeiro',
            'analista_cobranca',
            'auditoria',
          ],
          maxSelect: 1,
        }),
      )
    }
    if (!users.fields.getByName('tenant')) {
      users.fields.add(
        new RelationField({
          name: 'tenant',
          collectionId: tenantId,
          maxSelect: 1,
        }),
      )
    }
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    users.createRule = "@request.auth.id != '' && @request.auth.role = 'super_admin'"
    users.updateRule = "@request.auth.id != ''"
    users.deleteRule = "@request.auth.id != '' && @request.auth.role = 'super_admin'"
    app.save(users)

    // 3. customers
    const customers = new Collection({
      name: 'customers',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'tenant', type: 'relation', collectionId: tenantId, maxSelect: 1, required: true },
        { name: 'external_id', type: 'text' },
        { name: 'document', type: 'text', required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'segment', type: 'text' },
        { name: 'risk_flag', type: 'text' },
        { name: 'is_opted_out', type: 'bool' },
        { name: 'human_only', type: 'bool' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_customers_tenant_ext ON customers (tenant, external_id)',
        'CREATE INDEX idx_customers_doc ON customers (tenant, document)',
      ],
    })
    app.save(customers)
    const customerId = customers.id

    // 4. customer_contacts
    const customerContacts = new Collection({
      name: 'customer_contacts',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'customer',
          type: 'relation',
          collectionId: customerId,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        {
          name: 'type',
          type: 'select',
          values: ['whatsapp', 'email'],
          maxSelect: 1,
          required: true,
        },
        { name: 'value', type: 'text', required: true },
        { name: 'is_primary', type: 'bool' },
        { name: 'is_valid', type: 'bool' },
        { name: 'validation_error', type: 'text' },
        { name: 'opt_out_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_contacts_customer ON customer_contacts (customer, type)'],
    })
    app.save(customerContacts)

    // 5. receivables
    const receivables = new Collection({
      name: 'receivables',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'tenant', type: 'relation', collectionId: tenantId, maxSelect: 1, required: true },
        {
          name: 'customer',
          type: 'relation',
          collectionId: customerId,
          maxSelect: 1,
          required: true,
        },
        { name: 'external_id', type: 'text' },
        { name: 'document_number', type: 'text' },
        { name: 'installment', type: 'number' },
        { name: 'issue_date', type: 'date' },
        { name: 'due_date', type: 'date', required: true },
        { name: 'amount', type: 'number' },
        { name: 'open_amount', type: 'number' },
        { name: 'currency', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['open', 'paid', 'partially_paid', 'cancelled', 'disputed'],
          maxSelect: 1,
          required: true,
        },
        { name: 'payment_link_url', type: 'text' },
        { name: 'boleto_url', type: 'text' },
        { name: 'last_synced_at', type: 'date' },
        { name: 'source_hash', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_receivables_tenant_status ON receivables (tenant, status, due_date)',
        'CREATE INDEX idx_receivables_customer ON receivables (customer, status)',
      ],
    })
    app.save(receivables)
    const receivableId = receivables.id

    // 6. receivable_events
    const receivableEvents = new Collection({
      name: 'receivable_events',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'receivable',
          type: 'relation',
          collectionId: receivableId,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        {
          name: 'type',
          type: 'select',
          values: ['created', 'due_date_changed', 'paid', 'cancelled', 'amount_changed'],
          maxSelect: 1,
          required: true,
        },
        { name: 'payload', type: 'json' },
        { name: 'occurred_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_rec_events_rec ON receivable_events (receivable, occurred_at)'],
    })
    app.save(receivableEvents)

    // 7. dunning_rules
    const dunningRules = new Collection({
      name: 'dunning_rules',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'tenant', type: 'relation', collectionId: tenantId, maxSelect: 1, required: true },
        { name: 'name', type: 'text', required: true },
        {
          name: 'scope',
          type: 'select',
          values: ['global', 'tenant', 'segment', 'customer'],
          maxSelect: 1,
          required: true,
        },
        { name: 'target_id', type: 'text' },
        { name: 'priority', type: 'number' },
        { name: 'is_active', type: 'bool' },
        { name: 'min_amount', type: 'number' },
        { name: 'send_window_start', type: 'text' },
        { name: 'send_window_end', type: 'text' },
        { name: 'business_days_only', type: 'bool' },
        { name: 'max_messages_per_customer_per_week', type: 'number' },
        { name: 'group_by_customer', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_dunning_rules_tenant ON dunning_rules (tenant, is_active, priority)',
      ],
    })
    app.save(dunningRules)
    const dunningRuleId = dunningRules.id

    // 8. dunning_steps
    const dunningSteps = new Collection({
      name: 'dunning_steps',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'dunning_rule',
          type: 'relation',
          collectionId: dunningRuleId,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        { name: 'order', type: 'number' },
        { name: 'offset_days', type: 'number' },
        {
          name: 'channel',
          type: 'select',
          values: ['whatsapp', 'email'],
          maxSelect: 1,
          required: true,
        },
        { name: 'fallback_channel', type: 'select', values: ['whatsapp', 'email'], maxSelect: 1 },
        { name: 'fallback_after_hours', type: 'number' },
        { name: 'template_id', type: 'text' },
        { name: 'is_active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_dunning_steps_rule ON dunning_steps (dunning_rule, order)'],
    })
    app.save(dunningSteps)
    const dunningStepId = dunningSteps.id

    // 9. message_templates
    const messageTemplates = new Collection({
      name: 'message_templates',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'tenant', type: 'relation', collectionId: tenantId, maxSelect: 1, required: true },
        {
          name: 'channel',
          type: 'select',
          values: ['whatsapp', 'email'],
          maxSelect: 1,
          required: true,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'category', type: 'text' },
        { name: 'external_template_name', type: 'text' },
        { name: 'language', type: 'text' },
        { name: 'body', type: 'text', required: true },
        { name: 'variables', type: 'json' },
        {
          name: 'approval_status',
          type: 'select',
          values: ['draft', 'pending', 'approved', 'rejected'],
          maxSelect: 1,
          required: true,
        },
        { name: 'approved_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_msg_tpl_tenant ON message_templates (tenant, channel, approval_status)',
      ],
    })
    app.save(messageTemplates)
    const messageTemplateId = messageTemplates.id

    // 10. conversations
    const conversations = new Collection({
      name: 'conversations',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'tenant', type: 'relation', collectionId: tenantId, maxSelect: 1, required: true },
        {
          name: 'customer',
          type: 'relation',
          collectionId: customerId,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'channel',
          type: 'select',
          values: ['whatsapp', 'email'],
          maxSelect: 1,
          required: true,
        },
        { name: 'external_thread_id', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['bot', 'awaiting_customer', 'human_needed', 'human_active', 'closed'],
          maxSelect: 1,
          required: true,
        },
        { name: 'assigned_user', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'last_inbound_at', type: 'date' },
        { name: 'last_outbound_at', type: 'date' },
        { name: 'window_expires_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_conversations_tenant_status ON conversations (tenant, status, last_inbound_at)',
      ],
    })
    app.save(conversations)
    const conversationId = conversations.id

    // 11. messages
    const messages = new Collection({
      name: 'messages',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'conversation',
          type: 'relation',
          collectionId: conversationId,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        { name: 'direction', type: 'select', values: ['out', 'in'], maxSelect: 1, required: true },
        {
          name: 'channel',
          type: 'select',
          values: ['whatsapp', 'email'],
          maxSelect: 1,
          required: true,
        },
        { name: 'template', type: 'relation', collectionId: messageTemplateId, maxSelect: 1 },
        { name: 'body', type: 'text', required: true },
        { name: 'provider_message_id', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['queued', 'sent', 'delivered', 'read', 'failed', 'replied'],
          maxSelect: 1,
          required: true,
        },
        { name: 'failure_reason', type: 'text' },
        { name: 'detected_intent', type: 'text' },
        { name: 'intent_confidence', type: 'number' },
        { name: 'sentiment', type: 'text' },
        { name: 'sent_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_messages_conv_created ON messages (conversation, created)'],
    })
    app.save(messages)
    const messageId = messages.id

    // 12. dunning_tasks
    const dunningTasks = new Collection({
      name: 'dunning_tasks',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'tenant', type: 'relation', collectionId: tenantId, maxSelect: 1, required: true },
        { name: 'receivable_ids', type: 'json' },
        {
          name: 'customer',
          type: 'relation',
          collectionId: customerId,
          maxSelect: 1,
          required: true,
        },
        { name: 'dunning_step', type: 'relation', collectionId: dunningStepId, maxSelect: 1 },
        { name: 'scheduled_for', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['scheduled', 'suppressed', 'sent', 'failed', 'cancelled'],
          maxSelect: 1,
          required: true,
        },
        { name: 'suppression_reason', type: 'text' },
        { name: 'conversation', type: 'relation', collectionId: conversationId, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_dunning_tasks_tenant ON dunning_tasks (tenant, scheduled_for, status)',
      ],
    })
    app.save(dunningTasks)

    // 13. payment_promises
    const paymentPromises = new Collection({
      name: 'payment_promises',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'customer',
          type: 'relation',
          collectionId: customerId,
          maxSelect: 1,
          required: true,
        },
        { name: 'receivable_ids', type: 'json' },
        { name: 'promised_date', type: 'date', required: true },
        { name: 'promised_amount', type: 'number' },
        {
          name: 'source',
          type: 'select',
          values: ['agent', 'human'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          values: ['open', 'kept', 'broken', 'cancelled'],
          maxSelect: 1,
          required: true,
        },
        { name: 'captured_from_message', type: 'relation', collectionId: messageId, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_promises_customer ON payment_promises (customer, status, promised_date)',
      ],
    })
    app.save(paymentPromises)

    // 14. tickets
    const tickets = new Collection({
      name: 'tickets',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'tenant', type: 'relation', collectionId: tenantId, maxSelect: 1, required: true },
        {
          name: 'customer',
          type: 'relation',
          collectionId: customerId,
          maxSelect: 1,
          required: true,
        },
        { name: 'conversation', type: 'relation', collectionId: conversationId, maxSelect: 1 },
        { name: 'reason', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['open', 'in_progress', 'resolved'],
          maxSelect: 1,
          required: true,
        },
        { name: 'assigned_user', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'due_at', type: 'date' },
        { name: 'resolution', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_tickets_tenant_status ON tickets (tenant, status)'],
    })
    app.save(tickets)

    // 15. suppressions
    const suppressions = new Collection({
      name: 'suppressions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'tenant', type: 'relation', collectionId: tenantId, maxSelect: 1, required: true },
        {
          name: 'customer',
          type: 'relation',
          collectionId: customerId,
          maxSelect: 1,
          required: true,
        },
        { name: 'receivable', type: 'relation', collectionId: receivableId, maxSelect: 1 },
        {
          name: 'reason',
          type: 'select',
          values: ['negotiation', 'dispute', 'special_contract', 'opt_out', 'manual_pause'],
          maxSelect: 1,
          required: true,
        },
        { name: 'starts_at', type: 'date', required: true },
        { name: 'ends_at', type: 'date' },
        {
          name: 'created_by_user',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_suppressions_customer ON suppressions (tenant, customer, reason)',
      ],
    })
    app.save(suppressions)

    // 16. holidays
    const holidays = new Collection({
      name: 'holidays',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'tenant', type: 'relation', collectionId: tenantId, maxSelect: 1 },
        { name: 'date', type: 'date', required: true },
        { name: 'name', type: 'text', required: true },
        {
          name: 'scope',
          type: 'select',
          values: ['national', 'tenant'],
          maxSelect: 1,
          required: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_holidays_date ON holidays (date, scope)'],
    })
    app.save(holidays)

    // 17. audit_logs
    const auditLogs = new Collection({
      name: 'audit_logs',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'tenant', type: 'relation', collectionId: tenantId, maxSelect: 1 },
        { name: 'user', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'entity', type: 'text', required: true },
        { name: 'entity_id', type: 'text' },
        { name: 'action', type: 'text', required: true },
        { name: 'before', type: 'json' },
        { name: 'after', type: 'json' },
        { name: 'occurred_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_audit_logs_occurred ON audit_logs (tenant, occurred_at)'],
    })
    app.save(auditLogs)

    // 18. sync_state
    const syncState = new Collection({
      name: 'sync_state',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'tenant', type: 'relation', collectionId: tenantId, maxSelect: 1, required: true },
        { name: 'last_synced_at', type: 'date' },
        { name: 'sync_type', type: 'text' },
        { name: 'last_error', type: 'text' },
        { name: 'consecutive_failures', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_sync_state_tenant ON sync_state (tenant)'],
    })
    app.save(syncState)
  },
  (app) => {
    const names = [
      'sync_state',
      'audit_logs',
      'holidays',
      'suppressions',
      'tickets',
      'payment_promises',
      'dunning_tasks',
      'messages',
      'conversations',
      'message_templates',
      'dunning_steps',
      'dunning_rules',
      'receivable_events',
      'receivables',
      'customer_contacts',
      'customers',
      'tenants',
    ]
    for (const name of names) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
