
import { Client, JobRecord } from '../types';

export interface ReportLog {
    id: string;
    clientId: string;
    jobId: string;
    filename: string;
    generatedAt: number;
    type: 'PDF' | 'Excel';
    verified: boolean;
}

export class ReportService {
    private static logs: ReportLog[] = [];

    static getLogs(clientId: string): ReportLog[] {
        return this.logs.filter(l => l.clientId === clientId).sort((a, b) => b.generatedAt - a.generatedAt);
    }

    static logReport(client: Client, job: JobRecord, type: 'PDF' | 'Excel') {
        const log: ReportLog = {
            id: crypto.randomUUID(),
            clientId: client.id,
            jobId: job.id,
            filename: `Nexus_Proof_${client.name}_${type}_${Date.now()}`,
            generatedAt: Date.now(),
            type,
            verified: true
        };
        this.logs.push(log);
        // Persist to local storage if needed, but in-memory is fine for this demo scope
        localStorage.setItem('nexus_report_logs', JSON.stringify(this.logs));
    }

    static load() {
        const saved = localStorage.getItem('nexus_report_logs');
        if (saved) {
            try {
                this.logs = JSON.parse(saved);
            } catch (e) { console.error("Failed to load report logs", e); }
        }
    }
}

// Initialize
ReportService.load();
