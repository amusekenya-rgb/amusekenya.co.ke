import { useState, useEffect } from 'react';
import { cmsService } from '@/services/cmsService';

export interface LittleForestFormConfig {
  pricing: {
    sessionRate: number;
    currency: string;
  };
  fields: {
    parentName: { label: string; placeholder: string; required: boolean };
    childName: { label: string; placeholder: string; required: boolean };
    childAge: { label: string; placeholder: string; required: boolean };
    emergencyContact: { label: string; placeholder: string; required: boolean };
    email: { label: string; placeholder: string; required: boolean };
    phone: { label: string; placeholder: string; required: boolean };
    nannyOption: { label: string };
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
  sessionSchedule?: {
    Monday?: string; // YYYY-MM-DD format
    Friday?: string; // YYYY-MM-DD format
  };
  dayOptions: Array<{
    value: string;
    label: string;
    date?: string;
  }>;
  ageOptions: Array<{
    value: string;
    label: string;
  }>;
}

export const defaultLittleForestConfig: LittleForestFormConfig = {
  pricing: {
    sessionRate: 1500,
    currency: 'KES'
  },
  fields: {
    parentName: { label: 'Parent/Guardian Name', placeholder: 'Enter your full name', required: true },
    childName: { label: "Child's Full Name", placeholder: "Enter child's full name", required: true },
    childAge: { label: 'Age Range', placeholder: 'Select age range', required: true },
    emergencyContact: { label: 'Emergency Contact Name & Phone', placeholder: 'Enter emergency contact details', required: true },
    email: { label: 'Email Address', placeholder: 'your.email@example.com', required: true },
    phone: { label: 'Phone Number', placeholder: '+254 XXX XXX XXX', required: true },
    nannyOption: { label: 'Is the child accompanied with a Nanny? (Optional)' }
  },
  buttons: {
    registerOnly: 'Register Only',
    registerAndPay: 'Register & Pay Now',
    addChild: 'Add Another Child',
    removeChild: 'Remove'
  },
  messages: {
    registrationSuccess: "Registration submitted successfully! We'll contact you shortly.",
    registrationError: 'Failed to submit registration. Please try again.',
    chooseOption: 'Choose your registration option:',
    paymentComingSoon: 'Payment integration coming soon. Both options will complete your registration.'
  },
  sessionSchedule: {
    Monday: '2025-06-02',
    Friday: '2025-06-06'
  },
  dayOptions: [
    { value: 'Monday', label: 'Monday' },
    { value: 'Friday', label: 'Friday' }
  ],
  ageOptions: [
    { value: '1-2', label: '1-2 years' },
    { value: '2-3', label: '2-3 years' },
    { value: '3-below', label: '3 years and below' }
  ]
};

export const useLittleForestConfig = () => {
  const [config, setConfig] = useState<LittleForestFormConfig>(defaultLittleForestConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await cmsService.getContentBySlug('little-forest-form');
        
        if (data?.metadata?.formConfig) {
          // Merge CMS config with default config to include sessionSchedule if missing
          const mergedConfig = {
            ...defaultLittleForestConfig,
            ...data.metadata.formConfig,
            // Ensure sessionSchedule from default is used if not in CMS
            sessionSchedule: data.metadata.formConfig.sessionSchedule || defaultLittleForestConfig.sessionSchedule,
            // Ensure dayOptions from default is used if not in CMS
            dayOptions: data.metadata.formConfig.dayOptions || defaultLittleForestConfig.dayOptions,
            // Ensure ageOptions from default is used if not in CMS
            ageOptions: data.metadata.formConfig.ageOptions || defaultLittleForestConfig.ageOptions
          };
          setConfig(mergedConfig);
        } else {
          setConfig(defaultLittleForestConfig);
        }
      } catch (err) {
        console.error('Error fetching Little Forest config:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch config');
        setConfig(defaultLittleForestConfig);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, isLoading, error };
};
