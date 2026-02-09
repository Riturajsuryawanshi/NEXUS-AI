import { supabase } from './supabaseClient';
import { UserProfile, PlanType, AuthProvider, BusinessContext } from '../types';

const PLAN_LIMITS: Record<PlanType, Partial<UserProfile>> = {
  free: { dailyFileLimit: 3, aiCallsRemaining: 5, aiTokensLimitDaily: 2000 },
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
      console.error('Error fetching profile:', error);
      return;
    }

    this.currentUserProfile = {
      userId: data.id,
      planType: data.plan_type as PlanType,
      dailyFileLimit: data.daily_file_limit,
      filesProcessedToday: data.files_processed_today,
      aiCallsRemaining: data.ai_calls_remaining,
      aiTokensUsedToday: 0, // Not persisted in this simple schema yet, or reset daily
      aiTokensLimitDaily: 2000, // Hardcoded for now based on plan (could be in DB)
      lastUsageResetAt: new Date(data.created_at).getTime(), // Using created_at for now
      authProvider: 'email', // derived?
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      preferences: data.preferences || { learningMode: true }
    };
    this.notify();
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
    // Client-side Google auth with Supabase usually involves redirection.
    // nexus-dataanalyst UI might have a button that handles this.
    // For now, we'll assume standard Supabase signInWithOAuth
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
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
