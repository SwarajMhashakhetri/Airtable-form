import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFormStore } from '../store/formStore';
import { AirtableBase, AirtableTable, AirtableField, Question, Condition } from '../types';
import api from '../utils/api';

export default function FormBuilder() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { currentForm, fetchForm } = useFormStore();
  const [title, setTitle] = useState('');
  const [bases, setBases] = useState<AirtableBase[]>([]);
  const [tables, setTables] = useState<AirtableTable[]>([]);
  const [fields, setFields] = useState<AirtableField[]>([]);
  const [selectedBase, setSelectedBase] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (formId) {
      fetchForm(formId);
    }
  }, [formId, fetchForm]);

  useEffect(() => {
    if (currentForm && formId) {
      setTitle(currentForm.title);
      setSelectedBase(currentForm.airtableBaseId);
      setSelectedTable(currentForm.airtableTableId);
      setQuestions(currentForm.questions);
    }
  }, [currentForm, formId]);

  useEffect(() => {
    const fetchBases = async () => {
      try {
        const response = await api.get('/airtable/bases');
        setBases(response.data);
      } catch {
      }
    };
    fetchBases();
  }, []);

  useEffect(() => {
    if (selectedBase) {
      const fetchTables = async () => {
        try {
          const response = await api.get(`/airtable/bases/${selectedBase}/tables`);
          setTables(response.data);
        } catch {
        }
      };
      fetchTables();
    }
  }, [selectedBase]);

  useEffect(() => {
    if (selectedBase && selectedTable) {
      const fetchFields = async () => {
        try {
          const response = await api.get(
            `/airtable/bases/${selectedBase}/tables/${selectedTable}/fields`
          );
          setFields(response.data);
        } catch {
        }
      };
      fetchFields();
    }
  }, [selectedBase, selectedTable]);

  const addQuestion = (field: AirtableField) => {
    const questionKey = `q_${Date.now()}`;
    const newQuestion: Question = {
      questionKey,
      airtableFieldId: field.id,
      label: field.name,
      type: field.type as any,
      required: false,
      options: field.options,
      conditionalRules: null,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionKey: string) => {
    setQuestions(questions.filter((q) => q.questionKey !== questionKey));
  };

  const updateQuestion = (questionKey: string, updates: Partial<Question>) => {
    setQuestions(
      questions.map((q) => (q.questionKey === questionKey ? { ...q, ...updates } : q))
    );
  };

  const addCondition = (questionKey: string) => {
    const question = questions.find((q) => q.questionKey === questionKey);
    if (!question) return;

    const newCondition: Condition = {
      questionKey: questions[0]?.questionKey || '',
      operator: 'equals',
      value: '',
    };

    if (!question.conditionalRules) {
      updateQuestion(questionKey, {
        conditionalRules: {
          logic: 'AND',
          conditions: [newCondition],
        },
      });
    } else {
      updateQuestion(questionKey, {
        conditionalRules: {
          ...question.conditionalRules,
          conditions: [...question.conditionalRules.conditions, newCondition],
        },
      });
    }
  };

  const removeCondition = (questionKey: string, conditionIndex: number) => {
    const question = questions.find((q) => q.questionKey === questionKey);
    if (!question || !question.conditionalRules) return;

    const updatedConditions = question.conditionalRules.conditions.filter(
      (_, index) => index !== conditionIndex
    );

    updateQuestion(questionKey, {
      conditionalRules:
        updatedConditions.length > 0
          ? { ...question.conditionalRules, conditions: updatedConditions }
          : null,
    });
  };

  const updateCondition = (
    questionKey: string,
    conditionIndex: number,
    updates: Partial<Condition>
  ) => {
    const question = questions.find((q) => q.questionKey === questionKey);
    if (!question || !question.conditionalRules) return;

    const updatedConditions = question.conditionalRules.conditions.map((c, index) =>
      index === conditionIndex ? { ...c, ...updates } : c
    );

    updateQuestion(questionKey, {
      conditionalRules: {
        ...question.conditionalRules,
        conditions: updatedConditions,
      },
    });
  };

  const handleSave = async () => {
    if (!title || !selectedBase || !selectedTable || questions.length === 0) {
      alert('Please complete all fields');
      return;
    }

    setLoading(true);
    try {
      const formData = {
        title,
        airtableBaseId: selectedBase,
        airtableTableId: selectedTable,
        questions,
      };

      if (formId) {
        await api.put(`/forms/${formId}`, formData);
      } else {
        await api.post('/forms', formData);
      }

      navigate('/');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">
          {formId ? 'Edit Form' : 'Create New Form'}
        </h1>
        <Link to="/" className="btn-secondary">
          Cancel
        </Link>
      </div>

      <div className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Step 1: Basic Information</h2>
          <div>
            <label className="label">Form Title</label>
            <input
              type="text"
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter form title"
            />
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Step 2: Select Airtable Source</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Airtable Base</label>
              <select
                className="input-field"
                value={selectedBase}
                onChange={(e) => {
                  setSelectedBase(e.target.value);
                  setSelectedTable('');
                  setQuestions([]);
                }}
              >
                <option value="">Select a base</option>
                {bases.map((base) => (
                  <option key={base.id} value={base.id}>
                    {base.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedBase && (
              <div>
                <label className="label">Table</label>
                <select
                  className="input-field"
                  value={selectedTable}
                  onChange={(e) => {
                    setSelectedTable(e.target.value);
                    setQuestions([]);
                  }}
                >
                  <option value="">Select a table</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {selectedBase && selectedTable && fields.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4">Step 3: Add Fields</h2>
            <div className="space-y-2 mb-4">
              {fields.map((field) => (
                <button
                  key={field.id}
                  onClick={() => addQuestion(field)}
                  className="w-full text-left px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-colors"
                >
                  <span className="text-white">{field.name}</span>
                  <span className="text-gray-400 text-sm ml-2">({field.type})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {questions.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4">Step 4: Configure Questions</h2>
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.questionKey} className="border border-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-gray-400 text-sm">Question {index + 1}</span>
                    <button
                      onClick={() => removeQuestion(question.questionKey)}
                      className="text-red-500 hover:text-red-400 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="label">Label</label>
                      <input
                        type="text"
                        className="input-field"
                        value={question.label}
                        onChange={(e) =>
                          updateQuestion(question.questionKey, { label: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`required-${question.questionKey}`}
                        checked={question.required}
                        onChange={(e) =>
                          updateQuestion(question.questionKey, { required: e.target.checked })
                        }
                        className="w-4 h-4"
                      />
                      <label
                        htmlFor={`required-${question.questionKey}`}
                        className="text-gray-300 text-sm"
                      >
                        Required field
                      </label>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="label">Conditional Logic</span>
                        <button
                          onClick={() => addCondition(question.questionKey)}
                          className="text-blue-500 hover:text-blue-400 text-sm"
                        >
                          Add Condition
                        </button>
                      </div>

                      {question.conditionalRules && (
                        <div className="space-y-3 bg-gray-800 p-3 rounded">
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Logic</label>
                            <select
                              className="input-field text-sm"
                              value={question.conditionalRules.logic}
                              onChange={(e) =>
                                updateQuestion(question.questionKey, {
                                  conditionalRules: {
                                    ...question.conditionalRules!,
                                    logic: e.target.value as 'AND' | 'OR',
                                  },
                                })
                              }
                            >
                              <option value="AND">AND</option>
                              <option value="OR">OR</option>
                            </select>
                          </div>

                          {question.conditionalRules.conditions.map((condition, condIndex) => (
                            <div
                              key={condIndex}
                              className="border border-gray-700 rounded p-2 space-y-2"
                            >
                              <div className="flex justify-end">
                                <button
                                  onClick={() => removeCondition(question.questionKey, condIndex)}
                                  className="text-red-500 hover:text-red-400 text-xs"
                                >
                                  Remove
                                </button>
                              </div>

                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">
                                  If question
                                </label>
                                <select
                                  className="input-field text-sm"
                                  value={condition.questionKey}
                                  onChange={(e) =>
                                    updateCondition(question.questionKey, condIndex, {
                                      questionKey: e.target.value,
                                    })
                                  }
                                >
                                  {questions
                                    .filter((q) => q.questionKey !== question.questionKey)
                                    .map((q) => (
                                      <option key={q.questionKey} value={q.questionKey}>
                                        {q.label}
                                      </option>
                                    ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">
                                  Operator
                                </label>
                                <select
                                  className="input-field text-sm"
                                  value={condition.operator}
                                  onChange={(e) =>
                                    updateCondition(question.questionKey, condIndex, {
                                      operator: e.target.value as any,
                                    })
                                  }
                                >
                                  <option value="equals">Equals</option>
                                  <option value="notEquals">Not Equals</option>
                                  <option value="contains">Contains</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">Value</label>
                                <input
                                  type="text"
                                  className="input-field text-sm"
                                  value={condition.value}
                                  onChange={(e) =>
                                    updateCondition(question.questionKey, condIndex, {
                                      value: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {questions.length > 0 && (
          <div className="flex justify-end space-x-4">
            <Link to="/" className="btn-secondary">
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : formId ? 'Update Form' : 'Create Form'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
