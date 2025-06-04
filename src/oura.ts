/**
 * Oura API integration and data formatting utilities
 * Handles API requests, error handling, and response formatting for Oura Ring data
 */

import type {
  MultiDocumentResponse_DailySleepModel,
  MultiDocumentResponse_DailyActivityModel,
  MultiDocumentResponse_DailyStressModel,
  MultiDocumentResponse_DailyReadinessModel,
  DailySleepModel,
  DailyActivityModel,
  DailyStressModel,
  DailyReadinessModel,
  PersonalInfoResponse,
  OuraAPIError,
} from "./types";
import { safeNumber, getDateRange } from "./utils";

/**
 * Custom error class for Oura API errors that should be shown to users
 */
export class OuraAPIUserError extends Error {
  constructor(message: string, public userMessage: string) {
    super(message);
    this.name = 'OuraAPIUserError';
  }
}

/**
 * Utility function to make Oura API requests with proper typing
 */
export async function makeOuraRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const API_TOKEN = process.env.OURA_API_TOKEN;
  if (!API_TOKEN) {
    throw new OuraAPIUserError(
      'Oura API token not configured', 
      '🔑 **Setup Required**: Please configure your Oura API token.\n\n' +
      '**Steps to fix:**\n' +
      '1. Get your token from [Oura Cloud](https://cloud.ouraring.com/personal-access-tokens)\n' +
      '2. Add it to your `.dev.vars` file as `OURA_API_TOKEN=your_token_here`\n' +
      '3. Restart the application\n\n' +
      '*This is a one-time setup step required to access your Oura Ring data.*'
    );
  }

  const baseUrl = 'https://api.ouraring.com/v2';
  const url = new URL(`${baseUrl}${endpoint}`);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new OuraAPIUserError(
        'Invalid Oura API token', 
        '🚫 **Authentication Failed**: Your Oura API token is invalid or expired.\n\n' +
        '**Steps to fix:**\n' +
        '1. Check your token at [Oura Cloud](https://cloud.ouraring.com/personal-access-tokens)\n' +
        '2. Generate a new token if needed\n' +
        '3. Update your `.dev.vars` file with the new token\n' +
        '4. Restart the application'
      );
    } else if (response.status === 403) {
      throw new OuraAPIUserError(
        'Access forbidden', 
        '⛔ **Access Denied**: Cannot access your Oura data.\n\n' +
        '**Possible causes:**\n' +
        '• Your Oura subscription may have expired\n' +
        '• Your API token doesn\'t have the required permissions\n' +
        '• Your account may be restricted\n\n' +
        '*Please check your Oura account status and token permissions.*'
      );
    } else if (response.status === 429) {
      throw new OuraAPIUserError(
        'Rate limit exceeded', 
        '⏳ **Rate Limit Reached**: Too many requests to the Oura API.\n\n' +
        'Please wait a few minutes before trying again. The Oura API allows 5000 requests per 5-minute period.'
      );
    }
    
    // For other errors, try to get more info from the response
    let errorMessage = `Oura API error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.text();
      if (errorBody) {
        errorMessage += `\nDetails: ${errorBody}`;
      }
    } catch {
      // Ignore parsing errors
    }
    
    throw new OuraAPIUserError(
      errorMessage,
      `❌ **API Error**: Unable to fetch your Oura data (${response.status}).\n\n` +
      'This might be a temporary issue. Please try again in a few moments.'
    );
  }

  return await response.json() as T;
}

/**
 * Helper function to format sleep data for user display
 */
function formatSleepData(sleepData: DailySleepModel[]): string {
  if (sleepData.length === 0) {
    return '😴 **No sleep data found** for the specified period.\n\nThis might happen if:\n• You haven\'t synced your Oura ring recently\n• You haven\'t worn your ring during sleep\n• The data is still being processed';
  }

  let response = '😴 **Sleep Summary**\n\n';
  
  for (const sleep of sleepData) {
    const score = sleep.score ? `${sleep.score}/100` : 'N/A';
    const contributors = sleep.contributors;
    
    response += `📅 **${sleep.day}**\n`;
    response += `• **Score**: ${score}\n`;
    
    if (contributors) {
      const contributorItems = [];
      if (contributors.total_sleep) contributorItems.push(`Total Sleep: ${contributors.total_sleep}`);
      if (contributors.efficiency) contributorItems.push(`Efficiency: ${contributors.efficiency}`);
      if (contributors.restfulness) contributorItems.push(`Restfulness: ${contributors.restfulness}`);
      if (contributors.rem_sleep) contributorItems.push(`REM Sleep: ${contributors.rem_sleep}`);
      if (contributors.deep_sleep) contributorItems.push(`Deep Sleep: ${contributors.deep_sleep}`);
      if (contributors.latency) contributorItems.push(`Sleep Latency: ${contributors.latency}`);
      if (contributors.timing) contributorItems.push(`Timing: ${contributors.timing}`);
      
      if (contributorItems.length > 0) {
        response += `• **Contributors**: ${contributorItems.join(', ')}\n`;
      }
    }
    
    response += '\n';
  }
  
  return response.trim();
}

/**
 * Helper function to format activity data for user display
 */
function formatActivityData(activityData: DailyActivityModel[]): string {
  if (activityData.length === 0) {
    return '🏃 **No activity data found** for the specified period.\n\nThis might happen if:\n• You haven\'t synced your Oura ring recently\n• You haven\'t worn your ring during the day\n• The data is still being processed';
  }

  let response = '🏃 **Activity Summary**\n\n';
  
  for (const activity of activityData) {
    const score = activity.score ? `${activity.score}/100` : 'N/A';
    const steps = activity.steps.toLocaleString();
    const calories = activity.total_calories;
    const activeCalories = activity.active_calories;
    
    response += `📅 **${activity.day}**\n`;
    response += `• **Score**: ${score}\n`;
    response += `• **Steps**: ${steps}\n`;
    response += `• **Total Calories**: ${calories} kcal\n`;
    response += `• **Active Calories**: ${activeCalories} kcal\n`;
    
    const contributors = activity.contributors;
    if (contributors) {
      const contributorItems = [];
      if (contributors.meet_daily_targets) contributorItems.push(`Daily Targets: ${contributors.meet_daily_targets}`);
      if (contributors.stay_active) contributorItems.push(`Stay Active: ${contributors.stay_active}`);
      if (contributors.move_every_hour) contributorItems.push(`Move Every Hour: ${contributors.move_every_hour}`);
      if (contributors.training_frequency) contributorItems.push(`Training Frequency: ${contributors.training_frequency}`);
      if (contributors.training_volume) contributorItems.push(`Training Volume: ${contributors.training_volume}`);
      if (contributors.recovery_time) contributorItems.push(`Recovery Time: ${contributors.recovery_time}`);
      
      if (contributorItems.length > 0) {
        response += `• **Contributors**: ${contributorItems.join(', ')}\n`;
      }
    }
    
    response += '\n';
  }
  
  return response.trim();
}

/**
 * Helper function to format stress data for user display
 */
function formatStressData(stressData: DailyStressModel[]): string {
  if (stressData.length === 0) {
    return '😰 **No stress data found** for the specified period.\n\nThis might happen if:\n• You haven\'t synced your Oura ring recently\n• Stress tracking is not available on your ring model\n• The data is still being processed';
  }

  let response = '😰 **Stress Summary**\n\n';
  
  for (const stress of stressData) {
    const stressHigh = stress.stress_high ? `${Math.round(stress.stress_high / 60)} minutes` : 'N/A';
    const recoveryHigh = stress.recovery_high ? `${Math.round(stress.recovery_high / 60)} minutes` : 'N/A';
    const summary = stress.day_summary || 'N/A';
    
    response += `📅 **${stress.day}**\n`;
    response += `• **Day Summary**: ${summary}\n`;
    response += `• **High Stress Time**: ${stressHigh}\n`;
    response += `• **High Recovery Time**: ${recoveryHigh}\n\n`;
  }
  
  return response.trim();
}

/**
 * Helper function to format readiness data for user display
 */
function formatReadinessData(readinessData: DailyReadinessModel[]): string {
  if (readinessData.length === 0) {
    return '⚡ **No readiness data found** for the specified period.\n\nThis might happen if:\n• You haven\'t synced your Oura ring recently\n• You need sleep data to generate readiness scores\n• The data is still being processed';
  }

  let response = '⚡ **Readiness Summary**\n\n';
  
  for (const readiness of readinessData) {
    const score = readiness.score ? `${readiness.score}/100` : 'N/A';
    const tempDev = readiness.temperature_deviation ? `${readiness.temperature_deviation.toFixed(1)}°C` : 'N/A';
    
    response += `📅 **${readiness.day}**\n`;
    response += `• **Score**: ${score}\n`;
    response += `• **Temperature Deviation**: ${tempDev}\n`;
    
    const contributors = readiness.contributors;
    if (contributors) {
      const contributorItems = [];
      if (contributors.previous_night) contributorItems.push(`Previous Night: ${contributors.previous_night}`);
      if (contributors.sleep_balance) contributorItems.push(`Sleep Balance: ${contributors.sleep_balance}`);
      if (contributors.previous_day_activity) contributorItems.push(`Previous Day Activity: ${contributors.previous_day_activity}`);
      if (contributors.activity_balance) contributorItems.push(`Activity Balance: ${contributors.activity_balance}`);
      if (contributors.resting_heart_rate) contributorItems.push(`Resting HR: ${contributors.resting_heart_rate}`);
      if (contributors.hrv_balance) contributorItems.push(`HRV Balance: ${contributors.hrv_balance}`);
      if (contributors.recovery_index) contributorItems.push(`Recovery Index: ${contributors.recovery_index}`);
      if (contributors.body_temperature) contributorItems.push(`Body Temperature: ${contributors.body_temperature}`);
      
      if (contributorItems.length > 0) {
        response += `• **Contributors**: ${contributorItems.join(', ')}\n`;
      }
    }
    
    response += '\n';
  }
  
  return response.trim();
}

/**
 * Execute function for getting Oura sleep data
 */
export async function executeGetOuraSleepData({ 
  period, 
  start_date, 
  end_date 
}: { 
  period: string; 
  start_date?: string; 
  end_date?: string; 
}): Promise<string> {
  try {
    // Determine date range
    let dateRange: { start_date: string; end_date: string };
    if (start_date && end_date) {
      dateRange = { start_date, end_date };
    } else {
      dateRange = getDateRange(period);
    }

    const params = {
      start_date: dateRange.start_date,
      end_date: dateRange.end_date,
    };

    const response = await makeOuraRequest<MultiDocumentResponse_DailySleepModel>(
      '/usercollection/daily_sleep', 
      params
    );

    return formatSleepData(response.data);
  } catch (error) {
    if (error instanceof OuraAPIUserError) {
      return error.userMessage;
    }
    console.error('Error fetching sleep data:', error);
    return '❌ **Error**: Unable to fetch sleep data. Please try again later.';
  }
}

/**
 * Execute function for getting Oura activity data
 */
export async function executeGetOuraActivityData({ 
  period, 
  start_date, 
  end_date 
}: { 
  period: string; 
  start_date?: string; 
  end_date?: string; 
}): Promise<string> {
  try {
    // Determine date range
    let dateRange: { start_date: string; end_date: string };
    if (start_date && end_date) {
      dateRange = { start_date, end_date };
    } else {
      dateRange = getDateRange(period);
    }

    const params = {
      start_date: dateRange.start_date,
      end_date: dateRange.end_date,
    };

    const response = await makeOuraRequest<MultiDocumentResponse_DailyActivityModel>(
      '/usercollection/daily_activity', 
      params
    );

    return formatActivityData(response.data);
  } catch (error) {
    if (error instanceof OuraAPIUserError) {
      return error.userMessage;
    }
    console.error('Error fetching activity data:', error);
    return '❌ **Error**: Unable to fetch activity data. Please try again later.';
  }
}

/**
 * Execute function for getting Oura stress data
 */
export async function executeGetOuraStressData({ 
  period, 
  start_date, 
  end_date 
}: { 
  period: string; 
  start_date?: string; 
  end_date?: string; 
}): Promise<string> {
  try {
    // Determine date range
    let dateRange: { start_date: string; end_date: string };
    if (start_date && end_date) {
      dateRange = { start_date, end_date };
    } else {
      dateRange = getDateRange(period);
    }

    const params = {
      start_date: dateRange.start_date,
      end_date: dateRange.end_date,
    };

    const response = await makeOuraRequest<MultiDocumentResponse_DailyStressModel>(
      '/usercollection/daily_stress', 
      params
    );

    return formatStressData(response.data);
  } catch (error) {
    if (error instanceof OuraAPIUserError) {
      return error.userMessage;
    }
    console.error('Error fetching stress data:', error);
    return '❌ **Error**: Unable to fetch stress data. Please try again later.';
  }
}

/**
 * Execute function for getting Oura readiness data
 */
export async function executeGetOuraReadinessData({ 
  period, 
  start_date, 
  end_date 
}: { 
  period: string; 
  start_date?: string; 
  end_date?: string; 
}): Promise<string> {
  try {
    // Determine date range
    let dateRange: { start_date: string; end_date: string };
    if (start_date && end_date) {
      dateRange = { start_date, end_date };
    } else {
      dateRange = getDateRange(period);
    }

    const params = {
      start_date: dateRange.start_date,
      end_date: dateRange.end_date,
    };

    const response = await makeOuraRequest<MultiDocumentResponse_DailyReadinessModel>(
      '/usercollection/daily_readiness', 
      params
    );

    return formatReadinessData(response.data);
  } catch (error) {
    if (error instanceof OuraAPIUserError) {
      return error.userMessage;
    }
    console.error('Error fetching readiness data:', error);
    return '❌ **Error**: Unable to fetch readiness data. Please try again later.';
  }
}

/**
 * Execute function for getting comprehensive health summary
 */
export async function executeGetOuraHealthSummary({ 
  period, 
  start_date, 
  end_date 
}: { 
  period: string; 
  start_date?: string; 
  end_date?: string; 
}): Promise<string> {
  try {
    // Determine date range
    let dateRange: { start_date: string; end_date: string };
    if (start_date && end_date) {
      dateRange = { start_date, end_date };
    } else {
      dateRange = getDateRange(period);
    }

    const params = {
      start_date: dateRange.start_date,
      end_date: dateRange.end_date,
    };

    // Fetch all data types in parallel
    const [sleepResponse, activityResponse, stressResponse, readinessResponse] = await Promise.allSettled([
      makeOuraRequest<MultiDocumentResponse_DailySleepModel>('/usercollection/daily_sleep', params),
      makeOuraRequest<MultiDocumentResponse_DailyActivityModel>('/usercollection/daily_activity', params),
      makeOuraRequest<MultiDocumentResponse_DailyStressModel>('/usercollection/daily_stress', params),
      makeOuraRequest<MultiDocumentResponse_DailyReadinessModel>('/usercollection/daily_readiness', params),
    ]);

    let response = '📊 **Comprehensive Health Summary**\n\n';
    response += `📅 **Period**: ${dateRange.start_date} to ${dateRange.end_date}\n\n`;

    // Process sleep data
    if (sleepResponse.status === 'fulfilled' && sleepResponse.value.data.length > 0) {
      const validSleepData = sleepResponse.value.data.filter(d => d.score !== null && d.score !== undefined);
      if (validSleepData.length > 0) {
        const avgSleepScore = validSleepData.reduce((sum, d) => sum + (d.score || 0), 0) / validSleepData.length;
        response += `😴 **Sleep**: Average score ${Math.round(avgSleepScore)}/100 (${sleepResponse.value.data.length} days)\n`;
      } else {
        response += '😴 **Sleep**: Data available but no scores calculated\n';
      }
    } else {
      response += '😴 **Sleep**: No data available\n';
    }

    // Process activity data
    if (activityResponse.status === 'fulfilled' && activityResponse.value.data.length > 0) {
      const validActivityData = activityResponse.value.data.filter(d => d.score !== null && d.score !== undefined);
      if (validActivityData.length > 0) {
        const avgActivityScore = validActivityData.reduce((sum, d) => sum + (d.score || 0), 0) / validActivityData.length;
        const totalSteps = activityResponse.value.data.reduce((sum, d) => sum + d.steps, 0);
        const avgSteps = Math.round(totalSteps / activityResponse.value.data.length);
        response += `🏃 **Activity**: Average score ${Math.round(avgActivityScore)}/100, ${avgSteps.toLocaleString()} avg steps/day\n`;
      } else {
        const totalSteps = activityResponse.value.data.reduce((sum, d) => sum + d.steps, 0);
        const avgSteps = Math.round(totalSteps / activityResponse.value.data.length);
        response += `🏃 **Activity**: ${avgSteps.toLocaleString()} avg steps/day (no scores available)\n`;
      }
    } else {
      response += '🏃 **Activity**: No data available\n';
    }

    // Process stress data
    if (stressResponse.status === 'fulfilled' && stressResponse.value.data.length > 0) {
      const stressData = stressResponse.value.data;
      const validStressData = stressData.filter(d => d.stress_high !== null && d.stress_high !== undefined);
      if (validStressData.length > 0) {
        const avgStressTime = validStressData.reduce((sum, d) => sum + (d.stress_high || 0), 0) / validStressData.length;
        const summaries = stressData.map(d => d.day_summary).filter(s => s !== null);
        const mostCommonSummary = summaries.length > 0 ? summaries.sort((a, b) => 
          summaries.filter(v => v === a).length - summaries.filter(v => v === b).length
        ).pop() : null;
        response += `😰 **Stress**: ${Math.round(avgStressTime / 60)} avg minutes/day, mostly ${mostCommonSummary || 'N/A'}\n`;
      } else {
        response += '😰 **Stress**: Data available but no stress times calculated\n';
      }
    } else {
      response += '😰 **Stress**: No data available\n';
    }

    // Process readiness data
    if (readinessResponse.status === 'fulfilled' && readinessResponse.value.data.length > 0) {
      const validReadinessData = readinessResponse.value.data.filter(d => d.score !== null && d.score !== undefined);
      if (validReadinessData.length > 0) {
        const avgReadinessScore = validReadinessData.reduce((sum, d) => sum + (d.score || 0), 0) / validReadinessData.length;
        response += `⚡ **Readiness**: Average score ${Math.round(avgReadinessScore)}/100 (${readinessResponse.value.data.length} days)\n`;
      } else {
        response += '⚡ **Readiness**: Data available but no scores calculated\n';
      }
    } else {
      response += '⚡ **Readiness**: No data available\n';
    }

    // Add insights based on the data
    response += '\n💡 **Key Insights**:\n';
    
    // Check if any requests failed
    const failedRequests = [sleepResponse, activityResponse, stressResponse, readinessResponse]
      .filter(r => r.status === 'rejected');
    
    if (failedRequests.length > 0) {
      response += '• Some data types may not be available for your account or ring model\n';
    }
    
    // Check for data availability
    const totalDataPoints = [
      sleepResponse.status === 'fulfilled' ? sleepResponse.value.data.length : 0,
      activityResponse.status === 'fulfilled' ? activityResponse.value.data.length : 0,
      readinessResponse.status === 'fulfilled' ? readinessResponse.value.data.length : 0,
    ].reduce((sum, count) => sum + count, 0);
    
    if (totalDataPoints === 0) {
      response += '• No data found - make sure to sync your Oura ring with the mobile app\n';
    } else if (totalDataPoints < 3) {
      response += '• Limited data available - consider syncing your ring more regularly\n';
    } else {
      response += '• Good data coverage - keep up the consistent tracking!\n';
    }

    return response;
  } catch (error) {
    if (error instanceof OuraAPIUserError) {
      return error.userMessage;
    }
    console.error('Error fetching health summary:', error);
    return '❌ **Error**: Unable to fetch health summary. Please try again later.';
  }
}

/**
 * Execute function for checking Oura API setup
 */
export async function executeCheckOuraSetup(): Promise<string> {
  try {
    // First check if we have an API token
    const API_TOKEN = process.env.OURA_API_TOKEN;
    if (!API_TOKEN) {
      return '🔑 **Setup Required**: No Oura API token found.\n\n' +
             '**Next steps:**\n' +
             '1. Get your personal access token from [Oura Cloud](https://cloud.ouraring.com/personal-access-tokens)\n' +
             '2. Add it to your `.dev.vars` file as `OURA_API_TOKEN=your_token_here`\n' +
             '3. Restart the application\n\n' +
             '*This is required to access your Oura Ring data.*';
    }

    // Test the API connection by fetching personal info
    const personalInfo = await makeOuraRequest<PersonalInfoResponse>('/usercollection/personal_info');
    
    let response = '✅ **Oura API Setup Complete!**\n\n';
    response += `👤 **Account ID**: ${personalInfo.id}\n`;
    
    if (personalInfo.email) {
      response += `✉️ **Email**: ${personalInfo.email}\n`;
    }
    
    if (personalInfo.age) {
      response += `🎂 **Age**: ${personalInfo.age}\n`;
    }
    
    if (personalInfo.biological_sex) {
      response += `⚕️ **Biological Sex**: ${personalInfo.biological_sex}\n`;
    }
    
    response += '\n📊 **What you can do now:**\n';
    response += '• Ask me about your sleep data: "Show me my sleep from this week"\n';
    response += '• Check your activity: "How active was I yesterday?"\n';
    response += '• View stress levels: "What\'s my stress like this month?"\n';
    response += '• Get readiness scores: "Am I ready for today?"\n';
    response += '• See a full summary: "Give me my health summary for the past week"\n';
    
    return response;
  } catch (error) {
    if (error instanceof OuraAPIUserError) {
      return error.userMessage;
    }
    console.error('Error checking Oura setup:', error);
    return '❌ **Setup Check Failed**: Unable to verify your Oura API connection.\n\n' +
           'This might be a temporary issue. Please try again in a few moments.\n\n' +
           'If the problem persists, check your API token and internet connection.';
  }
}
