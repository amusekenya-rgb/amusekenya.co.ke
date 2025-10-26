import { useState, useEffect } from 'react';
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
        
        if (data?.metadata?.formConfig) {
          setConfig(data.metadata.formConfig);
        } else {
          // Use default config if CMS data not found
          const defaultConfig = defaultCampFormConfigs[formType];
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
