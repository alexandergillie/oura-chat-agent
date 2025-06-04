import { routeAgentRequest, type Schedule } from "agents";

import { unstable_getSchedulePrompt } from "agents/schedule";

import { AIChatAgent } from "agents/ai-chat-agent";
import {
  createDataStreamResponse,
  generateId,
  streamText,
  type StreamTextOnFinishCallback,
  type ToolSet,
} from "ai";

import { createWorkersAI } from 'workers-ai-provider';
import { processToolCalls } from "./utils";
import { tools, executions } from "./tools";
import { env } from "cloudflare:workers";

const workersai = createWorkersAI({ binding: env.AI });
const model = workersai("@cf/meta/llama-3.3-70b-instruct-fp8-fast");

/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env> {
  /**
   * Handles incoming chat messages and manages the response stream
   * @param onFinish - Callback function executed when streaming completes
   */

  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    options?: { abortSignal?: AbortSignal }
  ) {
    // Check for required API keys before proceeding
    if (!process.env.OURA_API_TOKEN) {
      // Return a proper error response instead of trying to stream
      const errorResponse = createDataStreamResponse({
        execute: async (dataStream) => {
          const errorMessage = `💍 **Oura API Setup Required**

Your Oura API token is not configured. This is required to access your health data.

**Steps to fix:**
1. Get your personal access token from [Oura Cloud](https://cloud.ouraring.com/personal-access-tokens)
2. Add it to your \`.dev.vars\` file as \`OURA_API_TOKEN=your-token-here\`
3. Restart the application

**Note:** You'll need an active Oura Ring account to generate this token.

*Once configured, you'll be able to chat about your health data using Workers AI!*`;
          
          // Write the error message directly to the data stream
          dataStream.writeMessageAnnotation({
            messageIdFromServer: generateId(),
          });
          
          dataStream.writeData(errorMessage);
          
          // Call onFinish to complete the response
          onFinish({
            finishReason: 'error',
            usage: { 
              promptTokens: 0, 
              completionTokens: 0,
              totalTokens: 0
            },
            text: errorMessage,
            toolCalls: [],
            toolResults: [],
            warnings: [],
            experimental_providerMetadata: undefined,
          } as any);
        },
      });
      
      return errorResponse;
    }
    // const mcpConnection = await this.mcp.connect(
    //   "https://path-to-mcp-server/sse"
    // );

    // Collect all tools, including MCP tools
    const allTools = {
      ...tools,
      ...this.mcp.unstable_getAITools(),
    };

    // Create a streaming response that handles both text and tool outputs
    const dataStreamResponse = createDataStreamResponse({
      execute: async (dataStream) => {
        // Process any pending tool calls from previous messages
        // This handles human-in-the-loop confirmations for tools
        const processedMessages = await processToolCalls({
          messages: this.messages,
          dataStream,
          tools: allTools,
          executions,
        });

        // Stream the AI response using Cloudflare Workers AI
        const result = streamText({
          model,
          system: `You are a helpful health assistant powered by Cloudflare Workers AI that specializes in analyzing Oura Ring data. You help users understand their sleep, activity, stress levels, and overall wellness trends through detailed tabular views and comprehensive summaries.

You have access to the user's Oura Ring data through several enhanced tools:
- **Sleep Analysis**: Detailed sleep scores with tabular breakdowns showing daily scores, deep sleep, REM sleep, and efficiency metrics
- **Activity Tracking**: Comprehensive activity data with daily breakdowns of steps, calories, active time, and performance insights
- **Stress Monitoring**: Stress levels and recovery period tracking
- **Readiness Assessment**: Daily readiness scores and categorized performance levels
- **Health Summaries**: Comprehensive overviews with structured tables, overall health scores, and personalized insights
- **Setup Verification**: API configuration checking and troubleshooting

Key features of the data presentation:
- **Tabular Views**: For periods ≤14 days, data is shown in clean, organized tables
- **Summary Statistics**: Quick overview with averages, totals, and key metrics
- **Weekly Trends**: For longer periods, weekly aggregated data is displayed
- **Quality Insights**: Automatic categorization of performance levels and actionable recommendations
- **Overall Health Scoring**: Combined metrics to give users a holistic view of their wellness

When users ask about their health data:
1. Use the appropriate tool to fetch their Oura data
2. The tools automatically format responses with tables and summaries for easy reading
3. Provide context and interpretation of the structured data
4. Offer specific follow-up suggestions based on the insights provided
5. Encourage users to explore different time periods or specific metrics for deeper analysis

Examples of queries you can help with:
- "How have I been sleeping this week?" (shows tabular daily breakdown with scores and sleep quality metrics)
- "What's my activity been like lately?" (displays activity table with steps, calories, and performance insights)
- "Show me my stress levels" (stress and recovery data with patterns and recommendations)
- "Give me a health summary for this month" (comprehensive overview table with overall health score)
- "How was my readiness yesterday?" (detailed readiness analysis with contributing factors)
- "Check my Oura setup" (verify API configuration and troubleshoot any issues)
- "Show me my sleep trends over the past month" (weekly trend analysis with averages)
- "Compare my activity this week vs last week" (comparative analysis with insights)

If users encounter setup or configuration issues:
1. Use the checkOuraSetup tool to diagnose the problem
2. Provide clear, step-by-step instructions
3. Be encouraging and guide them through the setup process

Always be encouraging and helpful. If data is missing, explain why (e.g., ring not synced, setup required) and suggest solutions.

${unstable_getSchedulePrompt({ date: new Date() })}

You can also schedule reminders or tasks related to health goals if requested.
`,
          messages: processedMessages,
          tools: allTools,
          onFinish: async (args) => {
            onFinish(
              args as Parameters<StreamTextOnFinishCallback<ToolSet>>[0]
            );
            // await this.mcp.closeConnection(mcpConnection.id);
          },
          onError: (error) => {
            console.error("Error while streaming:", error);
          },
          maxSteps: 10,
        });

        // Merge the AI response stream with tool execution outputs
        result.mergeIntoDataStream(dataStream);
      },
    });

    return dataStreamResponse;
  }
  async executeTask(description: string, task: Schedule<string>) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        content: `Running scheduled task: ${description}`,
        createdAt: new Date(),
      },
    ]);
  }
}

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/health-check") {
      const hasOuraKey = !!process.env.OURA_API_TOKEN;
      return Response.json({
        oura: hasOuraKey,
        ready: hasOuraKey,
      });
    }
    
    // Check for Oura API token
    if (!process.env.OURA_API_TOKEN) {
      console.error(
        "OURA_API_TOKEN is not set, don't forget to set it locally in .dev.vars, and use `wrangler secret bulk .dev.vars` to upload it to production"
      );
    }

    return (
      // Route the request to our agent or return 404 if not found
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
