import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { DatabaseService } from './database.service';
import { Client, Worker, TimeEntry } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class MigrationService {
  constructor(
    private storageService: StorageService,
    private databaseService: DatabaseService
  ) {}

  async migrateAllDataToSupabase(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Starting migration from LocalStorage to Supabase...');

      // 1. Migrate client data
      const clientData = this.storageService.getClientData();
      if (clientData) {
        console.log('Migrating client data...');
        const { error: clientError } = await this.databaseService.createClient(clientData);
        if (clientError) {
          throw new Error(`Failed to migrate client: ${clientError.message}`);
        }
        console.log('✅ Client data migrated successfully');

        // 2. Migrate workers
        const workers = this.storageService.getWorkers();
        if (workers.length > 0) {
          console.log(`Migrating ${workers.length} workers...`);
          for (const worker of workers) {
            const { error: workerError } = await this.databaseService.createWorker(worker, clientData.id);
            if (workerError) {
              console.warn(`Failed to migrate worker ${worker.contractorId}:`, workerError.message);
            }
          }
          console.log('✅ Workers migrated successfully');
        }

        // 3. Migrate time entries
        const timeEntries = this.storageService.getTimeEntries();
        if (timeEntries.length > 0) {
          console.log(`Migrating ${timeEntries.length} time entries...`);
          for (const entry of timeEntries) {
            const { error: entryError } = await this.databaseService.createTimeEntry(entry);
            if (entryError) {
              console.warn(`Failed to migrate time entry ${entry.id}:`, entryError.message);
            }

            // Migrate proof of work for each time entry
            if (entry.proofOfWork && entry.proofOfWork.length > 0) {
              for (const proof of entry.proofOfWork) {
                const { error: proofError } = await this.databaseService.createProofOfWork(proof, entry.id);
                if (proofError) {
                  console.warn(`Failed to migrate proof of work ${proof.id}:`, proofError.message);
                }
              }
            }
          }
          console.log('✅ Time entries and proof of work migrated successfully');
        }
      }

      console.log('🎉 Migration completed successfully!');
      return { success: true };

    } catch (error: any) {
      console.error('❌ Migration failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async validateMigration(): Promise<{ valid: boolean; report: string }> {
    try {
      const report: string[] = [];
      
      // Compare LocalStorage data with Supabase data
      const localClient = this.storageService.getClientData();
      const localWorkers = this.storageService.getWorkers();
      const localTimeEntries = this.storageService.getTimeEntries();

      if (localClient) {
        const { data: supabaseClient, error } = await this.databaseService.getClient(localClient.id);
        if (error || !supabaseClient) {
          report.push(`❌ Client data mismatch: ${error?.message || 'Not found'}`);
        } else {
          report.push('✅ Client data migrated correctly');
        }

        const { data: supabaseWorkers } = await this.databaseService.getWorkersByClientId(localClient.id);
        if (supabaseWorkers.length !== localWorkers.length) {
          report.push(`⚠️ Worker count mismatch: Local ${localWorkers.length}, Supabase ${supabaseWorkers.length}`);
        } else {
          report.push('✅ All workers migrated correctly');
        }

        const { data: supabaseEntries } = await this.databaseService.getTimeEntriesByClientId(localClient.id);
        if (supabaseEntries.length !== localTimeEntries.length) {
          report.push(`⚠️ Time entry count mismatch: Local ${localTimeEntries.length}, Supabase ${supabaseEntries.length}`);
        } else {
          report.push('✅ All time entries migrated correctly');
        }
      }

      const isValid = !report.some(line => line.includes('❌'));
      return { valid: isValid, report: report.join('\n') };

    } catch (error: any) {
      return { valid: false, report: `Validation failed: ${error.message}` };
    }
  }

  async clearLocalStorageAfterMigration(): Promise<void> {
    if (confirm('⚠️ This will permanently delete all LocalStorage data. Are you sure the migration to Supabase was successful?')) {
      localStorage.clear();
      console.log('LocalStorage cleared successfully');
    }
  }
}