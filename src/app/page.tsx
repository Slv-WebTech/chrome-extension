import { Dashboard } from '@/components/dashboard/Dashboard';
import { HydrationGate } from '@/components/Providers';

export default function NewTabPage() {
  return (
    <HydrationGate fallback={<div aria-hidden className="bg-layer fixed inset-0" />}>
      <Dashboard />
    </HydrationGate>
  );
}
