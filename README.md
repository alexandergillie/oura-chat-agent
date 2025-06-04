# 🏃‍♂️ Oura Health Chat Agent

![agents-header](https://github.com/user-attachments/assets/f6d99eeb-1803-4495-9c5e-3cf07a37b402)

<a href="https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/agents-starter"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare"/></a>

An AI-powered chat agent that helps you understand your Oura Ring health data through natural conversation. Built with Cloudflare's Agent platform, Workers AI, and the Oura API v2, this agent can analyze your sleep, activity, stress, and readiness data to provide personalized health insights.

## Features

- 💬 Natural language queries about your health data
- 😴 **Sleep Analysis**: Get detailed sleep score breakdowns and trends
- 🏃 **Activity Tracking**: View steps, calories, and activity scores
- 😰 **Stress Monitoring**: Track stress levels and recovery periods  
- 💪 **Readiness Scores**: Understand how prepared you are for the day
- 📊 **Health Summaries**: Comprehensive overviews combining all metrics
- 📅 Advanced task scheduling for health goals and reminders
- 🌓 Dark/Light theme support
- ⚡️ Real-time streaming responses
- 🔄 State management and chat history

## Prerequisites

- Cloudflare account
- **Oura Ring** and Personal Access Token from [Oura Cloud](https://cloud.ouraring.com/personal-access-tokens)

## Quick Start

1. Create a new project:

```bash
npx create-cloudflare@latest --template cloudflare/agents-starter
```

2. Install dependencies:

```bash
npm install
```

3. Set up your environment:

Create a `.dev.vars` file with your API key:

```env
OURA_API_TOKEN=your_oura_personal_access_token
```

**To get your Oura API token:**
1. Go to [Oura Cloud Personal Access Tokens](https://cloud.ouraring.com/personal-access-tokens)
2. Create a new token with the scopes you need
3. Copy the token to your `.dev.vars` file

4. Run locally:

```bash
npm start
```

5. Deploy:

```bash
npm run deploy
```

## Example Conversations

Here are some natural language queries you can try:

### Sleep Queries
- "How have I been sleeping this week?"
- "What was my sleep score yesterday?"
- "Show me my sleep trends for the past month"
- "Did I get good deep sleep last night?"

### Activity Queries  
- "How many steps did I take this week?"
- "What's my activity been like lately?"
- "Show me my activity score for today"
- "How many calories did I burn yesterday?"

### Stress & Wellness
- "How stressed have I been this week?"
- "Show me my recovery periods"
- "What's my readiness score today?"
- "Give me a comprehensive health summary"

### Scheduling & Goals
- "Remind me to check my sleep score every morning"
- "Schedule a weekly health summary for Sundays"
- "Set up a reminder to review my stress levels"

## Project Structure

```
├── src/
│   ├── app.tsx        # Chat UI implementation
│   ├── server.ts      # Oura health agent logic
│   ├── tools.ts       # Oura API integration tools
│   ├── utils.ts       # Helper functions
│   └── styles.css     # UI styling
```

## Available Tools

The agent includes these specialized Oura Ring tools:

### Health Data Tools
- **`getOuraSleepData`** - Retrieve sleep scores, duration, and quality metrics
- **`getOuraActivityData`** - Get steps, calories, and activity scores
- **`getOuraStressData`** - View stress levels and recovery periods
- **`getOuraReadinessData`** - Check daily readiness scores
- **`getOuraHealthSummary`** - Comprehensive overview of all health metrics

### Scheduling Tools
- **`scheduleTask`** - Set up health-related reminders and recurring tasks
- **`getScheduledTasks`** - View all scheduled health reminders
- **`cancelScheduledTask`** - Remove scheduled tasks

All tools support flexible date ranges:
- Relative: "today", "yesterday", "week", "month"
- Specific: Custom start and end dates in YYYY-MM-DD format

## Customization Guide

### Adding New Health Metrics

Extend the agent with additional Oura API endpoints:

```typescript
// Add to tools.ts
const getOuraHeartRateData = tool({
  description: "Get heart rate data from your Oura ring",
  parameters: z.object({
    period: z.string().describe("Time period for heart rate data"),
  }),
  execute: async ({ period }) => {
    const dateRange = getDateRange(period);
    const data = await makeOuraRequest('/usercollection/heartrate', {
      start_datetime: `${dateRange.start_date}T00:00:00+00:00`,
      end_datetime: `${dateRange.end_date}T23:59:59+00:00`,
    });
    // Process and format heart rate data
    return formatHeartRateData(data);
  },
});
```

### Customizing Health Insights

Modify the response formatting in `tools.ts` to add:
- Personalized recommendations
- Trend analysis 
- Health goal tracking
- Comparative metrics

### Example Use Cases

1. **Personal Health Tracking**
   - Daily health check-ins
   - Weekly trend analysis
   - Goal setting and monitoring
   - Sleep optimization

2. **Wellness Coaching**
   - Automated health insights
   - Recovery recommendations
   - Activity suggestions
   - Stress management tips

3. **Health Research**
   - Data correlation analysis
   - Long-term trend tracking
   - Lifestyle impact assessment
   - Health pattern recognition

## Data Privacy & Security

- Your Oura data stays secure with proper API token management
- Data is processed in real-time and not stored by default
- All API calls use HTTPS encryption
- Follow Oura's data usage guidelines and terms of service

## Troubleshooting

### Common Issues

**"No data found"**: 
- Ensure your Oura ring is synced
- Check that you've been wearing your ring consistently
- Verify your API token has the necessary permissions

**"API token invalid"**:
- Regenerate your token at [Oura Cloud](https://cloud.ouraring.com/personal-access-tokens)
- Make sure the token is correctly set in your `.dev.vars` file
- Restart the application after updating the token

**"Rate limit exceeded"**:
- The Oura API allows 5000 requests per 5-minute period
- The agent is designed to be efficient, but try spacing out requests if needed

## Learn More

- [Oura API Documentation](https://cloud.ouraring.com/docs/)
- [Oura Developer Portal](https://cloud.ouraring.com/)
- [`agents`](https://github.com/cloudflare/agents/blob/main/packages/agents/README.md)
- [Cloudflare Agents Documentation](https://developers.cloudflare.com/agents/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)

## License

MIT
