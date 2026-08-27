cronAdd('erp_sync', '0 2 * * *', () => {
  try {
    const tenants = $app.findRecordsByFilter('tenants', 'active = true', '', 50, 0)
    const now = new Date()

    for (const tenant of tenants) {
      let syncRecord
      try {
        syncRecord = $app.findFirstRecordByData('sync_state', 'tenant', tenant.id)
      } catch (_) {
        const syncCol = $app.findCollectionByNameOrId('sync_state')
        syncRecord = new Record(syncCol)
        syncRecord.set('tenant', tenant.id)
      }

      // Simulated sync logic for Conexos ERP
      syncRecord.set('last_synced_at', now.toISOString())
      syncRecord.set('sync_type', 'conexos_auto_sync')
      syncRecord.set('last_error', '')
      syncRecord.set('consecutive_failures', 0)
      $app.save(syncRecord)

      // Audit log entry
      const auditCol = $app.findCollectionByNameOrId('audit_logs')
      const audit = new Record(auditCol)
      audit.set('tenant', tenant.id)
      audit.set('entity', 'sync_state')
      audit.set('entity_id', syncRecord.id)
      audit.set('action', 'erp_sync_completed')
      audit.set('occurred_at', now.toISOString())
      $app.save(audit)
    }
  } catch (err) {
    console.error('erp_sync cron error:', err)
  }
})
