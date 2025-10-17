/**
 * Test script to verify middleware anti-scraping protection
 *
 * This script tests various scenarios:
 * 1. Normal browser request (should pass)
 * 2. Bot user agent (should be blocked with 403)
 * 3. Missing user agent (should be blocked with 403)
 * 4. Missing browser headers (should be blocked with 403)
 * 5. Rate limiting (should be blocked with 429)
 */

const testUrl = 'http://localhost:3001/en/directory';

// Test 1: Normal browser request
console.log('\n🔍 Test 1: Normal browser request');
fetch(testUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
  }
})
  .then(res => {
    console.log(`✅ Status: ${res.status} ${res.statusText}`);
    if (res.status === 200) {
      console.log('✅ Normal browser request PASSED');
    } else {
      console.log('❌ Normal browser request FAILED');
    }
  })
  .catch(err => console.error('❌ Error:', err.message));

// Test 2: Bot user agent (curl)
setTimeout(() => {
  console.log('\n🔍 Test 2: Bot user agent (curl)');
  fetch(testUrl, {
    headers: {
      'User-Agent': 'curl/7.68.0',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip',
    }
  })
    .then(res => {
      console.log(`Status: ${res.status} ${res.statusText}`);
      if (res.status === 403) {
        console.log('✅ Bot detection PASSED - curl blocked with 403');
      } else {
        console.log('❌ Bot detection FAILED - curl was NOT blocked');
      }
      return res.text();
    })
    .then(text => console.log('Response:', text.substring(0, 100)))
    .catch(err => console.error('❌ Error:', err.message));
}, 1000);

// Test 3: Python scraper user agent
setTimeout(() => {
  console.log('\n🔍 Test 3: Python scraper user agent');
  fetch(testUrl, {
    headers: {
      'User-Agent': 'python-requests/2.31.0',
      'Accept': '*/*',
      'Accept-Language': 'en-US',
      'Accept-Encoding': 'gzip',
    }
  })
    .then(res => {
      console.log(`Status: ${res.status} ${res.statusText}`);
      if (res.status === 403) {
        console.log('✅ Bot detection PASSED - Python blocked with 403');
      } else {
        console.log('❌ Bot detection FAILED - Python was NOT blocked');
      }
      return res.text();
    })
    .then(text => console.log('Response:', text.substring(0, 100)))
    .catch(err => console.error('❌ Error:', err.message));
}, 2000);

// Test 4: Missing user agent
setTimeout(() => {
  console.log('\n🔍 Test 4: Missing user agent');
  fetch(testUrl, {
    headers: {
      'Accept': 'text/html',
      'Accept-Language': 'en-US',
      'Accept-Encoding': 'gzip',
    }
  })
    .then(res => {
      console.log(`Status: ${res.status} ${res.statusText}`);
      if (res.status === 403) {
        console.log('✅ Missing UA detection PASSED - blocked with 403');
      } else {
        console.log('❌ Missing UA detection FAILED - was NOT blocked');
      }
      return res.text();
    })
    .then(text => console.log('Response:', text.substring(0, 100)))
    .catch(err => console.error('❌ Error:', err.message));
}, 3000);

// Test 5: Missing browser headers
setTimeout(() => {
  console.log('\n🔍 Test 5: Missing browser headers (no Accept-Language)');
  fetch(testUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      'Accept': 'text/html',
      'Accept-Encoding': 'gzip',
      // Missing Accept-Language
    }
  })
    .then(res => {
      console.log(`Status: ${res.status} ${res.statusText}`);
      if (res.status === 403) {
        console.log('✅ Missing headers detection PASSED - blocked with 403');
      } else {
        console.log('❌ Missing headers detection FAILED - was NOT blocked');
      }
      return res.text();
    })
    .then(text => console.log('Response:', text.substring(0, 100)))
    .catch(err => console.error('❌ Error:', err.message));
}, 4000);

// Test 6: Rate limiting (make 101 rapid requests)
setTimeout(() => {
  console.log('\n🔍 Test 6: Rate limiting (making 101 rapid requests)');
  console.log('This will take a few seconds...');

  const promises = [];
  for (let i = 0; i < 101; i++) {
    promises.push(
      fetch(testUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
          'Accept': 'text/html',
          'Accept-Language': 'en-US',
          'Accept-Encoding': 'gzip',
        }
      })
    );
  }

  Promise.all(promises)
    .then(responses => {
      const rateLimited = responses.filter(r => r.status === 429);
      console.log(`Made 101 requests: ${rateLimited.length} were rate limited (429)`);
      if (rateLimited.length > 0) {
        console.log('✅ Rate limiting PASSED - some requests blocked with 429');
        console.log(`Rate limit headers: Retry-After=${responses[responses.length-1].headers.get('retry-after')}`);
      } else {
        console.log('❌ Rate limiting FAILED - no requests were rate limited');
      }
    })
    .catch(err => console.error('❌ Error:', err.message));
}, 5000);

console.log('\n🚀 Anti-scraping test suite started...\n');
