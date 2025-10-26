import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const PaymentGatewayPlaceholder: React.FC = () => {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Payment Integration Coming Soon</AlertTitle>
      <AlertDescription>
        Online payment is currently being integrated. For now, you can register and pay at the camp.
        You will receive an invoice with payment instructions via email.
      </AlertDescription>
    </Alert>
  );
};
