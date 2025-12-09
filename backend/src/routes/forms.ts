import express, { Response, Request } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Form from '../models/Form';
import User from '../models/User';
import { AirtableService } from '../services/airtableService';

const router = express.Router();

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, airtableBaseId, airtableTableId, questions } = req.body;

    if (!title || !airtableBaseId || !airtableTableId || !questions) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const supportedTypes = [
      'singleLineText',
      'multilineText',
      'singleSelect',
      'multipleSelects',
      'multipleAttachments',
    ];

    for (const question of questions) {
      if (!supportedTypes.includes(question.type)) {
        res.status(400).json({
          error: `Unsupported field type: ${question.type}`
        });
        return;
      }
    }

    const form = new Form({
      owner: req.user!.userId,
      title,
      airtableBaseId,
      airtableTableId,
      questions,
    });

    await form.save();

    const user = await User.findById(req.user!.userId);
    if (user) {
      try {
        const airtableService = new AirtableService(user.accessToken);
        const webhookUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/webhooks/airtable`;

        const webhook = await airtableService.createWebhook(
          airtableBaseId,
          webhookUrl,

          {
            options: {
              filters: {
                dataTypes: ['tableData'],
                recordChangeScope: airtableTableId,
              },
            },
          }
        );

        await airtableService.enableWebhook(airtableBaseId, webhook.id);

        form.webhookId = webhook.id;
        await form.save();
      } catch {
      }
    }

    res.status(201).json(form);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create form' });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const forms = await Form.find({ owner: req.user!.userId }).sort({ createdAt: -1 });
    res.json(forms);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

router.get('/:formId', async (req: Request, res: Response) => {
  try {
    const { formId } = req.params;
    const form = await Form.findById(formId);

    if (!form) {
      res.status(404).json({ error: 'Form not found' });
      return;
    }

    res.json(form);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

router.put('/:formId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { formId } = req.params;
    const form = await Form.findById(formId);

    if (!form) {
      res.status(404).json({ error: 'Form not found' });
      return;
    }

    if (form.owner.toString() !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const { title, questions } = req.body;
    if (title) form.title = title;
    if (questions) form.questions = questions;

    await form.save();
    res.json(form);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update form' });
  }
});

router.delete('/:formId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { formId } = req.params;
    const form = await Form.findById(formId);

    if (!form) {
      res.status(404).json({ error: 'Form not found' });
      return;
    }

    if (form.owner.toString() !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await Form.findByIdAndDelete(formId);
    res.json({ message: 'Form deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

export default router;

