import { supabase } from './supabaseClient';
import { Client, BusinessContext } from '../types';

export class ClientService {
    private static clients: Client[] = [];
    private static listeners: ((clients: Client[], activeId: string | null) => void)[] = [];
    private static activeClientId: string | null = localStorage.getItem('nexus_active_client_id');

    static async init() {
        await this.fetchClients();
        // If no clients, maybe create default? Handled in user interaction or similar to before?
        // We'll leave auto-creation for now to the UI or explicit calls, 
        // but ensuring we have the list loaded.
        this.notify();
    }

    static subscribe(cb: (clients: Client[], activeId: string | null) => void) {
        this.listeners.push(cb);
        cb(this.clients, this.activeClientId);
        this.init(); // Ensure data is fresh
        return () => { this.listeners = this.listeners.filter(l => l !== cb); };
    }

    private static notify() {
        this.listeners.forEach(l => l(this.clients, this.activeClientId));
    }

    static getClients(): Client[] {
        return this.clients;
    }

    static getClient(id: string): Client | undefined {
        return this.clients.find(c => c.id === id);
    }

    static getActiveClient(): Client | undefined {
        if (!this.activeClientId) return undefined;
        return this.clients.find(c => c.id === this.activeClientId);
    }

    static async fetchClients() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // No user, no workspaces

        const { data, error } = await supabase
            .from('workspaces')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching workspaces:', error);
            return;
        }

        if (data && data.length > 0) {
            this.clients = data.map(row => ({
                id: row.id,
                name: row.name,
                industry: row.industry,
                currency: row.currency,
                createdAt: new Date(row.created_at).getTime(),
                businessContext: row.business_context || {
                    businessType: row.industry,
                    primaryGoal: 'Unknown',
                    primaryKPI: 'Unknown',
                    currency: row.currency,
                    timeGranularity: 'monthly'
                },
                datasetCount: 0 // We'd need to count jobs to get this real number
            }));
            this.notify();
        } else {
            // Auto-create default workspace if none exists
            console.log("No workspaces found. Auto-creating default...");
            try {
                await this.createClient('Personal Workspace', 'Personal', 'USD');
            } catch (err) {
                console.error("Failed to auto-create default workspace:", err);
            }
        }
    }

    static async createClient(name: string, industry: string, currency: string): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Must be logged in to create a workspace");

        const businessContext = {
            businessType: industry,
            primaryGoal: 'Revenue Growth',
            primaryKPI: 'Revenue',
            currency: currency,
            timeGranularity: 'monthly'
        };

        const { data, error } = await supabase
            .from('workspaces')
            .insert({
                owner_id: user.id,
                name,
                industry,
                currency,
                business_context: businessContext
            })
            .select()
            .single();

        if (error) throw error;

        await this.fetchClients(); // Refresh list
        this.setActiveClient(data.id);
        return data.id;
    }

    static async updateBusinessContext(clientId: string, context: BusinessContext) {
        const { error } = await supabase
            .from('workspaces')
            .update({
                business_context: context,
                industry: context.businessType,
                currency: context.currency
            })
            .eq('id', clientId);

        if (error) {
            console.error("Failed to update workspace context", error);
            return;
        }
        await this.fetchClients();
    }

    static setActiveClient(id: string | null) {
        this.activeClientId = id;
        if (id) {
            localStorage.setItem('nexus_active_client_id', id);
        } else {
            localStorage.removeItem('nexus_active_client_id');
        }
        this.notify();
    }
}
