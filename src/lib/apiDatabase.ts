// API Database client helper for durable persistence

export async function fetchApiDb() {
  try {
    const res = await fetch('/api/db', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('API DB Fetch failed, falling back to local storage:', err);
  }
  return null;
}

export async function updateApiDb(payload: Record<string, any>) {
  try {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('API DB Update failed, saved to local cache:', err);
  }
  return null;
}

export async function initApiDb(defaultData: Record<string, any>) {
  try {
    const res = await fetch('/api/db/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: JSON.stringify(defaultData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('API DB Init failed:', err);
  }
  return null;
}
