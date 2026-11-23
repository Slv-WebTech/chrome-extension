import { HydrationGate } from '@/components/Providers';
import { PopupApp } from '@/components/popup/PopupApp';

export const metadata = { title: 'Momentum' };

export default function PopupPage() {
  return (
    <HydrationGate fallback={<div aria-hidden className="bg-layer fixed inset-0" />}>
      <PopupApp />
    </HydrationGate>
  );
}
