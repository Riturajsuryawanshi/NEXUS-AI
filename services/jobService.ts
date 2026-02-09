import { supabase } from './supabaseClient';
import { JobRecord, JobStatus, ChatMessage } from '../types'; // Removed unused
import { StorageService } from './storageService';
import { UserService } from './userService';
import { ClientService } from './clientService';
import { CacheService } from './cacheService';
import { QueueService } from './queueService';
import { TransformationEngine } from '../data_engine/transformation';
import { DataEngine } from './dataEngine';
import { GeminiService } from './geminiService';
import * as XLSX from 'xlsx';

export class JobService {
  private static jobs: JobRecord[] = [];
  private static listeners: ((jobs: JobRecord[]) => void)[] = [];

  static async init() {
    await this.fetchJobs();
    // subscribe to realtime changes?
    this.notify();
  }

  static subscribe(cb: (jobs: JobRecord[]) => void) {
    this.listeners.push(cb);
    cb(this.jobs);
    this.init();
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  private static notify() {
    // Sort by createdAt descending
    const list = [...this.jobs].sort((a, b) => b.createdAt - a.createdAt);
    this.listeners.forEach(l => l(list));
  }

  static async fetchJobs() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
      return;
    }

    if (data) {
      this.jobs = data.map(row => ({
        id: row.id,
        userId: row.user_id,
        clientId: row.workspace_id,
        fileName: row.file_name,
        fileSize: row.file_size,
        status: row.status as JobStatus,
        createdAt: new Date(row.created_at).getTime(),
        summary: row.summary,
        aiResult: row.ai_result,
        chatHistory: row.chat_history || [],
        dataStack: [], // Not persisting big data stacks in DB rows directly for now? Or fetching separately?
        // Standard practice: Don't load heavy data until needed.
        // For now, we'll initialize empty and maybe load if needed or keep in memory for active session.
        // Actually, if we reload, we lose the data stack unless we persisted it.
        // Persisting data stack (array of arrays) in JSONB might be too big.
        // We should probably rely on re-processing or storing the *latest* cleaned data in StorageService.
        // For this implementation, we'll start empty. 
      }));
      this.notify();
    }
  }

  static async createJob(file: File): Promise<string> {
    const userId = UserService.getCurrentUserId();
    const clientId = ClientService.getActiveClient()?.id;

    // 1. Process File Content Locally (to get keys/content)
    let content = '';
    if (file.name.match(/\.(xlsx|xls)$/i)) {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      content = XLSX.utils.sheet_to_csv(worksheet);
    } else {
      content = await file.text();
    }

    const cacheKey = await CacheService.generateKey(content, "default");
    // const jobId = crypto.randomUUID(); // Supabase can generate, but we typically want it for the path first.

    // 2. Upload to Supabase Storage
    // We'll generate a UUID for the ID to use in the path
    const tempId = crypto.randomUUID();
    const filePath = `raw/${userId}/${tempId}_${file.name}`;
    await StorageService.upload(filePath, content);

    // 3. Insert into DB
    const { data: jobData, error } = await supabase
      .from('jobs')
      .insert({
        id: tempId,
        user_id: userId,
        workspace_id: clientId,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        status: 'PENDING',
        chat_history: []
      })
      .select()
      .single();

    if (error) throw error;
    const jobId = jobData.id;

    const record: JobRecord = {
      id: jobId,
      userId,
      clientId,
      fileName: file.name,
      fileSize: file.size,
      status: JobStatus.PENDING,
      createdAt: Date.now(),
      dataStack: [],
      chatHistory: []
    };

    // Optimistic add
    this.jobs.unshift(record);
    this.notify();

    // 4. Start Processing (Queue)
    // We use the Storage path.
    QueueService.push(jobId, filePath, cacheKey, (updates) => {
      this.applyJobUpdate(jobId, updates);
    });

    return jobId;
  }

  static async applyJobUpdate(jobId: string, updates: Partial<JobRecord>) {
    // Update local state
    const index = this.jobs.findIndex(j => j.id === jobId);
    if (index !== -1) {
      const updatedJob = { ...this.jobs[index], ...updates };
      this.jobs[index] = updatedJob;
      this.notify();

      // Persist to DB
      // We only persist specific fields: status, summary, aiResult
      const dbUpdates: any = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.summary) dbUpdates.summary = updates.summary;
      if (updates.aiResult) dbUpdates.ai_result = updates.aiResult;

      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from('jobs').update(dbUpdates).eq('id', jobId);
      }
    }
  }

  static async sendMessage(jobId: string, text: string) {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job || !job.summary) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now() };
    job.chatHistory.push(userMsg);
    this.notify();

    // Persist chat
    await this.updateChatHistory(jobId, job.chatHistory);

    const aiResponse = await GeminiService.chatWithData(job.summary, job.chatHistory, text);
    job.chatHistory.push(aiResponse);
    this.notify();

    // Persist chat
    await this.updateChatHistory(jobId, job.chatHistory);
  }

  private static async updateChatHistory(jobId: string, history: ChatMessage[]) {
    await supabase.from('jobs').update({ chat_history: history }).eq('id', jobId);
  }

  static async applyAction(jobId: string, actionId: string) {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job || !job.summary) return;

    // Note: dataStack is in-memory only for now. If user reloads, they lose undo history.
    // To fix, we'd need to store dataStack or regenerate it.
    let currentData = job.dataStack[job.dataStack.length - 1] || [];
    // If dataStack is empty (e.g. fresh load), we might need to fetch data from Storage?
    // For now, assume this only works in active session where data was just processed.
    // Improvment: Fetch 'cleaned' data from storage if not in memory.

    // ... existing logic ...
    const headers = Object.keys(job.summary.columns);
    const columns = Object.values(job.summary.columns) as any;

    const logOperation = (name: string, reason: string, details: string) => {
      job.summary!.operationHistory.push({ timestamp: Date.now(), action: name, reason, details });
    };

    let newData: any[] | null = null;
    let didUpdate = false;

    switch (actionId) {
      case 'clean_data':
        newData = TransformationEngine.clean(currentData, columns);
        logOperation("AI Cleaning", "User Request", "Resolved null values and normalized formats.");
        break;
      case 'remove_duplicates':
        newData = TransformationEngine.deduplicate(currentData);
        logOperation("Deduplication", "User Request", `Pruned duplicates.`);
        break;
      case 'build_dashboard':
        try {
          const blueprint = await GeminiService.designDashboard(job.summary);
          job.summary.dashboard = TransformationEngine.buildDashboardFromBlueprint(currentData, job.summary, blueprint);
          logOperation("AI Dashboard Design", "Intelligent Layout", "Gemini-3 architected the visualization layer.");
          didUpdate = true;
        } catch (err) {
          console.warn("AI Design failed", err);
          job.summary.dashboard = TransformationEngine.buildDashboard(currentData, job.summary);
          didUpdate = true;
        }
        break;
      case 'undo':
        if (job.dataStack.length > 1) {
          job.dataStack.pop();
          const { summary } = await DataEngine.runAnalysisPipeline(job.dataStack[job.dataStack.length - 1], headers, job.summary.operationHistory);
          job.summary = summary;
          didUpdate = true;
        }
        return; // Early return for undo (special case)
    }

    if (newData) {
      job.dataStack.push(newData);
      const { summary } = await DataEngine.runAnalysisPipeline(newData, headers, job.summary.operationHistory);
      if (job.summary.dashboard) summary.dashboard = job.summary.dashboard;
      job.summary = summary;
      didUpdate = true;
    }

    if (didUpdate) {
      this.applyJobUpdate(jobId, { summary: job.summary });
    }
  }
}
