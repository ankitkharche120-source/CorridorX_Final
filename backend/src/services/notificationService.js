const db = require('../db');

class NotificationService {
  constructor() {
    this.hasWhatsApp = Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
    this.hasTwilio = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  }

  /**
   * Dispatch an urgent notification across configured channels
   */
  async notify({ recipientId, recipientPhone, channel = 'BROWSER', title, body, metadata = {} }) {
    // 1. Record in DB audit history
    const record = db.notifications.insert({
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipient_id: recipientId || 'ALL',
      recipient_phone: recipientPhone || null,
      channel,
      title,
      body,
      metadata_json: JSON.stringify(metadata),
      sent_at: new Date().toISOString(),
      status: 'SENT'
    });

    // 2. Dispatch to external adapters if configured
    if (channel === 'WHATSAPP' && this.hasWhatsApp && recipientPhone) {
      await this.sendWhatsAppMessage(recipientPhone, `${title}\n\n${body}`);
    } else if (channel === 'SMS' && this.hasTwilio && recipientPhone) {
      await this.sendSmsMessage(recipientPhone, `${title}: ${body}`);
    }

    return record;
  }

  async sendWhatsAppMessage(toPhone, messageText) {
    try {
      const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: toPhone.replace(/[^0-9]/g, ''),
          type: 'text',
          text: { body: messageText }
        })
      });
    } catch (err) {
      console.warn('[WhatsApp Notification Adapter] Failed to dispatch message:', err.message);
    }
  }

  async sendSmsMessage(toPhone, messageText) {
    try {
      console.log(`[SMS Notification Adapter] Simulated SMS to ${toPhone}: ${messageText}`);
    } catch (err) {
      console.warn('[SMS Notification Adapter] Failed:', err.message);
    }
  }
}

module.exports = new NotificationService();
