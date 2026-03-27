import { useState, useEffect } from 'react';
import { QuoteSection } from './src/components/quote-section';
import { WeatherWidget } from './src/components/weather-widget';
import { TodoList } from './src/components/todo-list';
import { SettingsModal } from './src/components/settings-modal';
import { DateTimeFooter } from './src/components/date-time-footer';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [temperatureUnit, setTemperatureUnit] = useState<'celsius' | 'fahrenheit'>('celsius');

  // Apply dark/light theme to body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1426604966848-d7adac402bff?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isDarkMode={isDarkMode}
        onThemeToggle={setIsDarkMode}
        temperatureUnit={temperatureUnit}
        onTemperatureUnitChange={setTemperatureUnit}
      />

      {/* Main Content Grid */}
      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 p-4 lg:p-6 pb-24">
        {/* Left Sidebar - Todo List */}
        <div className="order-2 lg:order-1 lg:col-span-3 flex items-start justify-center lg:pt-20">
          <div className="w-full max-w-sm">
            <TodoList />
          </div>
        </div>

        {/* Center Section - Quote */}
        <div className="order-1 lg:order-2 lg:col-span-6 flex items-center justify-center min-h-[50vh] lg:min-h-0">
          <QuoteSection />
        </div>

        {/* Right Sidebar - Weather */}
        <div className="order-3 lg:order-3 lg:col-span-3 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <WeatherWidget temperatureUnit={temperatureUnit} />
          </div>
        </div>
      </div>

      {/* Date/Time Footer */}
      <DateTimeFooter />
    </div>
  );
}