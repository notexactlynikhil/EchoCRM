/**
 * Wavelength Supabase Client for Browser Extension
 * Uses standard REST & Storage APIs with the client-side anon key.
 * Provides idempotent database records upsert and WebM audio uploads.
 */

const SUPABASE_CONFIG = {
  url: 'https://qrstkwlakctszamkvsgh.supabase.co',
  anonKey: 'sb_publishable_zqppgbF5RgedwkOOxXaJKg_9abQjvdP',
  bucket: 'meeting-recordings'
};

class SupabaseExtensionClient {
  constructor(config = SUPABASE_CONFIG) {
    this.url = config.url.replace(/\/$/, '');
    this.anonKey = config.anonKey;
    this.bucket = config.bucket;
  }

  getHeaders(contentType = 'application/json', extraHeaders = {}) {
    const headers = {
      'apikey': this.anonKey,
      'Authorization': `Bearer ${this.anonKey}`,
      ...extraHeaders
    };
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    return headers;
  }

  /**
   * Idempotent upsert of meeting record row
   */
  async upsertMeetingRecord(record) {
    const endpoint = `${this.url}/rest/v1/meeting_recordings?on_conflict=id`;
    const payload = {
      id: record.id,
      platform: record.platform || 'unknown',
      meeting_url: record.meetingUrl || '',
      started_at: record.startedAt || new Date().toISOString(),
      stopped_at: record.stoppedAt || null,
      duration_seconds: record.durationSeconds || 0,
      mime_type: record.mimeType || 'audio/webm',
      storage_path: record.storagePath || `recordings/${record.id}.webm`,
      status: record.status || 'local_saved',
      disclosure_attempted: Boolean(record.disclosureAttempted),
      disclosure_delivered: Boolean(record.disclosureDelivered),
      disclosure_timestamp: record.disclosureTimestamp || null,
      upload_attempts: record.uploadAttempts || 0,
      last_error: record.lastError || null,
      updated_at: new Date().toISOString()
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: this.getHeaders('application/json', {
        'Prefer': 'resolution=merge-duplicates,return=representation'
      }),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Supabase DB error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data && data[0] ? data[0] : payload;
  }

  /**
   * Upload audio WebM blob to Supabase Storage with idempotent overwrite (x-upsert: true)
   */
  async uploadAudioBlob(recordingId, audioBlob) {
    const storagePath = `recordings/${recordingId}.webm`;
    const endpoint = `${this.url}/storage/v1/object/${this.bucket}/${storagePath}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: this.getHeaders(audioBlob.type || 'audio/webm', {
        'x-upsert': 'true'
      }),
      body: audioBlob
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Supabase Storage upload error (${res.status}): ${errText}`);
    }

    const publicUrl = `${this.url}/storage/v1/object/public/${this.bucket}/${storagePath}`;
    return {
      storagePath,
      publicUrl
    };
  }

  /**
   * Complete upload workflow: DB Upsert -> Storage Upload -> DB Status Update
   */
  async uploadRecording(record, audioBlob) {
    // 1. Initial status update: uploading
    await this.upsertMeetingRecord({
      ...record,
      status: 'uploading'
    });

    try {
      // 2. Upload file to storage bucket
      const { storagePath, publicUrl } = await this.uploadAudioBlob(record.id, audioBlob);

      // 3. Mark completed in DB
      const updatedRow = await this.upsertMeetingRecord({
        ...record,
        storagePath,
        status: 'uploaded',
        lastError: null
      });

      return {
        success: true,
        record: updatedRow,
        publicUrl
      };
    } catch (err) {
      // 4. Mark failure in DB
      await this.upsertMeetingRecord({
        ...record,
        status: 'upload_failed',
        uploadAttempts: (record.uploadAttempts || 0) + 1,
        lastError: err.message || String(err)
      }).catch(() => {});

      throw err;
    }
  }
}

if (typeof window !== 'undefined') {
  window.supabaseClient = new SupabaseExtensionClient();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SupabaseExtensionClient };
}
