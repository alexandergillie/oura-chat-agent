/**
 * Tool definitions for the Oura Health Chat Agent
 * Tools can either require human confirmation or execute automatically
 */
import { tool } from "ai";
import { z } from "zod";

import type { Chat } from "./server";
import { getCurrentAgent } from "agents";
import { unstable_scheduleSchema } from "agents/schedule";
import {
  executeGetOuraSleepData,
  executeGetOuraActivityData,
  executeGetOuraStressData,
  executeGetOuraReadinessData,
  executeGetOuraHealthSummary,
  executeCheckOuraSetup,
} from "./oura";

/**
 * Get sleep data from Oura API
 */
const getOuraSleepData = tool({
  description: "Get sleep data from your Oura ring for a specified time period",
  parameters: z.object({
    period: z.string().describe("Time period: 'today', 'yesterday', 'week', 'month', or custom period"),
    start_date: z.string().optional().describe("Start date in YYYY-MM-DD format (optional if period is specified)"),
    end_date: z.string().optional().describe("End date in YYYY-MM-DD format (optional if period is specified)"),
  }),
  execute: executeGetOuraSleepData,
});

/**
 * Get activity data from Oura API
 */
const getOuraActivityData = tool({
  description: "Get daily activity data from your Oura ring including steps, calories, and activity score",
  parameters: z.object({
    period: z.string().describe("Time period: 'today', 'yesterday', 'week', 'month', or custom period"),
    start_date: z.string().optional().describe("Start date in YYYY-MM-DD format (optional if period is specified)"),
    end_date: z.string().optional().describe("End date in YYYY-MM-DD format (optional if period is specified)"),
  }),
  execute: executeGetOuraActivityData,
});

/**
 * Get stress data from Oura API
 */
const getOuraStressData = tool({
  description: "Get daily stress levels from your Oura ring showing stress and recovery periods",
  parameters: z.object({
    period: z.string().describe("Time period: 'today', 'yesterday', 'week', 'month', or custom period"),
    start_date: z.string().optional().describe("Start date in YYYY-MM-DD format (optional if period is specified)"),
    end_date: z.string().optional().describe("End date in YYYY-MM-DD format (optional if period is specified)"),
  }),
  execute: executeGetOuraStressData,
});

/**
 * Get readiness data from Oura API
 */
const getOuraReadinessData = tool({
  description: "Get daily readiness scores from your Oura ring showing how ready you are for the day",
  parameters: z.object({
    period: z.string().describe("Time period: 'today', 'yesterday', 'week', 'month', or custom period"),
    start_date: z.string().optional().describe("Start date in YYYY-MM-DD format (optional if period is specified)"),
    end_date: z.string().optional().describe("End date in YYYY-MM-DD format (optional if period is specified)"),
  }),
  execute: executeGetOuraReadinessData,
});

/**
 * Get comprehensive health summary from multiple Oura endpoints
 */
const getOuraHealthSummary = tool({
  description: "Get a comprehensive health summary including sleep, activity, stress, and readiness data",
  parameters: z.object({
    period: z.string().describe("Time period: 'today', 'yesterday', 'week', 'month', or custom period"),
    start_date: z.string().optional().describe("Start date in YYYY-MM-DD format (optional if period is specified)"),
    end_date: z.string().optional().describe("End date in YYYY-MM-DD format (optional if period is specified)"),
  }),
  execute: executeGetOuraHealthSummary,
});

// Keep the existing scheduling tools from the boilerplate
const scheduleTask = tool({
  description: "A tool to schedule a task to be executed at a later time",
  parameters: unstable_scheduleSchema,
  execute: async ({ when, description }) => {
    const { agent } = getCurrentAgent<Chat>();

    function throwError(msg: string): string {
      throw new Error(msg);
    }
    if (when.type === "no-schedule") {
      return "Not a valid schedule input";
    }
    const input =
      when.type === "scheduled"
        ? when.date // scheduled
        : when.type === "delayed"
          ? when.delayInSeconds // delayed
          : when.type === "cron"
            ? when.cron // cron
            : throwError("not a valid schedule input");
    try {
      agent!.schedule(input!, "executeTask", description);
    } catch (error) {
      console.error("error scheduling task", error);
      return `Error scheduling task: ${error}`;
    }
    return `Task scheduled for type "${when.type}" : ${input}`;
  },
});

const getScheduledTasks = tool({
  description: "List all tasks that have been scheduled",
  parameters: z.object({}),
  execute: async () => {
    const { agent } = getCurrentAgent<Chat>();

    try {
      const tasks = agent!.getSchedules();
      if (!tasks || tasks.length === 0) {
        return "No scheduled tasks found.";
      }
      return tasks;
    } catch (error) {
      console.error("Error listing scheduled tasks", error);
      return `Error listing scheduled tasks: ${error}`;
    }
  },
});

const cancelScheduledTask = tool({
  description: "Cancel a scheduled task using its ID",
  parameters: z.object({
    taskId: z.string().describe("The ID of the task to cancel"),
  }),
  execute: async ({ taskId }) => {
    const { agent } = getCurrentAgent<Chat>();
    try {
      await agent!.cancelSchedule(taskId);
      return `Task ${taskId} has been successfully canceled.`;
    } catch (error) {
      console.error("Error canceling scheduled task", error);
      return `Error canceling task ${taskId}: ${error}`;
    }
  },
});

/**
 * Check Oura API configuration and connectivity
 */
const checkOuraSetup = tool({
  description: "Check if the Oura API is properly configured and can connect to your account",
  parameters: z.object({}),
  execute: executeCheckOuraSetup,
});

/**
 * Export all available tools
 */
export const tools = {
  getOuraSleepData,
  getOuraActivityData,
  getOuraStressData,
  getOuraReadinessData,
  getOuraHealthSummary,
  checkOuraSetup,
  scheduleTask,
  getScheduledTasks,
  cancelScheduledTask,
};

/**
 * Implementation of confirmation-required tools
 * Currently all Oura tools execute automatically, but this can be modified
 * if you want to require human confirmation for certain operations
 */
export const executions = {
  // No confirmation-required tools currently
};
