export interface Tenant {
  id: string
  name: string
  cnpj: string
  conexos_api_key?: string
  whatsapp_api_key?: string
  email_api_key?: string
  active: boolean
  brand_color?: string
  logo?: string
  default_send_window_start?: string
  default_send_window_end?: string
  created: string
  updated: string
}

export type UserRole =
  | 'super_admin'
  | 'diretoria'
  | 'gestor_financeiro'
  | 'analista_cobranca'
  | 'auditoria'

export interface User {
  id: string
  email: string
  name?: string
  role?: UserRole
  tenant?: string
  avatar?: string
  created: string
  updated: string
}

export interface Customer {
  id: string
  tenant: string
  external_id?: string
  document: string
  name: string
  segment?: string
  risk_flag?: 'baixo' | 'medio' | 'alto' | 'critico' | string
  is_opted_out?: boolean
  human_only?: boolean
  notes?: string
  created: string
  updated: string
  expand?: {
    tenant?: Tenant
    customer_contacts_via_customer?: CustomerContact[]
  }
}

export interface CustomerContact {
  id: string
  customer: string
  type: 'whatsapp' | 'email'
  value: string
  is_primary?: boolean
  is_valid?: boolean
  validation_error?: string
  opt_out_at?: string
  created: string
  updated: string
}

export type ReceivableStatus = 'open' | 'paid' | 'partially_paid' | 'cancelled' | 'disputed'

export interface Receivable {
  id: string
  tenant: string
  customer: string
  external_id?: string
  document_number?: string
  installment?: number
  issue_date?: string
  due_date: string
  amount: number
  open_amount: number
  currency?: string
  status: ReceivableStatus
  payment_link_url?: string
  boleto_url?: string
  last_synced_at?: string
  source_hash?: string
  created: string
  updated: string
  expand?: {
    customer?: Customer
    tenant?: Tenant
  }
}

export interface ReceivableEvent {
  id: string
  receivable: string
  type: 'created' | 'due_date_changed' | 'paid' | 'cancelled' | 'amount_changed'
  payload?: Record<string, unknown>
  occurred_at?: string
  created: string
  updated: string
}

export interface DunningRule {
  id: string
  tenant: string
  name: string
  scope: 'global' | 'tenant' | 'segment' | 'customer'
  target_id?: string
  priority?: number
  is_active?: boolean
  min_amount?: number
  send_window_start?: string
  send_window_end?: string
  business_days_only?: boolean
  max_messages_per_customer_per_week?: number
  group_by_customer?: boolean
  created: string
  updated: string
  expand?: {
    tenant?: Tenant
    dunning_steps_via_dunning_rule?: DunningStep[]
  }
}

export interface DunningStep {
  id: string
  dunning_rule: string
  order: number
  offset_days: number
  channel: 'whatsapp' | 'email'
  fallback_channel?: 'whatsapp' | 'email'
  fallback_after_hours?: number
  template_id?: string
  is_active?: boolean
  created: string
  updated: string
}

export interface MessageTemplate {
  id: string
  tenant: string
  channel: 'whatsapp' | 'email'
  name: string
  category?: string
  external_template_name?: string
  language?: string
  body: string
  variables?: string[]
  approval_status: 'draft' | 'pending' | 'approved' | 'rejected'
  approved_at?: string
  created: string
  updated: string
}

export type ConversationStatus =
  | 'bot'
  | 'awaiting_customer'
  | 'human_needed'
  | 'human_active'
  | 'closed'

export interface Conversation {
  id: string
  tenant: string
  customer: string
  channel: 'whatsapp' | 'email'
  external_thread_id?: string
  status: ConversationStatus
  assigned_user?: string
  last_inbound_at?: string
  last_outbound_at?: string
  window_expires_at?: string
  created: string
  updated: string
  expand?: {
    customer?: Customer
    tenant?: Tenant
    assigned_user?: User
  }
}

export interface Message {
  id: string
  conversation: string
  direction: 'out' | 'in'
  channel: 'whatsapp' | 'email'
  template?: string
  body: string
  provider_message_id?: string
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'replied'
  failure_reason?: string
  detected_intent?: string
  intent_confidence?: number
  sentiment?: string
  sent_at?: string
  created: string
  updated: string
}

export interface DunningTask {
  id: string
  tenant: string
  receivable_ids?: string[]
  customer: string
  dunning_step?: string
  scheduled_for: string
  status: 'scheduled' | 'suppressed' | 'sent' | 'failed' | 'cancelled'
  suppression_reason?: string
  conversation?: string
  created: string
  updated: string
  expand?: {
    customer?: Customer
    dunning_step?: DunningStep
  }
}

export interface PaymentPromise {
  id: string
  customer: string
  receivable_ids?: string[]
  promised_date: string
  promised_amount?: number
  source: 'agent' | 'human'
  status: 'open' | 'kept' | 'broken' | 'cancelled'
  captured_from_message?: string
  created: string
  updated: string
  expand?: {
    customer?: Customer
  }
}

export interface Ticket {
  id: string
  tenant: string
  customer: string
  conversation?: string
  reason: string
  status: 'open' | 'in_progress' | 'resolved'
  assigned_user?: string
  due_at?: string
  resolution?: string
  created: string
  updated: string
  expand?: {
    customer?: Customer
    assigned_user?: User
  }
}

export interface Suppression {
  id: string
  tenant: string
  customer: string
  receivable?: string
  reason: 'negotiation' | 'dispute' | 'special_contract' | 'opt_out' | 'manual_pause'
  starts_at: string
  ends_at?: string
  created_by_user?: string
  created: string
  updated: string
  expand?: {
    customer?: Customer
    receivable?: Receivable
    created_by_user?: User
  }
}

export interface Holiday {
  id: string
  tenant?: string
  date: string
  name: string
  scope: 'national' | 'tenant'
  created: string
  updated: string
}

export interface AuditLog {
  id: string
  tenant?: string
  user?: string
  entity: string
  entity_id?: string
  action: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  occurred_at?: string
  created: string
  updated: string
  expand?: {
    user?: User
    tenant?: Tenant
  }
}

export interface SyncState {
  id: string
  tenant: string
  last_synced_at?: string
  sync_type?: string
  last_error?: string
  consecutive_failures?: number
  created: string
  updated: string
  expand?: {
    tenant?: Tenant
  }
}
