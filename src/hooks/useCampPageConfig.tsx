import { useState, useEffect } from 'react';
import { cmsService } from '@/services/cmsService';
import { defaultCampPageConfigs } from '@/utils/defaultCampConfigs';

export interface CampPageConfig {
  title: string;
  description: string;
  heroImage: string;
  duration: string;
  ageGroup: string;
  location: string;
  time: string;
  highlights: string[];
}

export const useCampPageConfig = (campType: string) => {
  const [config, setConfig] = useState<CampPageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`[CampPageConfig] Fetching config for: ${campType}`);
        const data = await cmsService.getCampPageConfig(campType);
        
        console.log(`[CampPageConfig] Data received:`, data);
        
        if (data?.metadata?.pageConfig) {
          console.log(`[CampPageConfig] Using CMS config for ${campType}`);
          setConfig(data.metadata.pageConfig);
        } else {
          console.warn(`[CampPageConfig] No CMS data found for ${campType}, using default`);
          const defaultConfig = defaultCampPageConfigs[campType];
          setConfig(defaultConfig || null);
        }
      } catch (err) {
        console.error(`[CampPageConfig] Error fetching ${campType}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to fetch config');
        const defaultConfig = defaultCampPageConfigs[campType];
        setConfig(defaultConfig || null);
      } finally {
        setIsLoading(false);
      }
    };

    if (campType) {
      fetchConfig();
    }
  }, [campType]);

  // Add refresh function that can be called externally
  const refresh = () => {
    if (campType) {
      setConfig(null);
      setIsLoading(true);
    }
  };

  return { config, isLoading, error };
};
