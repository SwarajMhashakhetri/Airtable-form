import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import User from '../models/User';
import { AirtableService } from '../services/airtableService';

const router = express.Router();

router.get('/bases', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const airtableService = new AirtableService(user.accessToken);
    const bases = await airtableService.getBases();

    res.json(bases);
  } catch {
    res.status(500).json({ error: 'Failed to fetch bases' });
  }
});

router.get('/bases/:baseId/tables', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { baseId } = req.params;
    const user = await User.findById(req.user!.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const airtableService = new AirtableService(user.accessToken);
    const tables = await airtableService.getBaseTables(baseId);

    res.json(tables);
  } catch {
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

router.get('/bases/:baseId/tables/:tableId/fields', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { baseId, tableId } = req.params;
    const user = await User.findById(req.user!.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const airtableService = new AirtableService(user.accessToken);
    const table = await airtableService.getTableSchema(baseId, tableId);

    if (!table) {
      res.status(404).json({ error: 'Table not found' });
      return;
    }

    const supportedTypes = [
      'singleLineText',
      'multilineText',
      'singleSelect',
      'multipleSelects',
      'multipleAttachments',
    ];

    const fields = table.fields
      .filter((field: any) => supportedTypes.includes(field.type))
      .map((field: any) => ({
        id: field.id,
        name: field.name,
        type: field.type,
        options: field.options?.choices?.map((c: any) => c.name) || [],
      }));

    res.json(fields);
  } catch {
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

export default router;

