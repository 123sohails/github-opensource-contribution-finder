const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize OpenAI client if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'GitHub OpenSource Contribution Finder API is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GitHub API search for issues
app.post('/api/search-issues', async (req, res) => {
  try {
    const { skills, limit = 5 } = req.body;
    
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: 'Skills array is required' });
    }

    // Validate limit
    const resultsLimit = Math.min(Math.max(parseInt(limit) || 5, 1), 50); // Between 1 and 50

    // Construct GitHub search query - more flexible search
    const searchQuery = skills.map(skill => `"${skill}"`).join(' ');
    const githubQuery = `${searchQuery} state:open is:issue`;
    
    const response = await axios.get('https://api.github.com/search/issues', {
      params: {
        q: githubQuery,
        per_page: 50,
        sort: 'updated',
        order: 'desc'
      },
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        ...(process.env.GITHUB_TOKEN && { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` })
      }
    });

    const issues = response.data.items.filter(issue => {
      // Filter out issues that are too old (older than 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return new Date(issue.updated_at) > sixMonthsAgo;
    });

    // Rank and explain issues
    const rankedIssues = await rankIssuesBySkills(issues, skills);

    res.json({
      issues: rankedIssues.slice(0, resultsLimit), // Return requested number of results
      total: rankedIssues.length,
      limit: resultsLimit
    });

  } catch (error) {
    console.error('Error searching GitHub issues:', error.message);
    res.status(500).json({ 
      error: 'Failed to search GitHub issues',
      details: error.response?.data || error.message
    });
  }
});

// AI-powered ranking and explanation
async function rankIssuesBySkills(issues, skills) {
  if (!openai) {
    // Fallback to simple algorithm if OpenAI is not configured
    return simpleRanking(issues, skills);
  }

  try {
    // Prepare data for AI analysis
    const issuesSummary = issues.map(issue => ({
      title: issue.title,
      body: issue.body ? issue.body.substring(0, 500) : '',
      labels: issue.labels.map(l => l.name),
      url: issue.html_url,
      updated_at: issue.updated_at
    }));

    const systemPrompt = `You are an expert at matching open-source issues to developers' skills. 
Given a list of GitHub issues and a developer's skills, rank the issues by how well they match the developer's abilities.
Consider:
1. Direct skill mentions in title, body, and labels
2. Technical complexity relative to the skills
3. Labels like "good first issue" or "help wanted"
4. Recent activity
5. Overall learning and contribution value

Return a JSON object with a "rankings" array containing the following structure for each issue:
{
  "rankings": [
    {
      "original_index": number,
      "match_score": number (0-10),
      "matched_skills": string[],
      "explanation": string (2-3 sentences explaining why this is a good match)
    }
  ]
}`;

    const userPrompt = `Developer skills: ${skills.join(', ')}
Issues to analyze:
${JSON.stringify(issuesSummary, null, 2)}

Rank these issues and provide match scores and explanations.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);
    const rankings = aiResponse.rankings || aiResponse.results || [];

    // Apply AI rankings to original issues
    const rankedIssues = issues.map((issue, index) => {
      const ranking = rankings.find(r => r.original_index === index) || {
        match_score: 5,
        matched_skills: skills.slice(0, 2),
        explanation: "This issue appears relevant to your skill set."
      };

      return {
        ...issue,
        matchScore: ranking.match_score,
        matchedSkills: ranking.matched_skills,
        explanation: ranking.explanation
      };
    });

    // Sort by AI match score (descending)
    return rankedIssues.sort((a, b) => b.matchScore - a.matchScore);

  } catch (error) {
    console.error('AI ranking failed, falling back to simple algorithm:', error.message);
    return simpleRanking(issues, skills);
  }
}

// Fallback simple ranking algorithm
function simpleRanking(issues, skills) {
  const rankedIssues = issues.map(issue => {
    const title = issue.title.toLowerCase();
    const body = issue.body ? issue.body.toLowerCase() : '';
    const labels = issue.labels.map(l => l.name.toLowerCase());
    
    let matchScore = 0;
    const matchedSkills = [];

    skills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      if (title.includes(skillLower) || body.includes(skillLower) || labels.includes(skillLower)) {
        matchScore += 1;
        matchedSkills.push(skill);
      }
    });

    // Bonus points for good first issue or help wanted labels
    if (labels.includes('good first issue')) matchScore += 2;
    if (labels.includes('help wanted')) matchScore += 1;

    // Bonus points for recent activity
    const daysSinceUpdate = (Date.now() - new Date(issue.updated_at)) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 7) matchScore += 1;
    if (daysSinceUpdate < 30) matchScore += 0.5;

    return {
      ...issue,
      matchScore,
      matchedSkills,
      explanation: generateSimpleExplanation(issue, matchedSkills, matchScore)
    };
  });

  // Sort by match score (descending)
  return rankedIssues.sort((a, b) => b.matchScore - a.matchScore);
}

function generateSimpleExplanation(issue, matchedSkills, score) {
  const repoName = issue.repository_url.split('/').slice(-2).join('/');
  const skillList = matchedSkills.join(', ');
  
  let explanation = `This issue in ${repoName} matches your skills in ${skillList}. `;
  
  if (score >= 3) {
    explanation += "It's a great match because it directly relates to multiple skills you have. ";
  } else if (score >= 2) {
    explanation += "It's a good match that aligns with your technical background. ";
  } else {
    explanation += "It's a decent opportunity to apply your skills. ";
  }

  const labels = issue.labels.map(l => l.name).join(', ');
  if (labels) {
    explanation += `The issue is labeled: ${labels}. `;
  }

  explanation += `It was last updated ${new Date(issue.updated_at).toLocaleDateString()}.`;

  return explanation;
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
