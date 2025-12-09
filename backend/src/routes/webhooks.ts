import express, { Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ResponseModel } from '../models/Response';
import Form from '../models/Form';
import User from '../models/User';
import { AirtableService } from '../services/airtableService';

const router = express.Router();

router.post('/airtable', async (req: Request, res: Response) => {
  try {
    const webhookPayload = req.body;

    if (!webhookPayload || !webhookPayload.base || !webhookPayload.webhook) {
      res.status(400).json({ error: 'Invalid webhook payload' });
      return;
    }

    const { base, webhook } = webhookPayload;

    const primaryForm = await Form.findOne({ webhookId: webhook.id });
    if (!primaryForm) {
      res.status(200).json({ message: 'No matching form for webhook' });
      return;
    }

    const user = await User.findById(primaryForm.owner);
    if (!user) {
      res.status(404).json({ error: 'User not found for webhook' });
      return;
    }

    const airtableService = new AirtableService(user.accessToken);

    const payloadResponse = await airtableService.getWebhookPayloads(
      base.id,
      webhook.id,
      primaryForm.webhookCur
    );

    const payloads = payloadResponse?.payloads || [];
    const nextCursor = payloadResponse?.cursor;

    if (webhookPayload.changedTablesById) {
      payloads.push({ changedTablesById: webhookPayload.changedTablesById });
    }

    if (payloads.length === 0) {
      res.status(200).json({ message: 'No new webhook payloads' });
      return;
    }

    const forms = await Form.find({ airtableBaseId: base.id });

    let updatedCount = 0;
    let deletedCount = 0;

    for (const payload of payloads) {
      const changedTablesById = (payload as any).changedTablesById || {};

      for (const [tableId, tableChanges] of Object.entries(changedTablesById)) {
        const relevantForms = forms.filter(f => f.airtableTableId === tableId);
        if (relevantForms.length === 0) {
          continue;
        }

        const changes = tableChanges as any;

        if (changes.changedRecordsById) {
          for (const [recordId, recordChange] of Object.entries(changes.changedRecordsById)) {
            const change = recordChange as any;

            const existingResponse = await ResponseModel.findOne({
              airtableRecordId: recordId,
            });

            if (existingResponse) {
              if (change.current) {
                existingResponse.answers = change.current.cellValuesByFieldId || existingResponse.answers;
                existingResponse.deletedInAirtable = false;
                existingResponse.updatedAt = new Date();
                await existingResponse.save();
                updatedCount++;
              } else if (!change.current && change.previous) {
                existingResponse.deletedInAirtable = true;
                existingResponse.updatedAt = new Date();
                await existingResponse.save();
                deletedCount++;
              }
            }
          }
        }

        if (changes.destroyedRecordIds && changes.destroyedRecordIds.length > 0) {
          for (const recordId of changes.destroyedRecordIds) {
            const existingResponse = await ResponseModel.findOne({
              airtableRecordId: recordId,
            });

            if (existingResponse) {
              existingResponse.deletedInAirtable = true;
              existingResponse.updatedAt = new Date();
              await existingResponse.save();
              deletedCount++;
            }
          }
        }
      }
    }

    if (typeof nextCursor === 'number') {
      primaryForm.webhookCur = nextCursor;
      await primaryForm.save();
    }

    res.status(200).json({
      message: 'Webhook processed successfully',
      stats: { updated: updatedCount, deleted: deletedCount }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

router.post('/enable/:formId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { formId } = req.params;

    const form = await Form.findById(formId);
    if (!form || form.owner.toString() !== req.user!.userId) {
      res.status(404).json({ error: 'Form not found' });
      return;
    }

    if (!form.webhookId) {
      res.status(400).json({ error: 'No webhook registered for this form' });
      return;
    }

    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const airtableService = new AirtableService(user.accessToken);
    await airtableService.enableWebhook(form.airtableBaseId, form.webhookId);

    res.json({ message: 'Webhook enabled successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to enable webhook' });
  }
});

router.post('/refresh/:formId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { formId } = req.params;

    const form = await Form.findById(formId);
    if (!form || form.owner.toString() !== req.user!.userId) {
      res.status(404).json({ error: 'Form not found' });
      return;
    }

    if (!form.webhookId) {
      res.status(400).json({ error: 'No webhook registered for this form' });
      return;
    }

    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const airtableService = new AirtableService(user.accessToken);
    const result = await airtableService.refreshWebhook(form.airtableBaseId, form.webhookId);

    res.json({
      message: 'Webhook refreshed successfully',
      cursor: result.cursor
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to refresh webhook' });
  }
});

export default router;
