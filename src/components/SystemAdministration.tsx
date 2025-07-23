
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { migrationService } from '@/services/migrationService';
import { databaseSchemaService } from '@/services/databaseSchemaService';
import { supabase, isSupabaseAvailable } from '@/services/supabaseService';
import { toast } from "@/hooks/use-toast";
import SystemHealthOverview from '@/components/admin/SystemHealthOverview';
import DatabaseSchemaSetup from '@/components/admin/DatabaseSchemaSetup';
import DataMigration from '@/components/admin/DataMigration';
import FoundationalSystems from '@/components/admin/FoundationalSystems';

const SystemAdministration: React.FC = () => {
  const [migrationStatus, setMigrationStatus] = useState<'checking' | 'needed' | 'completed' | 'running'>('checking');
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'warning' | 'error'>('healthy');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [schemaStatus, setSchemaStatus] = useState<Record<string, boolean>>({});
  const [schemaSetupStatus, setSchemaSetupStatus] = useState<'checking' | 'needed' | 'completed' | 'running'>('checking');

  useEffect(() => {
    checkSystemStatus();
    checkSchemaStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      // Check if Supabase is configured
      if (!isSupabaseAvailable()) {
        setConnectionStatus('disconnected');
        setSystemHealth('error');
        setMigrationStatus('needed');
        return;
      }

      // Check Supabase connection
      const { data, error } = await supabase!.from('system_settings').select('*').limit(1);
      if (error) {
        setConnectionStatus('disconnected');
        setSystemHealth('error');
      } else {
        setConnectionStatus('connected');
        setSystemHealth('healthy');
      }

      // Check migration status
      const isMigrated = await migrationService.checkMigrationStatus();
      setMigrationStatus(isMigrated ? 'completed' : 'needed');
    } catch (error) {
      console.error('System status check failed:', error);
      setConnectionStatus('disconnected');
      setSystemHealth('error');
    }
  };

  const checkSchemaStatus = async () => {
    try {
      if (!isSupabaseAvailable()) {
        setSchemaSetupStatus('needed');
        return;
      }

      const status = await databaseSchemaService.getSchemaStatus();
      setSchemaStatus(status);
      
      const allTablesExist = Object.values(status).every(exists => exists);
      setSchemaSetupStatus(allTablesExist ? 'completed' : 'needed');
    } catch (error) {
      console.error('Schema status check failed:', error);
      setSchemaSetupStatus('needed');
    }
  };

  const setupDatabaseSchema = async () => {
    if (!isSupabaseAvailable()) {
      toast({
        title: "Supabase Not Configured",
        description: "Please configure your Supabase connection before setting up the database schema.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setSchemaSetupStatus('running');
    
    try {
      await databaseSchemaService.createAllTables();
      await checkSchemaStatus();
      
      toast({
        title: "Database Schema Created",
        description: "All database tables and policies have been set up successfully.",
        duration: 5000,
      });
    } catch (error) {
      console.error('Schema setup failed:', error);
      setSchemaSetupStatus('needed');
      
      toast({
        title: "Schema Setup Failed",
        description: "Failed to create database schema. Please check logs and try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const runMigration = async () => {
    if (!isSupabaseAvailable()) {
      toast({
        title: "Supabase Not Configured",
        description: "Please configure your Supabase connection before running migration.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setMigrationStatus('running');
    setMigrationProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setMigrationProgress(prev => Math.min(prev + 20, 90));
      }, 500);

      await migrationService.runFullMigration();
      
      clearInterval(progressInterval);
      setMigrationProgress(100);
      setMigrationStatus('completed');
      
      toast({
        title: "Migration Completed",
        description: "All data has been successfully migrated to Supabase.",
        duration: 5000,
      });
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationStatus('needed');
      
      toast({
        title: "Migration Failed",
        description: "Failed to migrate data. Please check logs and try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">System Administration</h2>
        <p className="text-gray-600">Manage foundational systems and data migration</p>
      </div>

      {/* Supabase Configuration Alert */}
      {!isSupabaseAvailable() && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Supabase is not configured. Please set up your Supabase connection by clicking the green Supabase button in the top right corner and configure your environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).
          </AlertDescription>
        </Alert>
      )}

      {/* System Health Overview */}
      <SystemHealthOverview 
        connectionStatus={connectionStatus}
        schemaSetupStatus={schemaSetupStatus}
        migrationStatus={migrationStatus}
        systemHealth={systemHealth}
      />

      {/* Database Schema Setup */}
      <DatabaseSchemaSetup 
        schemaSetupStatus={schemaSetupStatus}
        schemaStatus={schemaStatus}
        onSetupSchema={setupDatabaseSchema}
        onCheckSchema={checkSchemaStatus}
      />

      {/* Data Migration */}
      <DataMigration 
        migrationStatus={migrationStatus}
        migrationProgress={migrationProgress}
        schemaSetupStatus={schemaSetupStatus}
        onRunMigration={runMigration}
        onCheckSystemStatus={checkSystemStatus}
      />

      {/* System Components Status */}
      <FoundationalSystems 
        schemaSetupStatus={schemaSetupStatus}
      />
    </div>
  );
};

export default SystemAdministration;
