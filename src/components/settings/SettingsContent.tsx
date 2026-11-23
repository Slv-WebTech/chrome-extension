'use client';

import { Download, Eye, EyeOff, Keyboard, MapPin, Trash2, Upload } from 'lucide-react';
import { type ChangeEvent, type ReactNode, useRef, useState } from 'react';
import { toast } from 'sonner';
import { BACKGROUND_PRESETS, fileToBackgroundDataUrl, probeImage } from '@/lib/backgrounds';
import { backupFilename, buildBackup, downloadJson, parseBackup, type ParsedBackup } from '@/lib/backup';
import { hasNotificationPermission, removeNotificationPermission, requestNotificationPermission } from '@/lib/chrome';
import { CUSTOM_ENGINE_ID, SEARCH_ENGINES, isValidCustomTemplate } from '@/lib/search';
import { storageRemove, storageSet } from '@/lib/storage';
import { clamp, cn, normalizeHttpUrl } from '@/lib/utils';
import { useAppDispatch, useAppSelector, } from '@/store/hooks';
import { hydrate } from '@/store';
import { UPLOAD_KEY } from '@/store/persistence';
import { initialFocusState } from '@/store/slices/focus';
import { initialLinksState } from '@/store/slices/links';
import { initialNotesState } from '@/store/slices/notes';
import { clearSecrets, initialSecretsState, setSecrets } from '@/store/slices/secrets';
import {
  ACCENTS,
  type Accent,
  defaultSettings,
  setRecentSearches,
  updateBackground,
  updateFocusPrefs,
  updateQuoteSettings,
  updateSearchSettings,
  updateSettings,
  updateWeatherSettings,
  updateWidgets,
  type SettingsState,
} from '@/store/slices/settings';
import { initialTasksState } from '@/store/slices/tasks';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Button, Field, Kbd, Segmented, Select, Switch, TextInput } from '../ui/primitives';
import { CitySearch, placeLabel } from '../widgets/CitySearch';
import { REFRESH_BACKGROUND_EVENT } from '../dashboard/Background';

const ACCENT_SWATCH: Record<Accent, string> = {
  indigo: '#6366f1',
  violet: '#8b5cf6',
  cyan: '#06b6d4',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#fbbf24',
};

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-h`} className="glass-inner rounded-2xl p-4 sm:p-5">
      <h2 id={`${id}-h`} className="text-base font-semibold text-fg">
        {title}
      </h2>
      {description && <p className="mt-0.5 text-xs text-fg-muted">{description}</p>}
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

function NumberField({ label, value, min, max, unit, onChange }: { label: string; value: number; min: number; max: number; unit?: string; onChange: (n: number) => void }) {
  return (
    <Field label={label}>
      {(id) => (
        <div className="flex items-center gap-2">
          <TextInput
            id={id}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={value}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) onChange(clamp(Math.round(n), min, max));
            }}
            className="w-24"
          />
          {unit && <span className="text-sm text-fg-muted">{unit}</span>}
        </div>
      )}
    </Field>
  );
}

function SecretField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint: ReactNode }) {
  const [shown, setShown] = useState(false);
  return (
    <Field label={label} hint={undefined}>
      {(id) => (
        <>
          <div className="flex gap-2">
            <TextInput
              id={id}
              type={shown ? 'text' : 'password'}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder="Not set"
              className="font-mono"
            />
            <Button onClick={() => setShown((v) => !v)} aria-label={shown ? `Hide ${label}` : `Show ${label}`} aria-pressed={shown} className="px-3">
              {shown ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </Button>
          </div>
          <p className="text-xs text-fg-muted">{hint}</p>
        </>
      )}
    </Field>
  );
}

export function SettingsContent({ onOpenShortcuts }: { onOpenShortcuts?: () => void }) {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s);
  const { settings, secrets } = state;
  const [keys, setKeys] = useState(secrets);
  const [customBg, setCustomBg] = useState(settings.background.customUrl);
  const [checkingBg, setCheckingBg] = useState(false);
  const [includeSecrets, setIncludeSecrets] = useState(false);
  const [pending, setPending] = useState<Extract<ParsedBackup, { ok: true }> | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const patch = (p: Parameters<typeof updateSettings>[0]) => dispatch(updateSettings(p));
  const keysDirty = keys.openWeatherKey !== secrets.openWeatherKey || keys.unsplashKey !== secrets.unsplashKey || keys.pexelsKey !== secrets.pexelsKey;
  const customTemplateInvalid = settings.search.customUrl !== '' && !isValidCustomTemplate(settings.search.customUrl);

  const applyCustomBg = async () => {
    const url = normalizeHttpUrl(customBg);
    if (!url) return toast.error('Enter a valid image address (https://…).');
    setCheckingBg(true);
    const ok = await probeImage(url);
    setCheckingBg(false);
    if (!ok) return toast.error('That address did not load as an image.');
    dispatch(updateBackground({ kind: 'custom', customUrl: url }));
    toast.success('Background updated.');
  };

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await fileToBackgroundDataUrl(file);
      await storageSet(UPLOAD_KEY, dataUrl);
      dispatch(updateBackground({ kind: 'upload' }));
      window.dispatchEvent(new Event(REFRESH_BACKGROUND_EVENT));
      toast.success('Background image saved on this device.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not use that image.');
    }
  };

  const onImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const parsed = parseBackup(await file.text());
    if (!parsed.ok) return toast.error(parsed.error);
    setPending(parsed);
  };

  const applyImport = () => {
    if (!pending) return;
    dispatch(hydrate({ ...pending.data, ...(pending.data.secrets ? { secrets: pending.data.secrets } : {}) }));
    if (pending.data.secrets) setKeys(pending.data.secrets);
    toast.success('Backup imported.');
    setPending(null);
  };

  const resetAll = async () => {
    dispatch(hydrate({ settings: defaultSettings, tasks: initialTasksState, links: initialLinksState, notes: initialNotesState, focus: initialFocusState, secrets: initialSecretsState }));
    dispatch(clearSecrets());
    setKeys(initialSecretsState);
    await storageRemove(UPLOAD_KEY);
    toast.success('All data was reset.');
  };

  const toggleNotify = async (value: boolean) => {
    if (!value) {
      dispatch(updateFocusPrefs({ notify: false }));
      await removeNotificationPermission();
      return;
    }
    if ((await hasNotificationPermission()) || (await requestNotificationPermission())) {
      dispatch(updateFocusPrefs({ notify: true }));
    } else {
      toast.error('Notifications are only available in the installed extension and need your permission.');
    }
  };

  const widgetList: Array<[keyof SettingsState['widgets'], string]> = [
    ['search', 'Search bar'],
    ['links', 'Quick links'],
    ['weather', 'Weather'],
    ['tasks', 'Tasks'],
    ['focus', 'Focus timer'],
    ['notes', 'Scratchpad'],
    ['quote', 'Quote of the day'],
  ];

  return (
    <div className="space-y-4">
      <Section id="general" title="General">
        <Field label="Your name" hint="Used in the greeting. Stored only on this device.">
          {(id) => <TextInput id={id} value={settings.name} maxLength={40} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. Vivek" autoComplete="given-name" />}
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium text-fg">Theme</span>
          <Segmented
            label="Theme"
            value={settings.theme}
            onChange={(theme) => patch({ theme })}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-fg">Accent colour</legend>
          <div role="radiogroup" aria-label="Accent colour" className="flex flex-wrap gap-2.5">
            {ACCENTS.map((accent) => (
              <label key={accent} className="relative cursor-pointer">
                <input type="radio" name="accent" value={accent} checked={settings.accent === accent} onChange={() => patch({ accent })} className="peer sr-only" aria-label={accent} />
                <span
                  className="block size-8 rounded-full border-2 border-transparent ring-offset-2 ring-offset-transparent transition peer-checked:border-fg peer-checked:ring-2 peer-checked:ring-fg/30 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-accent-text"
                  style={{ background: ACCENT_SWATCH[accent] }}
                />
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium text-fg">Time format</span>
          <Segmented
            label="Time format"
            value={settings.hour12 ? '12' : '24'}
            onChange={(v) => patch({ hour12: v === '12' })}
            options={[
              { value: '24', label: '24-hour' },
              { value: '12', label: '12-hour' },
            ]}
          />
        </div>
        <Switch label="Show seconds" checked={settings.showSeconds} onChange={(showSeconds) => patch({ showSeconds })} />
        <Switch label="Show greeting" checked={settings.showGreeting} onChange={(showGreeting) => patch({ showGreeting })} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium text-fg">Animations</span>
          <Segmented
            label="Animations"
            value={settings.reduceMotion}
            onChange={(reduceMotion) => patch({ reduceMotion })}
            options={[
              { value: 'system', label: 'Match system' },
              { value: 'off', label: 'Full' },
              { value: 'on', label: 'Reduced' },
            ]}
          />
        </div>
        <Switch
          label="Single-key shortcuts"
          description="Press / to search, n for a new task, f to start the timer… Turn off if they get in the way of assistive technology."
          checked={settings.singleKeyShortcuts}
          onChange={(singleKeyShortcuts) => patch({ singleKeyShortcuts })}
        />
        {onOpenShortcuts && (
          <Button onClick={onOpenShortcuts} size="sm">
            <Keyboard className="size-4" aria-hidden /> View keyboard shortcuts
          </Button>
        )}
      </Section>

      <Section id="background" title="Background" description="Gradients work offline. Photos need your own free API key (see API keys).">
        <div role="radiogroup" aria-label="Gradient background" className="grid grid-cols-4 gap-2">
          {BACKGROUND_PRESETS.map((preset) => {
            const active = settings.background.kind === 'preset' && settings.background.preset === preset.id;
            return (
              <label key={preset.id} className="relative cursor-pointer">
                <input type="radio" name="bg-preset" className="peer sr-only" checked={active} onChange={() => dispatch(updateBackground({ kind: 'preset', preset: preset.id }))} aria-label={preset.name} />
                <span className="block h-14 rounded-xl border border-line transition peer-checked:ring-2 peer-checked:ring-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-text" style={{ background: preset.dark }} />
                <span className="mt-1 block text-center text-[0.7rem] text-fg-muted">{preset.name}</span>
              </label>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium text-fg">Photo source</span>
          <Segmented
            label="Photo source"
            value={settings.background.kind === 'preset' ? ('none' as const) : settings.background.kind}
            onChange={(kind) => kind !== 'none' && dispatch(updateBackground({ kind }))}
            options={[
              { value: 'none' as const, label: 'None', ariaLabel: 'Gradient only' },
              { value: 'unsplash' as const, label: 'Unsplash' },
              { value: 'pexels' as const, label: 'Pexels' },
              { value: 'custom' as const, label: 'URL' },
              { value: 'upload' as const, label: 'Upload' },
            ]}
          />
        </div>

        {(settings.background.kind === 'unsplash' || settings.background.kind === 'pexels') && (
          <>
            <Field label="Photo topic" hint="A new photo is picked once a day.">
              {(id) => <TextInput id={id} value={settings.background.query} maxLength={60} onChange={(e) => dispatch(updateBackground({ query: e.target.value }))} />}
            </Field>
            {!(settings.background.kind === 'unsplash' ? secrets.unsplashKey : secrets.pexelsKey) && (
              <p role="status" className="text-sm text-danger">
                No {settings.background.kind === 'unsplash' ? 'Unsplash' : 'Pexels'} key saved yet — add one under API keys. Until then the gradient is shown.
              </p>
            )}
            <Button size="sm" onClick={() => window.dispatchEvent(new Event(REFRESH_BACKGROUND_EVENT))}>
              New photo now
            </Button>
          </>
        )}
        {settings.background.kind === 'custom' && (
          <Field label="Image address">
            {(id) => (
              <div className="flex gap-2">
                <TextInput id={id} value={customBg} onChange={(e) => setCustomBg(e.target.value)} placeholder="https://example.com/wallpaper.jpg" inputMode="url" />
                <Button onClick={() => void applyCustomBg()} disabled={checkingBg}>
                  {checkingBg ? 'Checking…' : 'Apply'}
                </Button>
              </div>
            )}
          </Field>
        )}
        {settings.background.kind === 'upload' && (
          <div>
            <input ref={uploadRef} type="file" accept="image/*" className="sr-only" onChange={(e) => void onUpload(e)} aria-label="Choose a background image" />
            <Button onClick={() => uploadRef.current?.click()}>
              <Upload className="size-4" aria-hidden /> Choose image…
            </Button>
            <p className="mt-1.5 text-xs text-fg-muted">The image is resized and kept on this device only.</p>
          </div>
        )}

        <Field label={`Overlay strength: ${settings.background.dim}%`} hint="Raises text contrast over bright images.">
          {(id) => <input id={id} type="range" min={0} max={80} step={5} value={settings.background.dim} onChange={(e) => dispatch(updateBackground({ dim: Number(e.target.value) }))} />}
        </Field>
        <Field label={`Blur: ${settings.background.blur}px`}>
          {(id) => <input id={id} type="range" min={0} max={16} step={1} value={settings.background.blur} onChange={(e) => dispatch(updateBackground({ blur: Number(e.target.value) }))} />}
        </Field>
      </Section>

      <Section id="search" title="Search">
        <Field label="Default search engine" hint="Tip: type !yt, !gh, !w… before a query to use another engine once.">
          {(id) => (
            <Select id={id} value={settings.search.engine} onChange={(e) => dispatch(updateSearchSettings({ engine: e.target.value }))}>
              {SEARCH_ENGINES.map((engine) => (
                <option key={engine.id} value={engine.id}>
                  {engine.name}
                </option>
              ))}
              <option value={CUSTOM_ENGINE_ID} disabled={!isValidCustomTemplate(settings.search.customUrl)}>
                Custom (set a template below)
              </option>
            </Select>
          )}
        </Field>
        <Field label="Custom search URL" hint="Use https and %s where the query goes, e.g. https://example.com/search?q=%s">
          {(id) => (
            <TextInput
              id={id}
              value={settings.search.customUrl}
              onChange={(e) => dispatch(updateSearchSettings({ customUrl: e.target.value.slice(0, 300) }))}
              placeholder="https://example.com/search?q=%s"
              aria-invalid={customTemplateInvalid || undefined}
              className={cn(customTemplateInvalid && 'border-danger')}
            />
          )}
        </Field>
        {customTemplateInvalid && <p className="text-xs text-danger">The template must start with https:// and contain %s.</p>}
        <Switch label="Remember recent searches" description="Kept on this device only." checked={settings.search.rememberRecent} onChange={(rememberRecent) => dispatch(updateSearchSettings({ rememberRecent }))} />
        {settings.search.recent.length > 0 && (
          <Button size="sm" onClick={() => dispatch(setRecentSearches([]))}>
            Clear {settings.search.recent.length} recent search{settings.search.recent.length === 1 ? '' : 'es'}
          </Button>
        )}
      </Section>

      <Section id="weather" title="Weather">
        <Field label="Weather provider" hint="Open-Meteo needs no key. OpenWeather needs your own key (see API keys).">
          {(id) => (
            <Select id={id} value={settings.weather.provider} onChange={(e) => dispatch(updateWeatherSettings({ provider: e.target.value as SettingsState['weather']['provider'] }))}>
              <option value="open-meteo">Open-Meteo (no key)</option>
              <option value="openweather">OpenWeather (your key)</option>
            </Select>
          )}
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium text-fg">Temperature</span>
          <Segmented
            label="Temperature unit"
            value={settings.weather.unit}
            onChange={(unit) => dispatch(updateWeatherSettings({ unit }))}
            options={[
              { value: 'c', label: '°C' },
              { value: 'f', label: '°F' },
            ]}
          />
        </div>
        <Field label="Wind speed unit">
          {(id) => (
            <Select id={id} value={settings.weather.windUnit} onChange={(e) => dispatch(updateWeatherSettings({ windUnit: e.target.value as SettingsState['weather']['windUnit'] }))}>
              <option value="kmh">km/h</option>
              <option value="mph">mph</option>
              <option value="ms">m/s</option>
            </Select>
          )}
        </Field>
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-fg">
            <MapPin className="size-4 text-accent-text" aria-hidden /> Location:{' '}
            <span className="font-normal text-fg-muted">{settings.weather.location ? placeLabel(settings.weather.location) : 'not set'}</span>
          </p>
          <CitySearch />
          {settings.weather.location && (
            <Button size="sm" className="mt-2" onClick={() => dispatch(updateWeatherSettings({ location: null }))}>
              Forget location
            </Button>
          )}
        </div>
      </Section>

      <Section id="focus" title="Focus timer">
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Focus" value={settings.focus.focusMin} min={1} max={180} unit="min" onChange={(focusMin) => dispatch(updateFocusPrefs({ focusMin }))} />
          <NumberField label="Short break" value={settings.focus.shortMin} min={1} max={60} unit="min" onChange={(shortMin) => dispatch(updateFocusPrefs({ shortMin }))} />
          <NumberField label="Long break" value={settings.focus.longMin} min={1} max={120} unit="min" onChange={(longMin) => dispatch(updateFocusPrefs({ longMin }))} />
          <NumberField label="Long break every" value={settings.focus.longEvery} min={2} max={12} unit="sessions" onChange={(longEvery) => dispatch(updateFocusPrefs({ longEvery }))} />
        </div>
        <Switch label="Start the next phase automatically" checked={settings.focus.autoStart} onChange={(autoStart) => dispatch(updateFocusPrefs({ autoStart }))} />
        <Switch label="Play a chime" checked={settings.focus.sound} onChange={(sound) => dispatch(updateFocusPrefs({ sound }))} />
        <Switch
          label="Desktop notification when a phase ends"
          description="Works even if the dashboard tab is closed. Chrome will ask for the optional “notifications” permission."
          checked={settings.focus.notify}
          onChange={(v) => void toggleNotify(v)}
        />
      </Section>

      <Section id="widgets" title="Widgets & quotes" description="Hide anything you do not use — the layout reflows automatically.">
        {widgetList.map(([key, label]) => (
          <Switch key={key} label={label} checked={settings.widgets[key]} onChange={(value) => dispatch(updateWidgets({ [key]: value }))} />
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <span className="text-sm font-medium text-fg">Quote source</span>
          <Segmented
            label="Quote source"
            value={settings.quote.source}
            onChange={(source) => dispatch(updateQuoteSettings({ source }))}
            options={[
              { value: 'bundled', label: 'Built-in (offline)' },
              { value: 'online', label: 'Online' },
            ]}
          />
        </div>
      </Section>

      <Section id="keys" title="API keys (optional)" description="Everything works without keys. Keys unlock extra providers, are stored only in chrome.storage.local on this device, and are never synced or exported unless you tick the box.">
        <SecretField label="OpenWeather API key" value={keys.openWeatherKey} onChange={(openWeatherKey) => setKeys((k) => ({ ...k, openWeatherKey }))} hint={<>Free key at openweathermap.org/api. Used only if you choose the OpenWeather provider.</>} />
        <SecretField label="Unsplash access key" value={keys.unsplashKey} onChange={(unsplashKey) => setKeys((k) => ({ ...k, unsplashKey }))} hint={<>Free key at unsplash.com/developers — for photo backgrounds.</>} />
        <SecretField label="Pexels API key" value={keys.pexelsKey} onChange={(pexelsKey) => setKeys((k) => ({ ...k, pexelsKey }))} hint={<>Free key at pexels.com/api — for photo backgrounds.</>} />
        <div className="flex gap-2">
          <Button
            variant="primary"
            disabled={!keysDirty}
            onClick={() => {
              dispatch(setSecrets(keys));
              toast.success('API keys saved on this device.');
            }}
          >
            Save keys
          </Button>
          <Button
            onClick={() => {
              dispatch(clearSecrets());
              setKeys(initialSecretsState);
            }}
            disabled={!secrets.openWeatherKey && !secrets.unsplashKey && !secrets.pexelsKey && !keysDirty}
          >
            Remove all keys
          </Button>
        </div>
      </Section>

      <Section id="data" title="Backup & privacy" description="Move your tasks, links, notes and settings between browsers with a JSON file.">
        <Switch label="Include API keys in the export" description="Off by default. Keep exported files private if you turn this on." checked={includeSecrets} onChange={setIncludeSecrets} />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() => {
              downloadJson(backupFilename(), buildBackup(state, { includeSecrets }));
              toast.success('Backup downloaded.');
            }}
          >
            <Download className="size-4" aria-hidden /> Export backup
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => void onImportFile(e)} aria-label="Choose a backup file to import" />
          <Button onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" aria-hidden /> Import backup…
          </Button>
          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            <Trash2 className="size-4" aria-hidden /> Reset everything
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-fg-muted">
          Privacy: no account, no analytics, no tracking. Data lives in your browser. The only network calls are the ones you use: weather (Open-Meteo, or OpenWeather with your key), city search, optional photos and optional online quotes. Search and shortcuts open normally in your browser.
        </p>
      </Section>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title="Replace your data with this backup?"
        description={
          pending
            ? `This will replace your current tasks, shortcuts, notes and settings with ${pending.counts.tasks} task(s) and ${pending.counts.links} shortcut(s)${pending.exportedAt ? ` exported on ${pending.exportedAt.slice(0, 10)}` : ''}. This cannot be undone.`
            : ''
        }
        confirmLabel="Import and replace"
        onConfirm={applyImport}
        danger
      />
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset everything?"
        description="This deletes all tasks, notes, shortcuts, settings and saved API keys from this browser. Export a backup first if you might need them."
        confirmLabel="Delete everything"
        onConfirm={() => void resetAll()}
        danger
      />
      <p className="px-1 pb-2 text-center text-xs text-fg-muted">
        Momentum Dashboard v{process.env.NEXT_PUBLIC_APP_VERSION ?? '2.0.0'} · Open the command palette with <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>
      </p>
    </div>
  );
}
