/*
 * Momentum Dashboard — Manifest V3 service worker.
 *
 * Deliberately tiny: it only turns the focus-timer alarm (created by the dashboard or
 * the popup) into a desktop notification, so a finished session is announced even when
 * no dashboard tab is open. No network access, no remote code, no data collection.
 */
const ALARM_PREFIX = 'momentum-timer:';
const MESSAGES = {
  focus: { title: 'Focus session complete', message: 'Nice work. Time for a break.' },
  short: { title: 'Break is over', message: 'Ready for the next focus session?' },
  long: { title: 'Long break is over', message: 'Ready for the next focus session?' },
};

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith(ALARM_PREFIX)) return;
  const mode = decodeURIComponent(alarm.name.slice(ALARM_PREFIX.length));
  const content = MESSAGES[mode];
  if (!content || !chrome.notifications) return; // notifications is an optional permission

  try {
    await chrome.notifications.create(`momentum-${Date.now()}`, {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: content.title,
      message: content.message,
      priority: 1,
    });
  } catch (error) {
    console.error('Could not show notification', error);
  }
});

// Clicking a notification opens the dashboard.
if (chrome.notifications) {
  chrome.notifications.onClicked.addListener((id) => {
    chrome.notifications.clear(id);
    chrome.tabs.create({});
  });
}
