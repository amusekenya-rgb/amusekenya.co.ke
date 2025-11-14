import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { cmsService } from '@/services/cmsService';
import { defaultCampFormConfigs } from '@/utils/defaultCampConfigs';

export interface CampFormConfig {
  pricing: {
    halfDayRate: number;
    fullDayRate: number;
    currency: string;
  };
  fields: {
    parentName: { label: string; placeholder: string; required: boolean };
    childName: { label: string; placeholder: string; required: boolean };
    dateOfBirth: { label: string; placeholder: string; required: boolean };
    ageRange: { label: string; placeholder: string; required: boolean };
    numberOfDays: { label: string; placeholder: string; helpText: string };
    sessionType: { label: string; halfDayLabel: string; fullDayLabel: string };
    specialNeeds: { label: string; placeholder: string };
    emergencyContact: { label: string; placeholder: string; required: boolean };
    email: { label: string; placeholder: string; required: boolean };
    phone: { label: string; placeholder: string; required: boolean };
  };
  buttons: {
    registerOnly: string;
    registerAndPay: string;
    addChild: string;
    removeChild: string;
  };
  messages: {
    registrationSuccess: string;
    registrationError: string;
    chooseOption: string;
    paymentComingSoon: string;
  };
  specialNeedsSection: {
    title: string;
    description: string;
  };
  sessionDates?: {
    startDate: string; // YYYY-MM-DD format (deprecated, for backward compatibility)
    endDate?: string; // YYYY-MM-DD format (deprecated, for backward compatibility)
  };
  availableDates?: string[]; // Array of YYYY-MM-DD dates (preferred method)
  ageGroups?: Array<{
    age: string;
    locations: string;
    schedule: string;
    skills: string;
    color: string;
  }>;
}

export const useCampFormConfig = (formType: string) => {
  const [config, setConfig] = useState<CampFormConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await cmsService.getCampFormConfig(formType);
        const defaultConfig = defaultCampFormConfigs[formType];
        
        if (data?.metadata?.formConfig) {
          // Merge CMS config with default config to include sessionDates and other missing fields
          let availableDates = data.metadata.formConfig.availableDates || defaultConfig?.availableDates;
          
          // Backward compatibility: Generate availableDates from sessionDates if not present
          if (!availableDates && data.metadata.formConfig.sessionDates?.startDate) {
            const start = new Date(data.metadata.formConfig.sessionDates.startDate);
            const end = data.metadata.formConfig.sessionDates.endDate 
              ? new Date(data.metadata.formConfig.sessionDates.endDate) 
              : start;
            
            availableDates = [];
            const current = new Date(start);
            while (current <= end) {
              availableDates.push(format(current, 'yyyy-MM-dd'));
              current.setDate(current.getDate() + 1);
            }
          }
          
          const mergedConfig = {
            ...defaultConfig,
            ...data.metadata.formConfig,
            availableDates,
            sessionDates: data.metadata.formConfig.sessionDates || defaultConfig?.sessionDates,
            ageGroups: data.metadata.formConfig.ageGroups || defaultConfig?.ageGroups
          };
          setConfig(mergedConfig);
        } else {
          // Use default config if CMS data not found
          setConfig(defaultConfig || null);
        }
      } catch (err) {
        console.error('Error fetching camp form config:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch config');
        // Fallback to default
        const defaultConfig = defaultCampFormConfigs[formType];
        setConfig(defaultConfig || null);
      } finally {
        setIsLoading(false);
      }
    };

    if (formType) {
      fetchConfig();
    }
  }, [formType]);

  return { config, isLoading, error };
};
