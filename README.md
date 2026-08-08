# GitHub OpenSource Contribution Finder

A developer tool that helps software engineers discover relevant open-source GitHub issues based on their existing technical skills.

## Features

- **Skill-Based Search**: Enter your skills (e.g., React, Node.js, PostgreSQL) to find matching issues
- **GitHub API Integration**: Searches GitHub for relevant open-source issues
- **Smart Filtering**: Filters out inactive issues (older than 6 months)
- **AI-Powered Ranking**: Uses OpenAI to rank issues by skill match and difficulty
- **Personalized Explanations**: AI explains why each issue is a good contribution opportunity
- **Direct GitHub Links**: One-click access to contribute to issues

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express
- **APIs**: GitHub API, OpenAI API
- **Styling**: CSS with modern design

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- GitHub Personal Access Token (optional but recommended)
- OpenAI API Key (optional - falls back to simple algorithm if not provided)

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

⚠️ **Important**: Never commit `.env` files to Git! They are already included in `.gitignore`.

Create a `.env` file in the `backend` directory:

```env
PORT=5000
GITHUB_TOKEN=your_github_token_here
OPENAI_API_KEY=your_openai_api_key_here
```

#### Getting API Keys:

**GitHub Token** (Recommended):
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with `public_repo` scope
3. Copy the token and add it to your `.env` file
4. Without a token, you're limited to 60 GitHub API requests per hour

**OpenAI API Key** (Optional):
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key and add it to your `.env` file
4. Without an OpenAI key, the app uses a fallback algorithm

### 3. Start the Application

```bash
# Start backend (in one terminal)
cd backend
npm start

# Start frontend (in another terminal)
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173 (or the port shown in terminal)
- Backend API: http://localhost:5000

## Usage

1. Open the frontend in your browser
2. Enter your skills separated by commas (e.g., "React, Node.js, PostgreSQL")
3. Click "Find Issues"
4. View the top 5 personalized open-source opportunities
5. Click "View on GitHub" to contribute

## API Endpoints

### POST /api/search-issues

Searches GitHub for issues matching the provided skills.

**Request Body:**
```json
{
  "skills": ["React", "Node.js", "PostgreSQL"]
}
```

**Response:**
```json
{
  "issues": [
    {
      "id": 123456,
      "title": "Fix React component rendering issue",
      "html_url": "https://github.com/owner/repo/issues/123",
      "repository_url": "https://api.github.com/repos/owner/repo",
      "updated_at": "2024-01-15T10:30:00Z",
      "labels": [{"name": "bug"}, {"name": "React"}],
      "matchScore": 8.5,
      "matchedSkills": ["React"],
      "explanation": "This issue matches your React skills perfectly..."
    }
  ],
  "total": 25
}
```

## Project Structure

```
opentool/
├── backend/
│   ├── server.js          # Express server with GitHub & OpenAI integration
│   ├── package.json       # Backend dependencies
│   └── .env              # Environment variables (create this)
├── frontend/
│   ├── src/
│   │   ├── App.tsx       # Main React component
│   │   ├── App.css       # Styling
│   │   └── main.tsx      # React entry point
│   ├── package.json      # Frontend dependencies
│   └── vite.config.ts    # Vite configuration
└── README.md            # This file
```

## How It Works

1. **User Input**: Developer enters their technical skills
2. **GitHub Search**: Backend searches GitHub API for issues with matching keywords
3. **Filtering**: Removes issues older than 6 months
4. **AI Ranking**: OpenAI analyzes and ranks issues by:
   - Skill relevance
   - Technical complexity
   - Special labels (good first issue, help wanted)
   - Recent activity
   - Learning value
5. **Results Display**: Frontend shows top issues with explanations

## Deployment

### Frontend Deployment (Vercel/Netlify)
1. Build the frontend: `cd frontend && npm run build`
2. Deploy the `dist/` folder to Vercel or Netlify
3. Update the API URL in production to point to your deployed backend

### Backend Deployment (Render/Railway)
1. Push code to GitHub
2. Connect your repository to Render or Railway
3. Add environment variables in the deployment platform:
   - `PORT`: 5000 (or your preferred port)
   - `GITHUB_TOKEN`: Your GitHub personal access token
   - `OPENAI_API_KEY`: Your OpenAI API key (optional)
4. Deploy!

### Environment Variables in Production
When deploying, make sure to add these environment variables in your hosting platform:
- `GITHUB_TOKEN`: Required for higher GitHub API rate limits
- `OPENAI_API_KEY`: Optional, for AI-powered ranking
- `PORT`: Usually set automatically by hosting platforms

## Troubleshooting

**GitHub API Rate Limit**: If you see rate limit errors, add a GitHub token to your `.env` file.

**OpenAI Errors**: If AI ranking fails, the app automatically falls back to a simple algorithm.

**CORS Issues**: Make sure the backend is running on port 5000 and frontend can access it.

## Future Enhancements

- Add user authentication to save favorite issues
- Include difficulty ratings
- Add repository quality metrics
- Support for multiple AI providers
- Browser extension
- Mobile app

## License

MIT License - feel free to use this for your portfolio and learning!
