import express, { Response, Request } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Form from '../models/Form';
import { ResponseModel } from '../models/Response';
import User from '../models/User';
import { AirtableService } from '../services/airtableService';
import { shouldShowQuestion } from '../utils/conditionalLogic';

const router = express.Router();

router.post('/:formId', async (req: Request, res: Response) => {
  try {
    const { formId } = req.params;
    const { answers } = req.body;

    const form = await Form.findById(formId).populate('owner');
    if (!form) {
      res.status(404).json({ error: 'Form not found' });
      return;
    }

    const visibleQuestions = form.questions.filter(q =>
      shouldShowQuestion(q.conditionalRules, answers)
    );

    for (const question of visibleQuestions) {
      if (question.required && !answers[question.questionKey]) {
        res.status(400).json({
          error: `Required field missing: ${question.label}`
        });
        return;
      }
    }

    const owner = form.owner as any;
    const airtableService = new AirtableService(owner.accessToken);

    const airtableFields: Record<string, any> = {};
    for (const question of form.questions) {
      if (answers[question.questionKey] !== undefined) {
        const fieldName = form.questions.find(
          q => q.questionKey === question.questionKey
        )?.label || question.questionKey;

        airtableFields[fieldName] = answers[question.questionKey];
      }
    }

    const airtableRecord = await airtableService.createRecord(
      form.airtableBaseId,
      form.airtableTableId,
      airtableFields
    );

    const response = new ResponseModel({
      formId: form._id,
      airtableRecordId: airtableRecord.id,
      answers,
    });

    await response.save();

    res.status(201).json({
      id: response._id,
      airtableRecordId: airtableRecord.id,
      message: 'Response submitted successfully',
    });
  } catch {
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

router.get('/:formId', authenticate, async (req: AuthRequest, res: Response) => {
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

    const responses = await ResponseModel.find({ formId }).sort({ createdAt: -1 });

    res.json(responses);
  } catch {
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

export default router;

