import { WeatherError } from './types';

/** fetch + JSON with a timeout; maps failures to typed WeatherErrors. */
export async function fetchJson<T>(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const { timeoutMs = 10_000, signal, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  try {
    const response = await fetch(url, { ...rest, signal: controller.signal });
    if (response.status === 401 || response.status === 403) {
      throw new WeatherError('The API key was rejected.', 'auth');
    }
    if (response.status === 404) throw new WeatherError('Not found.', 'not-found');
    if (!response.ok) throw new WeatherError(`Request failed (${response.status}).`, 'unknown');
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof WeatherError) throw error;
    if (signal?.aborted) throw error;
    throw new WeatherError(
      controller.signal.aborted ? 'The request timed out.' : 'Could not reach the weather service.',
      'network',
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}
