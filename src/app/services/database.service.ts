import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Client, Worker, TimeEntry, ProofOfWork } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  constructor(private supabase: SupabaseService) {}

  // Client operations
  async createClient(client: Client): Promise<{ data: Client | null; error: any }> {
    const { data, error } = await this.supabase.client
      .from('clients')
      .insert([{
        id: client.id,
        name: client.name,
        email: client.email,
        tracking_preferences: client.trackingPreferences,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    return { data: data ? this.mapClientFromDB(data) : null, error };
  }

  async getClient(id: string): Promise<{ data: Client | null; error: any }> {
    const { data, error } = await this.supabase.client
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    return { data: data ? this.mapClientFromDB(data) : null, error };
  }

  async updateClient(client: Client): Promise<{ data: Client | null; error: any }> {
    const { data, error } = await this.supabase.client
      .from('clients')
      .update({
        name: client.name,
        email: client.email,
        tracking_preferences: client.trackingPreferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', client.id)
      .select()
      .single();

    return { data: data ? this.mapClientFromDB(data) : null, error };
  }

  // Worker operations
  async createWorker(worker: Worker, clientId: string): Promise<{ data: Worker | null; error: any }> {
    const { data, error } = await this.supabase.client
      .from('workers')
      .insert([{
        contractor_id: worker.contractorId,
        client_id: clientId,
        name: worker.name,
        email: worker.email,
        invite_token: worker.inviteToken,
        is_active: worker.isActive,
        tracking_mode: worker.trackingMode,
        joined_at: worker.joinedAt,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    return { data: data ? this.mapWorkerFromDB(data) : null, error };
  }

  async getWorkersByClientId(clientId: string): Promise<{ data: Worker[]; error: any }> {
    const { data, error } = await this.supabase.client
      .from('workers')
      .select('*')
      .eq('client_id', clientId);

    return { 
      data: data ? data.map(this.mapWorkerFromDB) : [], 
      error 
    };
  }

  async getWorkerByInviteToken(token: string): Promise<{ data: Worker | null; error: any }> {
    const { data, error } = await this.supabase.client
      .from('workers')
      .select('*')
      .eq('invite_token', token)
      .single();

    return { data: data ? this.mapWorkerFromDB(data) : null, error };
  }

  async updateWorker(worker: Worker): Promise<{ data: Worker | null; error: any }> {
    const { data, error } = await this.supabase.client
      .from('workers')
      .update({
        name: worker.name,
        email: worker.email,
        is_active: worker.isActive,
        tracking_mode: worker.trackingMode,
        joined_at: worker.joinedAt,
        updated_at: new Date().toISOString()
      })
      .eq('contractor_id', worker.contractorId)
      .select()
      .single();

    return { data: data ? this.mapWorkerFromDB(data) : null, error };
  }

  async deleteWorker(contractorId: string): Promise<{ error: any }> {
    const { error } = await this.supabase.client
      .from('workers')
      .delete()
      .eq('contractor_id', contractorId);

    return { error };
  }

  // Time Entry operations
  async createTimeEntry(entry: TimeEntry): Promise<{ data: TimeEntry | null; error: any }> {
    const { data, error } = await this.supabase.client
      .from('time_entries')
      .insert([{
        id: entry.id,
        worker_id: entry.workerId,
        date: entry.date,
        start_time: entry.startTime,
        end_time: entry.endTime,
        manual_hours: entry.manualHours,
        description: entry.description,
        status: entry.status,
        client_notes: entry.clientNotes,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    return { data: data ? this.mapTimeEntryFromDB(data) : null, error };
  }

  async getTimeEntriesByWorkerId(workerId: string): Promise<{ data: TimeEntry[]; error: any }> {
    const { data, error } = await this.supabase.client
      .from('time_entries')
      .select('*')
      .eq('worker_id', workerId);

    return { 
      data: data ? data.map(this.mapTimeEntryFromDB) : [], 
      error 
    };
  }

  async getTimeEntriesByClientId(clientId: string): Promise<{ data: TimeEntry[]; error: any }> {
    const { data, error } = await this.supabase.client
      .from('time_entries')
      .select(`
        *,
        workers!inner(client_id)
      `)
      .eq('workers.client_id', clientId);

    return { 
      data: data ? data.map(this.mapTimeEntryFromDB) : [], 
      error 
    };
  }

  async updateTimeEntry(entry: TimeEntry): Promise<{ data: TimeEntry | null; error: any }> {
    const { data, error } = await this.supabase.client
      .from('time_entries')
      .update({
        start_time: entry.startTime,
        end_time: entry.endTime,
        manual_hours: entry.manualHours,
        description: entry.description,
        status: entry.status,
        client_notes: entry.clientNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', entry.id)
      .select()
      .single();

    return { data: data ? this.mapTimeEntryFromDB(data) : null, error };
  }

  async deleteTimeEntry(id: string): Promise<{ error: any }> {
    const { error } = await this.supabase.client
      .from('time_entries')
      .delete()
      .eq('id', id);

    return { error };
  }

  // Proof of Work operations
  async createProofOfWork(proof: ProofOfWork, timeEntryId: string): Promise<{ data: ProofOfWork | null; error: any }> {
    const { data, error } = await this.supabase.client
      .from('proof_of_work')
      .insert([{
        id: proof.id,
        time_entry_id: timeEntryId,
        type: proof.type,
        timestamp: proof.timestamp,
        content: proof.content,
        description: proof.description,
        file_name: proof.fileName,
        file_size: proof.fileSize,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    return { data: data ? this.mapProofFromDB(data) : null, error };
  }

  async getProofOfWorkByTimeEntryId(timeEntryId: string): Promise<{ data: ProofOfWork[]; error: any }> {
    const { data, error } = await this.supabase.client
      .from('proof_of_work')
      .select('*')
      .eq('time_entry_id', timeEntryId);

    return { 
      data: data ? data.map(this.mapProofFromDB) : [], 
      error 
    };
  }

  // Mapping functions to convert between DB schema and TypeScript interfaces
  private mapClientFromDB(dbClient: any): Client {
    return {
      id: dbClient.id,
      name: dbClient.name,
      email: dbClient.email,
      trackingPreferences: dbClient.tracking_preferences,
      workers: [] // Workers will be loaded separately
    };
  }

  private mapWorkerFromDB(dbWorker: any): Worker {
    return {
      contractorId: dbWorker.contractor_id,
      name: dbWorker.name,
      email: dbWorker.email,
      inviteToken: dbWorker.invite_token,
      isActive: dbWorker.is_active,
      trackingMode: dbWorker.tracking_mode,
      joinedAt: dbWorker.joined_at
    };
  }

  private mapTimeEntryFromDB(dbEntry: any): TimeEntry {
    return {
      id: dbEntry.id,
      workerId: dbEntry.worker_id,
      date: dbEntry.date,
      startTime: dbEntry.start_time,
      endTime: dbEntry.end_time,
      manualHours: dbEntry.manual_hours,
      description: dbEntry.description,
      status: dbEntry.status,
      clientNotes: dbEntry.client_notes,
      proofOfWork: [] // Proof of work will be loaded separately
    };
  }

  private mapProofFromDB(dbProof: any): ProofOfWork {
    return {
      id: dbProof.id,
      type: dbProof.type,
      timestamp: dbProof.timestamp,
      content: dbProof.content,
      description: dbProof.description,
      fileName: dbProof.file_name,
      fileSize: dbProof.file_size
    };
  }
}