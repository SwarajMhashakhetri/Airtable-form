import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormStore } from '../store/formStore';

export default function Dashboard() {
  const { forms, loading, fetchForms, deleteForm } = useFormStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteForm(id);
    } catch {
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading forms...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">My Forms</h1>
        <Link to="/forms/new" className="btn-primary">
          Create New Form
        </Link>
      </div>

      {forms.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">No forms yet</p>
          <Link to="/forms/new" className="btn-primary inline-block">
            Create Your First Form
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div key={form._id} className="card">
              <h3 className="text-xl font-semibold text-white mb-2">
                {form.title}
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {form.questions.length} questions
              </p>
              <p className="text-gray-500 text-xs mb-4">
                Created {new Date(form.createdAt).toLocaleDateString()}
              </p>

              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/form/${form._id}`}
                  className="btn-secondary text-sm flex-1"
                  target="_blank"
                >
                  View
                </Link>
                <Link
                  to={`/forms/${form._id}/responses`}
                  className="btn-secondary text-sm flex-1"
                >
                  Responses
                </Link>
                <Link
                  to={`/forms/${form._id}/edit`}
                  className="btn-secondary text-sm flex-1"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(form._id)}
                  disabled={deletingId === form._id}
                  className="btn-danger text-sm flex-1 disabled:opacity-50"
                >
                  {deletingId === form._id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
