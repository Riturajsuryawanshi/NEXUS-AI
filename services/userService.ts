import { supabase } from './supabaseClient';
import { UserProfile, PlanType, AuthProvider, BusinessContext } from '../types';
import { SubscriptionService } from './subscriptionService';

const PLAN_LIMITS: Record<PlanType, Partial<UserProfile>> = {
  free: { dailyFileLimit: 3, aiCallsRemaining: 5, aiTokensLimitDaily: 2000 },
  solo: { dailyFileLimit: 10, aiCallsRemaining: 20, aiTokensLimitDaily: 10000 },
  pro: { dailyFileLimit: 50, aiCallsRemaining: 50, aiTokensLimitDaily: 20000 },
  enterprise: { dailyFileLimit: 1000, aiCallsRemaining: 1000, aiTokensLimitDaily: 500000 },
};

export class UserService {
  private static currentUserProfile: UserProfile | null = null;
  private static listeners: ((profile: UserProfile | null) => void)[] = [];

  static async init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await this.fetchProfile(session.user.id);
    } else {
      this.currentUserProfile = null;
      this.notify();
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await this.fetchProfile(session.user.id);
      } else {
        this.currentUserProfile = null;
        this.notify();
      }
    });
  }

  static subscribe(cb: (profile: UserProfile | null) => void) {
    this.listeners.push(cb);
    cb(this.currentUserProfile);
    // Initialize if not already done (or check session)
    if (!this.currentUserProfile) {
      this.init();
    }
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  static getCurrentUserId(): string {
    return this.currentUserProfile?.userId || 'guest';
  }

  private static notify() {
    this.listeners.forEach(l => l(this.currentUserProfile));
  }

  private static async fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Check if it's a "Row not found" error (PGRST116) or just no data returned
      if (!data || (error && error.code === 'PGRST116')) {
        console.warn("Profile missing for user. Attempting to create default profile...");
        await this.createDefaultProfile(userId);
        return;
      }
      console.error('Error fetching profile:', error);
      return;
    }

    // Fetch Subscription & Credits
    const sub = await SubscriptionService.getCurrentSubscription(userId);
    const credits = await SubscriptionService.getCredits(userId);

    // Plan Limits Override based on Subscription
    let planType: PlanType = (data.plan_type as PlanType) || 'free';
    if (sub && sub.status === 'active') {
      planType = sub.planType;
    }

    const limits = PLAN_LIMITS[planType];

    // Get Auth User for Email
    const { data: { user } } = await supabase.auth.getUser();

    this.currentUserProfile = {
      userId: data.id,
      email: user?.email, // Populate email
      planType: planType,
      dailyFileLimit: limits.dailyFileLimit || 3,
      filesProcessedToday: data.files_processed_today,
      aiCallsRemaining: limits.aiCallsRemaining || 5, // This logic might need to be split if we track usage in DB vs Plan limit
      // For now, we trust the DB 'ai_calls_remaining' but we should probably reset it daily based on plan

      aiTokensUsedToday: 0,
      aiTokensLimitDaily: limits.aiTokensLimitDaily || 2000,
      lastUsageResetAt: new Date(data.created_at).getTime(),
      authProvider: 'email',
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      preferences: data.preferences || { learningMode: true },
      // New:
      subscription: sub || undefined,
      creditsAvailable: credits
    };
    this.notify();
  }

  static async refreshProfile() {
    if (this.currentUserProfile) {
      await this.fetchProfile(this.currentUserProfile.userId);
    }
  }

  private static async createDefaultProfile(userId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newProfile = {
      id: userId,
      email: user.email,
      display_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'Analyst',
      avatar_url: user.user_metadata.avatar_url || '',
      plan_type: 'free',
      daily_file_limit: 3,
      files_processed_today: 0,
      ai_calls_remaining: 5,
      preferences: { learningMode: true }
    };

    const { error } = await supabase
      .from('profiles')
      .insert([newProfile]);

    if (error) {
      console.error("Failed to create default profile:", error);
    } else {
      // Retry fetching
      await this.fetchProfile(userId);
    }
  }

  static async login(email: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    alert("Check your email for the login link!");
  }

  static async loginWithPassword(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  static async signup(email: string, password?: string): Promise<void> {
    if (password) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      // If email confirmation is disabled in Supabase, they are now logged in.
      // If enabled, they need to confirm.
    } else {
      return this.login(email);
    }
  }

  static async loginWithGoogle(): Promise<void> {
    // Use current origin to support any localhost port (3000, 3004, etc.)
    const redirectUrl = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent select_account',
        }
      }
    });
    if (error) throw error;
  }

  static async loginWithApple(): Promise<void> {
    // Use current origin to support any localhost port (3000, 3004, etc.)
    const redirectUrl = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUrl
      }
    });
    if (error) throw error;
  }

  static async logout() {
    await supabase.auth.signOut();
    this.currentUserProfile = null;
    this.notify();
  }

  static async updatePreference(key: keyof UserProfile['preferences'], value: any) {
    if (!this.currentUserProfile) return;

    const updatedPrefs = { ...this.currentUserProfile.preferences, [key]: value };
    const { error } = await supabase
      .from('profiles')
      .update({ preferences: updatedPrefs })
      .eq('id', this.currentUserProfile.userId);

    if (!error) {
      this.currentUserProfile.preferences = updatedPrefs;
      this.notify();
    }
  }

  static async updateProfile(updates: Partial<UserProfile> | any) {
    if (!this.currentUserProfile) return;

    // Filter out fields that shouldn't be updated directly via this method if necessary
    // For now, we allow updating mapped fields like display_name
    const dbUpdates: any = {};
    if (updates.display_name) dbUpdates.display_name = updates.display_name;
    if (updates.avatar_url) dbUpdates.avatar_url = updates.avatar_url;

    if (Object.keys(dbUpdates).length === 0) return;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', this.currentUserProfile.userId);

    if (error) throw error;

    // Optimistic update
    if (updates.display_name) this.currentUserProfile.displayName = updates.display_name;
    if (updates.avatar_url) this.currentUserProfile.avatarUrl = updates.avatar_url;
    this.notify();
  }

  static async updateBusinessContext(context: BusinessContext) {
    // Profile doesn't store business context in the new design (Workspaces do)
    // But for backward compatibility or if there's a "default" context:
    // We'll skip this or log a warning if it's not in the profile schema anymore
    // The new design puts BusinessContext on Workspace (Client).
    console.warn("Business Context is now managed per Workspace.");
  }

  // --- Usage Tracking (Optimistic Updates + DB) ---

  static async trackFileProcessed(userId: string) {
    if (!this.currentUserProfile) return;
    this.currentUserProfile.filesProcessedToday++;
    this.notify();

    await supabase.rpc('increment_files_processed', { row_id: userId });
  }

  static async useAiCall(userId: string, tokens: number = 0) {
    if (!this.currentUserProfile) return;
    if (this.currentUserProfile.aiCallsRemaining > 0) {
      this.currentUserProfile.aiCallsRemaining--;
      this.notify();
      await supabase.rpc('decrement_ai_calls', { row_id: userId });
    }
  }

  static canProcessFile(userId: string): boolean {
    return this.currentUserProfile ? this.currentUserProfile.filesProcessedToday < this.currentUserProfile.dailyFileLimit : false;
  }

  static canUseAi(userId: string): boolean {
    return this.currentUserProfile ? this.currentUserProfile.aiCallsRemaining > 0 : false;
  }
}
