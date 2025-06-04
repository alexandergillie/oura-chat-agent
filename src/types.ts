/**
 * TypeScript types for Oura API v2 responses
 * Generated from the official OpenAPI schema
 */

// Base types
export interface LocalDateTime {
  toString(): string;
}

export interface LocalDateTimeWithMilliseconds {
  toString(): string;
}

// Personal Info
export interface PersonalInfoResponse {
  id: string;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  biological_sex?: string | null;
  email?: string | null;
}

// Sleep Contributors
export interface SleepContributors {
  deep_sleep?: number | null;
  efficiency?: number | null;
  latency?: number | null;
  rem_sleep?: number | null;
  restfulness?: number | null;
  timing?: number | null;
  total_sleep?: number | null;
}

// Daily Sleep Model
export interface DailySleepModel {
  id: string;
  contributors: SleepContributors;
  day: string; // YYYY-MM-DD format
  score?: number | null;
  timestamp: LocalDateTime;
}

export interface MultiDocumentResponse_DailySleepModel {
  data: DailySleepModel[];
  next_token?: string | null;
}

// Activity Contributors
export interface ActivityContributors {
  meet_daily_targets?: number | null;
  move_every_hour?: number | null;
  recovery_time?: number | null;
  stay_active?: number | null;
  training_frequency?: number | null;
  training_volume?: number | null;
}

// Sample Model (for MET data)
export interface SampleModel {
  interval: number;
  items: (number | null)[];
  timestamp: LocalDateTimeWithMilliseconds;
}

// Daily Activity Model
export interface DailyActivityModel {
  id: string;
  class_5_min?: string | null;
  score?: number | null;
  active_calories: number;
  average_met_minutes: number;
  contributors: ActivityContributors;
  equivalent_walking_distance: number;
  high_activity_met_minutes: number;
  high_activity_time: number;
  inactivity_alerts: number;
  low_activity_met_minutes: number;
  low_activity_time: number;
  medium_activity_met_minutes: number;
  medium_activity_time: number;
  met: SampleModel;
  meters_to_target: number;
  non_wear_time: number;
  resting_time: number;
  sedentary_met_minutes: number;
  sedentary_time: number;
  steps: number;
  target_calories: number;
  target_meters: number;
  total_calories: number;
  day: string;
  timestamp: LocalDateTime;
}

export interface MultiDocumentResponse_DailyActivityModel {
  data: DailyActivityModel[];
  next_token?: string | null;
}

// Daily Stress Types
export type DailyStressSummary = 'restored' | 'normal' | 'stressful';

export interface DailyStressModel {
  id: string;
  day: string;
  stress_high?: number | null;
  recovery_high?: number | null;
  day_summary?: DailyStressSummary | null;
}

export interface MultiDocumentResponse_DailyStressModel {
  data: DailyStressModel[];
  next_token?: string | null;
}

// Readiness Contributors
export interface ReadinessContributors {
  activity_balance?: number | null;
  body_temperature?: number | null;
  hrv_balance?: number | null;
  previous_day_activity?: number | null;
  previous_night?: number | null;
  recovery_index?: number | null;
  resting_heart_rate?: number | null;
  sleep_balance?: number | null;
}

// Daily Readiness Model
export interface DailyReadinessModel {
  id: string;
  contributors: ReadinessContributors;
  day: string;
  score?: number | null;
  temperature_deviation?: number | null;
  temperature_trend_deviation?: number | null;
  timestamp: LocalDateTime;
}

export interface MultiDocumentResponse_DailyReadinessModel {
  data: DailyReadinessModel[];
  next_token?: string | null;
}

// Heart Rate Types
export type HeartRateSource = 'awake' | 'rest' | 'sleep' | 'session' | 'live' | 'workout';

export interface HeartRateModel {
  bpm: number;
  source: HeartRateSource;
  timestamp: LocalDateTime;
}

export interface TimeSeriesResponse_HeartRateModel {
  data: HeartRateModel[];
  next_token?: string | null;
}

// SpO2 Types
export interface DailySpO2AggregatedValuesModel {
  average: number;
}

export interface DailySpO2Model {
  id: string;
  day: string;
  spo2_percentage?: DailySpO2AggregatedValuesModel | null;
  breathing_disturbance_index?: number | null;
}

export interface MultiDocumentResponse_DailySpO2Model {
  data: DailySpO2Model[];
  next_token?: string | null;
}

// Workout Types
export type WorkoutIntensity = 'easy' | 'moderate' | 'hard';
export type WorkoutSource = 'autodetected' | 'confirmed' | 'manual' | 'workout_heart_rate';

export interface WorkoutModel {
  id: string;
  activity: string;
  calories?: number | null;
  day: string;
  distance?: number | null;
  end_datetime: LocalDateTime;
  intensity: WorkoutIntensity;
  label?: string | null;
  source: WorkoutSource;
  start_datetime: LocalDateTime;
}

export interface MultiDocumentResponse_WorkoutModel {
  data: WorkoutModel[];
  next_token?: string | null;
}

// Session Types
export type MomentType = 'breathing' | 'meditation' | 'nap' | 'relaxation' | 'rest' | 'body_status';
export type MomentMood = 'bad' | 'worse' | 'same' | 'good' | 'great';

export interface SessionModel {
  id: string;
  day: string;
  start_datetime: LocalDateTime;
  end_datetime: LocalDateTime;
  type: MomentType;
  heart_rate?: SampleModel | null;
  heart_rate_variability?: SampleModel | null;
  mood?: MomentMood | null;
  motion_count?: SampleModel | null;
}

export interface MultiDocumentResponse_SessionModel {
  data: SessionModel[];
  next_token?: string | null;
}

// Tag Types
export interface TagModel {
  id: string;
  day: string;
  text?: string | null;
  timestamp: LocalDateTime;
  tags: string[];
}

export interface MultiDocumentResponse_TagModel {
  data: TagModel[];
  next_token?: string | null;
}

// Enhanced Tag Types
export interface EnhancedTagModel {
  id: string;
  tag_type_code?: string | null;
  start_time: LocalDateTime;
  end_time?: LocalDateTime | null;
  start_day: string;
  end_day?: string | null;
  comment?: string | null;
  custom_name?: string | null;
}

export interface MultiDocumentResponse_EnhancedTagModel {
  data: EnhancedTagModel[];
  next_token?: string | null;
}

// Sleep Time Types
export type SleepTimeRecommendation = 
  | 'improve_efficiency'
  | 'earlier_bedtime'
  | 'later_bedtime'
  | 'earlier_wake_up_time'
  | 'later_wake_up_time'
  | 'follow_optimal_bedtime';

export type SleepTimeStatus = 
  | 'not_enough_nights'
  | 'not_enough_recent_nights'
  | 'bad_sleep_quality'
  | 'only_recommended_found'
  | 'optimal_found';

export interface SleepTimeWindow {
  day_tz: number;
  end_offset: number;
  start_offset: number;
}

export interface SleepTimeModel {
  id: string;
  day: string;
  optimal_bedtime?: SleepTimeWindow | null;
  recommendation?: SleepTimeRecommendation | null;
  status?: SleepTimeStatus | null;
}

export interface MultiDocumentResponse_SleepTimeModel {
  data: SleepTimeModel[];
  next_token?: string | null;
}

// VO2 Max Types
export interface VO2MaxModel {
  id: string;
  day: string;
  timestamp: LocalDateTime;
  vo2_max?: number | null;
}

export interface MultiDocumentResponse_VO2MaxModel {
  data: VO2MaxModel[];
  next_token?: string | null;
}

// Cardiovascular Age Types
export interface DailyCardiovascularAgeModel {
  day: string;
  vascular_age?: number | null;
}

export interface MultiDocumentResponse_DailyCardiovascularAgeModel {
  data: DailyCardiovascularAgeModel[];
  next_token?: string | null;
}

// Resilience Types
export type LongTermResilienceLevel = 'limited' | 'adequate' | 'solid' | 'strong' | 'exceptional';

export interface ResilienceContributors {
  sleep_recovery: number;
  daytime_recovery: number;
  stress: number;
}

export interface DailyResilienceModel {
  id: string;
  day: string;
  contributors: ResilienceContributors;
  level: LongTermResilienceLevel;
}

export interface MultiDocumentResponse_DailyResilienceModel {
  data: DailyResilienceModel[];
  next_token?: string | null;
}

// Ring Configuration Types
export type RingColor = 
  | 'brushed_silver'
  | 'glossy_black'
  | 'glossy_gold'
  | 'glossy_white'
  | 'gucci'
  | 'matt_gold'
  | 'rose'
  | 'silver'
  | 'stealth_black'
  | 'titanium'
  | 'titanium_and_gold';

export type RingDesign = 'balance' | 'balance_diamond' | 'heritage' | 'horizon';
export type RingHardwareType = 'gen1' | 'gen2' | 'gen2m' | 'gen3' | 'gen4';

export interface RingConfigurationModel {
  id: string;
  color?: RingColor | null;
  design?: RingDesign | null;
  firmware_version?: string | null;
  hardware_type?: RingHardwareType | null;
  set_up_at?: LocalDateTime | null;
  size?: number | null;
}

export interface MultiDocumentResponse_RingConfigurationModel {
  data: RingConfigurationModel[];
  next_token?: string | null;
}

// Rest Mode Types
export interface RestModeEpisode {
  tags: string[];
  timestamp: string; // LocalizedDateTime
}

export interface RestModePeriodModel {
  id: string;
  end_day?: string | null;
  end_time?: LocalDateTime | null;
  episodes: RestModeEpisode[];
  start_day: string;
  start_time?: LocalDateTime | null;
}

export interface MultiDocumentResponse_RestModePeriodModel {
  data: RestModePeriodModel[];
  next_token?: string | null;
}

// Error Types
export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

// API Error Response Type
export interface OuraAPIError {
  status: number;
  statusText: string;
  message?: string;
}
