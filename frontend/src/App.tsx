import { useState } from 'react'
import './App.css'

interface Issue {
  id: number
  title: string
  html_url: string
  repository_url: string
  updated_at: string
  labels: Array<{ name: string }>
  matchScore: number
  matchedSkills: string[]
  explanation: string
}

function App() {
  const [skills, setSkills] = useState<string>('')
  const [resultsLimit, setResultsLimit] = useState<number>(5)
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleSearch = async () => {
    if (!skills.trim()) {
      setError('Please enter at least one skill')
      return
    }

    setLoading(true)
    setError('')
    setIssues([])

    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s)
      console.log('Searching for skills:', skillsArray, 'with limit:', resultsLimit)
      
      const response = await fetch('https://github-opensource-contribution-finder.onrender.com/api/search-issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skills: skillsArray, limit: resultsLimit }),
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch issues')
      }

      const data = await response.json()
      console.log('API Response:', data)
      setIssues(data.issues)
    } catch (err) {
      console.error('Search error:', err)
      setError('Failed to search for issues. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="container">
        <h1>GitHub OpenSource Contribution Finder</h1>
        <p className="subtitle">Find open-source issues that match your skills</p>
        
        <div className="search-section">
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="Enter your skills (e.g., React, Node.js, PostgreSQL)"
            className="skill-input"
          />
          <select 
            value={resultsLimit}
            onChange={(e) => setResultsLimit(Number(e.target.value))}
            className="limit-select"
          >
            <option value={5}>5 results</option>
            <option value={10}>10 results</option>
            <option value={15}>15 results</option>
            <option value={20}>20 results</option>
            <option value={25}>25 results</option>
            <option value={50}>50 results</option>
          </select>
          <button 
            onClick={handleSearch} 
            disabled={loading}
            className="search-button"
          >
            {loading ? 'Searching...' : 'Find Issues'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {issues.length > 0 && (
          <div className="results-section">
            <h2>Top Opportunities for You</h2>
            <div className="issues-list">
              {issues.map((issue, index) => (
                <div key={issue.id} className="issue-card">
                  <div className="issue-header">
                    <span className="issue-number">#{index + 1}</span>
                    <span className="match-score">Match Score: {issue.matchScore.toFixed(1)}</span>
                  </div>
                  <h3 className="issue-title">{issue.title}</h3>
                  <p className="issue-explanation">{issue.explanation}</p>
                  <div className="issue-footer">
                    <div className="labels">
                      {issue.labels.map((label, i) => (
                        <span key={i} className="label">{label.name}</span>
                      ))}
                    </div>
                    <a 
                      href={issue.html_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="issue-link"
                    >
                      View on GitHub →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {issues.length === 0 && !loading && !error && (
          <div className="empty-state">
            <p>Enter your skills above to find relevant open-source issues</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
