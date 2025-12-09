import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FormResponse } from '../types';
import api from '../utils/api';

export default function ResponseList() {
  const { formId } = useParams<{ formId: string }>();
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const response = await api.get(`/responses/${formId}`);
        setResponses(response.data);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [formId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading responses...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Form Responses</h1>
        <Link to="/" className="btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      {responses.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No responses yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {responses.map((response) => (
            <div
              key={response._id}
              className={`card ${response.deletedInAirtable ? 'opacity-50 border-red-900' : ''
                }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-400">
                    Submitted: {new Date(response.createdAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Record ID: {response.airtableRecordId}
                  </p>
                </div>
                {response.deletedInAirtable && (
                  <span className="px-2 py-1 bg-red-900 text-red-200 text-xs rounded">
                    Deleted in Airtable
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {Object.entries(response.answers).map(([key, value]) => (
                  <div key={key} className="border-t border-gray-800 pt-2">
                    <p className="text-sm text-gray-400">{key}</p>
                    <p className="text-white">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
