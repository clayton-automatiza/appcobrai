import pb from '@/lib/pocketbase/client'
import type {
  Tenant,
  Customer,
  Receivable,
  DunningRule,
  DunningStep,
  MessageTemplate,
  Conversation,
  Message,
  PaymentPromise,
  Ticket,
  Suppression,
  Holiday,
  AuditLog,
  SyncState,
  CustomerContact,
} from '@/types'

export const api = {
  tenants: {
    list: async () => {
      return await pb.collection('tenants').getFullList<Tenant>({ sort: 'name' })
    },
    get: async (id: string) => {
      return await pb.collection('tenants').getOne<Tenant>(id)
    },
    update: async (id: string, data: Partial<Tenant>) => {
      return await pb.collection('tenants').update<Tenant>(id, data)
    },
  },

  customers: {
    list: async (tenantId?: string, search?: string, page = 1, perPage = 20) => {
      const filters: string[] = []
      if (tenantId && tenantId !== 'all') {
        filters.push(`tenant = '${tenantId}'`)
      }
      if (search) {
        filters.push(`(name ~ '${search}' || document ~ '${search}')`)
      }
      return await pb.collection('customers').getList<Customer>(page, perPage, {
        filter: filters.join(' && '),
        sort: '-created',
        expand: 'tenant',
      })
    },
    get: async (id: string) => {
      return await pb.collection('customers').getOne<Customer>(id, {
        expand: 'tenant',
      })
    },
    getContacts: async (customerId: string) => {
      return await pb.collection('customer_contacts').getFullList<CustomerContact>({
        filter: `customer = '${customerId}'`,
        sort: '-is_primary',
      })
    },
    update: async (id: string, data: Partial<Customer>) => {
      return await pb.collection('customers').update<Customer>(id, data)
    },
  },

  receivables: {
    list: async (params: {
      tenantId?: string
      customerId?: string
      status?: string
      search?: string
      page?: number
      perPage?: number
      sort?: string
    }) => {
      const filters: string[] = []
      if (params.tenantId && params.tenantId !== 'all') {
        filters.push(`tenant = '${params.tenantId}'`)
      }
      if (params.customerId) {
        filters.push(`customer = '${params.customerId}'`)
      }
      if (params.status && params.status !== 'all') {
        filters.push(`status = '${params.status}'`)
      }
      if (params.search) {
        filters.push(`(document_number ~ '${params.search}' || external_id ~ '${params.search}')`)
      }
      return await pb
        .collection('receivables')
        .getList<Receivable>(params.page || 1, params.perPage || 20, {
          filter: filters.join(' && '),
          sort: params.sort || '-due_date',
          expand: 'customer,tenant',
        })
    },
    get: async (id: string) => {
      return await pb.collection('receivables').getOne<Receivable>(id, {
        expand: 'customer,tenant',
      })
    },
    update: async (id: string, data: Partial<Receivable>) => {
      return await pb.collection('receivables').update<Receivable>(id, data)
    },
  },

  dunningRules: {
    list: async (tenantId?: string) => {
      const filter = tenantId && tenantId !== 'all' ? `tenant = '${tenantId}'` : ''
      return await pb.collection('dunning_rules').getFullList<DunningRule>({
        filter,
        sort: 'priority',
        expand: 'tenant',
      })
    },
    getSteps: async (ruleId: string) => {
      return await pb.collection('dunning_steps').getFullList<DunningStep>({
        filter: `dunning_rule = '${ruleId}'`,
        sort: 'order',
      })
    },
    create: async (data: Partial<DunningRule>) => {
      return await pb.collection('dunning_rules').create<DunningRule>(data)
    },
    update: async (id: string, data: Partial<DunningRule>) => {
      return await pb.collection('dunning_rules').update<DunningRule>(id, data)
    },
    createStep: async (data: Partial<DunningStep>) => {
      return await pb.collection('dunning_steps').create<DunningStep>(data)
    },
    updateStep: async (id: string, data: Partial<DunningStep>) => {
      return await pb.collection('dunning_steps').update<DunningStep>(id, data)
    },
    deleteStep: async (id: string) => {
      return await pb.collection('dunning_steps').delete(id)
    },
    simulate: async (tenantId: string, daysAhead = 7) => {
      const res = await fetch(
        `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/dunning/simulate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: pb.authStore.token,
          },
          body: JSON.stringify({ tenant_id: tenantId, days_ahead: daysAhead }),
        },
      )
      return await res.json()
    },
  },

  templates: {
    list: async (tenantId?: string) => {
      const filter = tenantId && tenantId !== 'all' ? `tenant = '${tenantId}'` : ''
      return await pb.collection('message_templates').getFullList<MessageTemplate>({
        filter,
        sort: '-created',
      })
    },
    create: async (data: Partial<MessageTemplate>) => {
      return await pb.collection('message_templates').create<MessageTemplate>(data)
    },
    update: async (id: string, data: Partial<MessageTemplate>) => {
      return await pb.collection('message_templates').update<MessageTemplate>(id, data)
    },
    delete: async (id: string) => {
      return await pb.collection('message_templates').delete(id)
    },
  },

  conversations: {
    list: async (tenantId?: string, status?: string) => {
      const filters: string[] = []
      if (tenantId && tenantId !== 'all') {
        filters.push(`tenant = '${tenantId}'`)
      }
      if (status && status !== 'all') {
        filters.push(`status = '${status}'`)
      }
      return await pb.collection('conversations').getFullList<Conversation>({
        filter: filters.join(' && '),
        sort: '-updated',
        expand: 'customer,tenant,assigned_user',
      })
    },
    getMessages: async (conversationId: string) => {
      return await pb.collection('messages').getFullList<Message>({
        filter: `conversation = '${conversationId}'`,
        sort: 'created',
      })
    },
    sendMessage: async (conversationId: string, body: string, channel: 'whatsapp' | 'email') => {
      return await pb.collection('messages').create<Message>({
        conversation: conversationId,
        direction: 'out',
        channel,
        body,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
    },
    update: async (id: string, data: Partial<Conversation>) => {
      return await pb.collection('conversations').update<Conversation>(id, data)
    },
  },

  paymentPromises: {
    list: async (customerId?: string) => {
      const filter = customerId ? `customer = '${customerId}'` : ''
      return await pb.collection('payment_promises').getFullList<PaymentPromise>({
        filter,
        sort: '-promised_date',
        expand: 'customer',
      })
    },
    update: async (id: string, data: Partial<PaymentPromise>) => {
      return await pb.collection('payment_promises').update<PaymentPromise>(id, data)
    },
  },

  tickets: {
    list: async (tenantId?: string, status?: string) => {
      const filters: string[] = []
      if (tenantId && tenantId !== 'all') {
        filters.push(`tenant = '${tenantId}'`)
      }
      if (status && status !== 'all') {
        filters.push(`status = '${status}'`)
      }
      return await pb.collection('tickets').getFullList<Ticket>({
        filter: filters.join(' && '),
        sort: '-created',
        expand: 'customer,assigned_user',
      })
    },
    update: async (id: string, data: Partial<Ticket>) => {
      return await pb.collection('tickets').update<Ticket>(id, data)
    },
  },

  suppressions: {
    list: async (tenantId?: string) => {
      const filter = tenantId && tenantId !== 'all' ? `tenant = '${tenantId}'` : ''
      return await pb.collection('suppressions').getFullList<Suppression>({
        filter,
        sort: '-starts_at',
        expand: 'customer,receivable,created_by_user',
      })
    },
    create: async (data: Partial<Suppression>) => {
      return await pb.collection('suppressions').create<Suppression>(data)
    },
    delete: async (id: string) => {
      return await pb.collection('suppressions').delete(id)
    },
  },

  holidays: {
    list: async (tenantId?: string) => {
      const filter =
        tenantId && tenantId !== 'all' ? `(scope = 'national' || tenant = '${tenantId}')` : ''
      return await pb.collection('holidays').getFullList<Holiday>({
        filter,
        sort: 'date',
      })
    },
    create: async (data: Partial<Holiday>) => {
      return await pb.collection('holidays').create<Holiday>(data)
    },
    delete: async (id: string) => {
      return await pb.collection('holidays').delete(id)
    },
  },

  auditLogs: {
    list: async (tenantId?: string, page = 1, perPage = 30) => {
      const filter = tenantId && tenantId !== 'all' ? `tenant = '${tenantId}'` : ''
      return await pb.collection('audit_logs').getList<AuditLog>(page, perPage, {
        filter,
        sort: '-occurred_at',
        expand: 'user,tenant',
      })
    },
  },

  syncState: {
    getForTenant: async (tenantId: string) => {
      try {
        return await pb
          .collection('sync_state')
          .getFirstListItem<SyncState>(`tenant = '${tenantId}'`, {
            expand: 'tenant',
          })
      } catch {
        return null
      }
    },
  },

  agent: {
    chat: async (message: string, customerContext?: string, conversationId?: string) => {
      const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: pb.authStore.token,
        },
        body: JSON.stringify({
          message,
          customer_context: customerContext,
          conversation_id: conversationId,
        }),
      })
      return await res.json()
    },
  },
}
