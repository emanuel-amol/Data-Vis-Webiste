const CACHE_NAME = 'road-safety-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/pages/time-trends.html',
  '/pages/jurisdictions.html', 
  '/pages/age-analysis.html',
  '/pages/drugs-alcohol.html',
  '/pages/comparative-analysis.html',
  '/pages/insights.html',
  '/pages/data-story.html',
  '/pages/about.html',
  '/css/enhanced-responsive.css',
  '/css/storytelling.css',
  '/css/advanced-interactions.css',
  '/css/data-story-enhancements.css',
  '/js/script.js',
  '/js/dataLoader.js',
  '/js/utils/statistics.js',
  '/js/utils/animations.js',
  '/data/police_enforcement_2023_fines_20240920.csv',
  '/images/logo.png',
  'https://d3js.org/d3.v7.min.js'
];
// Install event
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Activate event
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});