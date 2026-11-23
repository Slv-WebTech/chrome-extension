import { HydrationGate } from '@/components/Providers';
import { SettingsPage } from '@/components/settings/SettingsPage';

export const metadata = { title: 'Momentum — Settings' };

export default function SettingsRoute() {
  return (
    <HydrationGate fallback={<div aria-hidden className="bg-layer fixed inset-0" />}>
      <SettingsPage />
    </HydrationGate>
  );
}
