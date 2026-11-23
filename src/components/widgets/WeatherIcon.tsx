import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Moon, Sun } from 'lucide-react';
import type { Condition } from '@/lib/weather';

export function WeatherIcon({ condition, isDay = true, className }: { condition: Condition; isDay?: boolean; className?: string }) {
  const props = { className, 'aria-hidden': true as const };
  switch (condition) {
    case 'clear':
      return isDay ? <Sun {...props} /> : <Moon {...props} />;
    case 'partly':
      return isDay ? <CloudSun {...props} /> : <CloudMoon {...props} />;
    case 'fog':
      return <CloudFog {...props} />;
    case 'drizzle':
      return <CloudDrizzle {...props} />;
    case 'rain':
      return <CloudRain {...props} />;
    case 'snow':
      return <CloudSnow {...props} />;
    case 'thunder':
      return <CloudLightning {...props} />;
    default:
      return <Cloud {...props} />;
  }
}
