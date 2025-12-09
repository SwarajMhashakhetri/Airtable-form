# Airtable Form Builder

A full-stack MERN application that allows users to create dynamic forms connected to Airtable with conditional logic and webhook synchronization.

## Features

- OAuth authentication with Airtable
- Create custom forms from Airtable bases and tables
- Support for multiple field types (text, select, multi-select, attachments)
- Conditional logic for form questions
- Real-time form submission to Airtable
- Webhook integration to sync changes from Airtable
- Dark mode UI with responsive design
- Dashboard to manage all forms

## Tech Stack

### Backend
- Node.js + Express
- TypeScript
- MongoDB with Mongoose
- Airtable API integration
- JWT authentication

### Frontend
- React 18
- TypeScript
- Vite
- React Router v6
- Zustand for state management
- Tailwind CSS

## Prerequisites

- Node.js 18+
- MongoDB instance
- Airtable account with OAuth app configured

## Setup Instructions

### 1. Airtable OAuth Setup

1. Go to https://airtable.com/create/oauth
2. Create a new OAuth integration
3. Configure redirect URI: `http://localhost:5173/auth/callback`
4. Required scopes:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
   - `webhook:manage`
5. Copy the Client ID and Client Secret

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` file with your configuration:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/airtable-form-builder
NODE_ENV=development

AIRTABLE_CLIENT_ID=your_client_id_here
AIRTABLE_CLIENT_SECRET=your_client_secret_here
AIRTABLE_REDIRECT_URI=http://localhost:5173/auth/callback

JWT_SECRET=your_random_secret_key_here

FRONTEND_URL=http://localhost:5173
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env` file:
```
VITE_API_URL=http://localhost:5000/api
VITE_APP_URL=http://localhost:5173
```

Start the frontend:
```bash
npm run dev
```

### 4. Access the Application

Open http://localhost:5173 in your browser

## Project Structure

```
airtable-form-builder/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Form.ts
│   │   │   └── Response.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── airtable.ts
│   │   │   ├── forms.ts
│   │   │   ├── responses.ts
│   │   │   └── webhooks.ts
│   │   ├── services/
│   │   │   └── airtableService.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── utils/
│   │   │   └── conditionalLogic.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Layout.tsx
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── AuthCallback.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── FormBuilder.tsx
    │   │   ├── FormViewer.tsx
    │   │   └── ResponseList.tsx
    │   ├── store/
    │   │   ├── authStore.ts
    │   │   └── formStore.ts
    │   ├── types/
    │   │   └── index.ts
    │   ├── utils/
    │   │   ├── api.ts
    │   │   └── conditionalLogic.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── package.json
    └── vite.config.ts
```

## Data Models

### User
```typescript
{
  airtableUserId: string;
  email: string;
  name?: string;
  accessToken: string;
  refreshToken?: string;
  lastLogin: Date;
}
```

### Form
```typescript
{
  owner: ObjectId;
  title: string;
  airtableBaseId: string;
  airtableTableId: string;
  questions: Question[];
}
```

### Question
```typescript
{
  questionKey: string;
  airtableFieldId: string;
  label: string;
  type: 'singleLineText' | 'multilineText' | 'singleSelect' | 'multipleSelects' | 'multipleAttachments';
  required: boolean;
  options?: string[];
  conditionalRules?: ConditionalRules | null;
}
```

### Response
```typescript
{
  formId: ObjectId;
  airtableRecordId: string;
  answers: Record<string, any>;
  deletedInAirtable?: boolean;
}
```

## Conditional Logic

The application supports conditional logic for showing/hiding questions based on user responses.

### Logic Structure
```typescript
{
  logic: 'AND' | 'OR',
  conditions: [
    {
      questionKey: string,
      operator: 'equals' | 'notEquals' | 'contains',
      value: any
    }
  ]
}
```

### Example
Show "GitHub URL" question only if role equals "Engineer":
```typescript
{
  logic: 'AND',
  conditions: [
    {
      questionKey: 'q_role',
      operator: 'equals',
      value: 'Engineer'
    }
  ]
}
```

## Webhook Configuration

To keep your database in sync with Airtable changes:

1. When creating a form, the application can register a webhook with Airtable
2. Configure webhook notification URL: `https://your-domain.com/api/webhooks/airtable`
3. Webhook will notify on record updates and deletions
4. The application marks deleted records without hard deletion

## API Endpoints

### Authentication
- `GET /api/auth/airtable/url` - Get OAuth URL
- `POST /api/auth/airtable/callback` - Handle OAuth callback
- `GET /api/auth/me` - Get current user

### Airtable
- `GET /api/airtable/bases` - List user's bases
- `GET /api/airtable/bases/:baseId/tables` - List tables in base
- `GET /api/airtable/bases/:baseId/tables/:tableId/fields` - List fields in table

### Forms
- `POST /api/forms` - Create new form
- `GET /api/forms` - List user's forms
- `GET /api/forms/:formId` - Get form details
- `PUT /api/forms/:formId` - Update form
- `DELETE /api/forms/:formId` - Delete form

### Responses
- `POST /api/responses/:formId` - Submit form response
- `GET /api/responses/:formId` - List form responses (auth required)

### Webhooks
- `POST /api/webhooks/airtable` - Handle Airtable webhook events

## Deployment

### Backend Deployment (Render/Railway)

1. Create a new web service
2. Connect your GitHub repository
3. Set environment variables
4. Deploy command: `npm run build && npm start`

### Frontend Deployment (Vercel/Netlify)

1. Create a new project
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variables

### Important Notes

- Update `AIRTABLE_REDIRECT_URI` to your production frontend URL
- Update `FRONTEND_URL` in backend to your production frontend URL
- Ensure MongoDB connection string is set correctly
- Use strong JWT secret in production

## Supported Field Types

- Single line text
- Long text (multiline)
- Single select (dropdown)
- Multiple selects (checkboxes)
- Attachments (file upload)

Other Airtable field types are automatically filtered out.

## Development

### Build Backend
```bash
cd backend
npm run build
```

### Build Frontend
```bash
cd frontend
npm run build
```

### Type Checking
Both frontend and backend use TypeScript with strict mode enabled.

## Troubleshooting

### OAuth Issues
- Verify redirect URI matches exactly in Airtable settings
- Check OAuth scopes are correctly configured
- Ensure client ID and secret are correct

### Database Connection
- Verify MongoDB is running
- Check connection string format
- Ensure database user has proper permissions

### API Errors
- Check backend logs for detailed error messages
- Verify all environment variables are set
- Test API endpoints using tools like Postman

