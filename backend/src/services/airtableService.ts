import axios, { AxiosInstance } from 'axios';

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';
const AIRTABLE_META_API = 'https://api.airtable.com/v0/meta';

export class AirtableService {
  private axiosInstance: AxiosInstance;

  constructor(accessToken: string) {
    this.axiosInstance = axios.create({
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getUserInfo() {
    const response = await this.axiosInstance.get('https://api.airtable.com/v0/meta/whoami');
    return response.data;
  }

  async getBases() {
    const response = await this.axiosInstance.get(`${AIRTABLE_META_API}/bases`);
    return response.data.bases;
  }

  async getBaseTables(baseId: string) {
    const response = await this.axiosInstance.get(`${AIRTABLE_META_API}/bases/${baseId}/tables`);
    return response.data.tables;
  }

  async getTableSchema(baseId: string, tableId: string) {
    const tables = await this.getBaseTables(baseId);
    const table = tables.find((t: any) => t.id === tableId);
    return table;
  }

  async createRecord(baseId: string, tableId: string, fields: Record<string, any>) {
    const response = await this.axiosInstance.post(
      `${AIRTABLE_API_BASE}/${baseId}/${tableId}`,
      { fields }
    );
    return response.data;
  }

  async updateRecord(baseId: string, tableId: string, recordId: string, fields: Record<string, any>) {
    const response = await this.axiosInstance.patch(
      `${AIRTABLE_API_BASE}/${baseId}/${tableId}/${recordId}`,
      { fields }
    );
    return response.data;
  }

  async deleteRecord(baseId: string, tableId: string, recordId: string) {
    const response = await this.axiosInstance.delete(
      `${AIRTABLE_API_BASE}/${baseId}/${tableId}/${recordId}`
    );
    return response.data;
  }

  async createWebhook(baseId: string, notificationUrl: string, specification: any) {
    const response = await this.axiosInstance.post(
      `https://api.airtable.com/v0/bases/${baseId}/webhooks`,
      {
        notificationUrl,
        specification,
      }
    );
    return response.data;
  }

  async enableWebhook(baseId: string, webhookId: string) {
    const response = await this.axiosInstance.post(
      `https://api.airtable.com/v0/bases/${baseId}/webhooks/${webhookId}/enableNotifications`, {
      "enable": true
    }
    );
    return response.data;
  }

  async refreshWebhook(baseId: string, webhookId: string) {
    const response = await this.axiosInstance.post(
      `https://api.airtable.com/v0/bases/${baseId}/webhooks/${webhookId}/refresh`
    );
    return response.data;
  }

  async listWebhooks(baseId: string) {
    const response = await this.axiosInstance.get(
      `https://api.airtable.com/v0/bases/${baseId}/webhooks`
    );
    return response.data;
  }

  async deleteWebhook(baseId: string, webhookId: string) {
    const response = await this.axiosInstance.delete(
      `https://api.airtable.com/v0/bases/${baseId}/webhooks/${webhookId}`
    );
    return response.data;
  }

  async getWebhookPayloads(baseId: string, webhookId: string, cur?: number) {
    const response = await this.axiosInstance.get(
      `https://api.airtable.com/v0/bases/${baseId}/webhooks/${webhookId}/payloads`,
      {
        params: cur !== undefined ? { cur } : undefined,
      }
    );
    return response.data;
  }
}
