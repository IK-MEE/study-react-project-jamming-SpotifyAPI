const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const redirectUri = process.env.REACT_APP_SPOTIFY_REDIRECT_URI;
const authEndpoint = 'https://accounts.spotify.com/authorize';
const tokenEndpoint = 'https://accounts.spotify.com/api/token';
const PENDING_TERM_KEY = 'spotify_pending_search_term';

let accessToken;
let refreshToken = localStorage.getItem('spotify_refresh_token');

// ---------- helpers ----------
function base64UrlEncode(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateCodeVerifier(length = 64) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const rnd = new Uint8Array(length);
  crypto.getRandomValues(rnd);
  let out = '';
  for (let i = 0; i < length; i++) out += charset[rnd[i] % charset.length];
  return out;
}

function rememberPendingSearch(term) {
  if (term) sessionStorage.setItem(PENDING_TERM_KEY, term);
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

async function startAuth() {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  sessionStorage.setItem('code_verifier', verifier);

  const qs = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'playlist-modify-public playlist-modify-private',
    code_challenge_method: 'S256',
    code_challenge: challenge
  });

  window.location.assign(`${authEndpoint}?${qs.toString()}`);
}

// ---------- core ----------
const Spotify = {
  async getAccessToken() {
    if (accessToken) return accessToken;

    if (!clientId || !redirectUri) {
      console.error("Missing Spotify environment variables.");
      return null;
    }

    const expiry = Number(localStorage.getItem('spotify_token_expiry') || 0);
    const savedToken = localStorage.getItem('spotify_access_token');

    if (savedToken && expiry && Date.now() < expiry) {
      accessToken = savedToken;
      return accessToken;
    }

    refreshToken = refreshToken || localStorage.getItem('spotify_refresh_token');
    if (refreshToken) {
      await Spotify.refreshAccessToken();
      if (accessToken) return accessToken;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      await Spotify.exchangeCodeForToken(code);
      if (accessToken) {
        window.history.replaceState({}, '', window.location.pathname);
        return accessToken;
      }
      console.error('Access token not set after exchange.');
      return null;
    }

    await startAuth();
    return null;
  },

  async exchangeCodeForToken(code) {
    const verifier = sessionStorage.getItem('code_verifier');

    if (!verifier) {
      console.warn('Missing code_verifier; restarting auth...');
      await startAuth();
      return;
    }

    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier
    });

    const res = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    const data = await res.json();

    if (data.error) {
      console.error('Failed to exchange token:', data);
      sessionStorage.removeItem('code_verifier');
      await startAuth();
      return;
    }

    accessToken = data.access_token;

    if (data.refresh_token) {
      refreshToken = data.refresh_token;
      localStorage.setItem('spotify_refresh_token', refreshToken);
    }

    if (data.expires_in) {
      const expiryTime = Date.now() + data.expires_in * 1000;
      localStorage.setItem('spotify_token_expiry', String(expiryTime));
      window.setTimeout(() => Spotify.refreshAccessToken(), data.expires_in * 1000);
    }

    if (accessToken) {
      localStorage.setItem('spotify_access_token', accessToken);
    }

    sessionStorage.removeItem('code_verifier');
  },

  async refreshAccessToken() {
    refreshToken = refreshToken || localStorage.getItem('spotify_refresh_token');
    if (!refreshToken) return;

    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    const res = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    const data = await res.json();

    if (data.access_token) {
      accessToken = data.access_token;
      localStorage.setItem('spotify_access_token', accessToken);

      if (data.expires_in) {
        const expiryTime = Date.now() + data.expires_in * 1000;
        localStorage.setItem('spotify_token_expiry', String(expiryTime));
        window.setTimeout(() => Spotify.refreshAccessToken(), data.expires_in * 1000);
      }
    } else {
      console.error('Failed to refresh token:', data);
      localStorage.removeItem('spotify_refresh_token');
      localStorage.removeItem('spotify_access_token');
      localStorage.removeItem('spotify_token_expiry');
      refreshToken = null;
      accessToken = undefined;
    }
  },

  async search(term) {
    if (!term) return [];

    rememberPendingSearch(term);

    const token = await Spotify.getAccessToken();
    if (!token) return [];

    const finalTerm = sessionStorage.getItem(PENDING_TERM_KEY) || term;

    const res = await fetch(
      `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(finalTerm)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.status === 401) {
      localStorage.removeItem('spotify_access_token');
      localStorage.removeItem('spotify_token_expiry');
      accessToken = undefined;

      await Spotify.refreshAccessToken();
      if (accessToken) return Spotify.search(finalTerm);

      localStorage.removeItem('spotify_refresh_token');
      refreshToken = null;
      await Spotify.getAccessToken();
      return [];
    }

    const json = await res.json();
    if (!json.tracks) return [];

    sessionStorage.removeItem(PENDING_TERM_KEY);

    return json.tracks.items.map(t => ({
      id: t.id,
      name: t.name,
      artist: t.artists[0].name,
      album: t.album.name,
      uri: t.uri,
      image: t.album.images[0]?.url || "",
      preview: t.preview_url || null
    }));
  },

  async savePlaylist(name, trackUris) {
    try {
      if (!name || !trackUris.length) return;
      const token = await Spotify.getAccessToken();
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const me = await (await fetch('https://api.spotify.com/v1/me', { headers })).json();
      const userId = me.id;

      const playlist = await (await fetch(
        `https://api.spotify.com/v1/users/${userId}/playlists`,
        { method: 'POST', headers, body: JSON.stringify({ name }) }
      )).json();

      const playlistId = playlist.id;
      await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST', headers, body: JSON.stringify({ uris: trackUris })
      });
    } catch (err) {
      console.error("Failed to save playlist:", err);
    }
  }
};

export default Spotify;