try {
  importScripts(
    './scripts/events.js',
    './scripts/tabs.js',
    './scripts/alarm.js',
    "./scripts/screen-blocker.js",
    './scripts/utils.js',
    "./scripts/timer.js"
  );
} catch (err) {
  console.error(err.message, err.stack);
}
