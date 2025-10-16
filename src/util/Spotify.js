const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const redirectUri = process.env.REACT_APP_SPOTIFY_REDIRECT_URI;
const authEndpoint = 'https://accounts.spotify.com/authorize';
const tokenEndpoint = 'https://accounts.spotify.com/api/token';

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

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

// ---------- core ----------
const Spotify = {
  async getAccessToken() {
    if (accessToken) return accessToken;

    const savedToken = localStorage.getItem('spotify_access_token');
    if (savedToken) {
      accessToken = savedToken;
      return accessToken;
    }

    if (!clientId || !redirectUri) {
      console.error("Missing Spotify environment variables.");
      return null;
    }

    const expiry = localStorage.getItem('spotify_token_expiry');
    if (expiry && Date.now() > expiry) {
      console.log("Access token expired, refreshing...");
      await Spotify.refreshAccessToken();
      if (accessToken) return accessToken;
    }

    if (refreshToken) {
      await Spotify.refreshAccessToken();
      if (accessToken) return accessToken;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      localStorage.setItem('code_verifier', verifier);
      const qs = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: 'playlist-modify-public playlist-modify-private',
        code_challenge_method: 'S256',
        code_challenge: challenge
      });
      window.location.assign(`${authEndpoint}?${qs.toString()}`);
      return null;
    }

    await Spotify.exchangeCodeForToken(code);

    if (accessToken) {
      window.history.replaceState({}, '', redirectUri);
      return accessToken;
    } else {
      console.error('Access token not set after exchange.');
      return null;
    }
  },

  async exchangeCodeForToken(code) {
    const verifier = localStorage.getItem('code_verifier');
    if (!verifier) {
      console.error('Missing code_verifier (origin mismatch? storage cleared?)');
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
      return;
    }

    accessToken = data.access_token;
    if (data.refresh_token) {
      refreshToken = data.refresh_token;
      localStorage.setItem('spotify_refresh_token', refreshToken);
    }
    if (data.expires_in) {
      const expiryTime = Date.now() + data.expires_in * 1000;
      localStorage.setItem('spotify_token_expiry', expiryTime);
      window.setTimeout(() => Spotify.refreshAccessToken(), data.expires_in * 1000);
    }
    if (accessToken) {
      localStorage.setItem('spotify_access_token', accessToken);
    }
  },

  async refreshAccessToken() {
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
      if (data.expires_in) {
        const expiryTime = Date.now() + data.expires_in * 1000;
        localStorage.setItem('spotify_token_expiry', expiryTime);
        window.setTimeout(() => Spotify.refreshAccessToken(), data.expires_in * 1000);
      }
    } else {
      console.error('Failed to refresh token:', data);
    }
  },

  async search(term) {
    const token = await Spotify.getAccessToken();
    if (!token) return [];
    const res = await fetch(
      `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(term)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const json = await res.json();
    if (!json.tracks) return [];
    console.log(json);
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