import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Form, Question } from '../types';
import { shouldShowQuestion } from '../utils/conditionalLogic';
import api from '../utils/api';

export default function FormViewer() {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await api.get(`/forms/${formId}`);
        setForm(response.data);
      } catch {
        setError('Form not found');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId]);

  const handleInputChange = (questionKey: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form) return;

    const visibleQuestions = form.questions.filter((q) =>
      shouldShowQuestion(q.conditionalRules, answers)
    );

    for (const question of visibleQuestions) {
      if (question.required && !answers[question.questionKey]) {
        setError(`Please fill in: ${question.label}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.post(`/responses/${formId}`, { answers });
      setSubmitted(true);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const isVisible = shouldShowQuestion(question.conditionalRules, answers);

    if (!isVisible) return null;

    switch (question.type) {
      case 'singleLineText':
        return (
          <input
            type="text"
            className="input-field"
            value={answers[question.questionKey] || ''}
            onChange={(e) => handleInputChange(question.questionKey, e.target.value)}
            required={question.required}
          />
        );

      case 'multilineText':
        return (
          <textarea
            className="input-field"
            rows={4}
            value={answers[question.questionKey] || ''}
            onChange={(e) => handleInputChange(question.questionKey, e.target.value)}
            required={question.required}
          />
        );

      case 'singleSelect':
        return (
          <select
            className="input-field"
            value={answers[question.questionKey] || ''}
            onChange={(e) => handleInputChange(question.questionKey, e.target.value)}
            required={question.required}
          >
            <option value="">Select an option</option>
            {question.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multipleSelects':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={(answers[question.questionKey] || []).includes(option)}
                  onChange={(e) => {
                    const current = answers[question.questionKey] || [];
                    const updated = e.target.checked
                      ? [...current, option]
                      : current.filter((v: string) => v !== option);
                    handleInputChange(question.questionKey, updated);
                  }}
                />
                <span className="text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'multipleAttachments':
        return (
          <input
            type="file"
            multiple
            className="input-field"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              handleInputChange(question.questionKey, files.map(f => f.name));
            }}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading form...</div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="card max-w-md">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Form Submitted Successfully
          </h2>
          <p className="text-gray-400">Thank you for your response</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-3xl font-bold text-white mb-8">
            {form?.title}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {form?.questions.map((question) => (
              <div key={question.questionKey}>
                {shouldShowQuestion(question.conditionalRules, answers) && (
                  <div>
                    <label className="label">
                      {question.label}
                      {question.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    {renderQuestion(question)}
                  </div>
                )}
              </div>
            ))}

            {error && (
              <div className="bg-red-900/20 border border-red-900 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Form'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
