import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CameraOff } from 'lucide-react';
import { CampChild } from '@/types/campRegistration';

export const AllergyCell: React.FC<{ children?: CampChild[]; child?: CampChild }> = ({ children, child }) => {
  const list = child ? [child] : (children || []);
  const notes = list
    .filter(c => c?.specialNeeds && c.specialNeeds.trim() && c.specialNeeds !== 'Accompanied by Nanny')
    .map(c => (child ? c.specialNeeds!.trim() : `${c.childName}: ${c.specialNeeds!.trim()}`));
  if (notes.length === 0) return <span className="text-xs text-muted-foreground">None</span>;
  const text = notes.join('; ');
  return (
    <Badge variant="destructive" className="text-xs max-w-[180px] truncate block w-fit" title={text}>
      {text}
    </Badge>
  );
};

/** True when the parent explicitly opted out of photography/video (consent_given === false). */
export const isPhotoOptedOut = (consent?: boolean | null): boolean => consent === false;

/** Plain-text label for CSV/PDF exports. */
export const mediaConsentLabel = (consent?: boolean | null): string =>
  consent === false ? 'No Photos (opted out)' : consent ? 'Yes' : 'No';

export const MediaConsentCell: React.FC<{ consent?: boolean | null }> = ({ consent }) => {
  if (consent === false) {
    return (
      <Badge
        variant="destructive"
        className="text-xs whitespace-nowrap w-fit gap-1"
        title="Parent opted out — do not photograph or record this child"
      >
        <CameraOff className="h-3 w-3 flex-shrink-0" />
        No Photos
      </Badge>
    );
  }
  return (
    <Badge variant={consent ? 'default' : 'secondary'} className="text-xs whitespace-nowrap">
      {consent ? 'Yes' : 'No'}
    </Badge>
  );
};
