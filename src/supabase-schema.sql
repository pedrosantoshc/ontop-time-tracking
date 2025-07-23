-- Ontop Time Tracking Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  tracking_preferences JSONB NOT NULL DEFAULT '{
    "allowClockInOut": true,
    "allowManualEntry": true,
    "requireProofOfWork": true,
    "screenshotFrequency": "manual"
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workers table
CREATE TABLE workers (
  contractor_id VARCHAR(255) PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  invite_token VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT FALSE,
  tracking_mode VARCHAR(50) NOT NULL CHECK (tracking_mode IN ('clock', 'timesheet')),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time entries table
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id VARCHAR(255) NOT NULL REFERENCES workers(contractor_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  manual_hours DECIMAL(5,2),
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  client_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proof of work table
CREATE TABLE proof_of_work (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  time_entry_id UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('screenshot', 'note', 'file')),
  timestamp TIMESTAMPTZ NOT NULL,
  content TEXT NOT NULL, -- base64 encoded content or text
  description TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_workers_client_id ON workers(client_id);
CREATE INDEX idx_workers_invite_token ON workers(invite_token);
CREATE INDEX idx_time_entries_worker_id ON time_entries(worker_id);
CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_time_entries_status ON time_entries(status);
CREATE INDEX idx_proof_of_work_time_entry_id ON proof_of_work(time_entry_id);

-- Row Level Security (RLS) policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_of_work ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you may want to customize these based on your auth requirements)
-- Allow authenticated users to see their own data
CREATE POLICY "Users can view their own client data" ON clients
  FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view workers for their clients" ON workers
  FOR ALL USING (
    client_id IN (
      SELECT id FROM clients WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Users can view time entries for their workers" ON time_entries
  FOR ALL USING (
    worker_id IN (
      SELECT contractor_id FROM workers WHERE client_id IN (
        SELECT id FROM clients WHERE auth.uid()::text = id::text
      )
    )
  );

CREATE POLICY "Users can view proof of work for their time entries" ON proof_of_work
  FOR ALL USING (
    time_entry_id IN (
      SELECT id FROM time_entries WHERE worker_id IN (
        SELECT contractor_id FROM workers WHERE client_id IN (
          SELECT id FROM clients WHERE auth.uid()::text = id::text
        )
      )
    )
  );

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();