# 🎵 Jamming (Spotify Playlist App)

A React app for searching Spotify tracks and saving custom playlists to your account.  
Built as part of the Codecademy Full-Stack Developer curriculum to practice real-world API integration.

## ⚠️ Important Note (Spotify API Policy Change)

As of late 2024, Spotify requires the **app owner to have an active Premium subscription** to use the Web API — including the search endpoint. Free accounts will receive a `403 Forbidden` error regardless of correct implementation.

This project is fully functional. The limitation is Spotify's policy, not the code.

## Features
- Search tracks from Spotify
- Add tracks to a custom playlist
- Save the playlist directly to your Spotify account
- OAuth2 PKCE Flow for secure token handling (no client secret exposed)
- Track preview playback (when `preview_url` is available)

## Tech Stack
- React (hooks: `useState`, `useCallback`, `useEffect`)
- Spotify Web API
- OAuth2 PKCE Flow (no backend required)

## Setup
1. Register your app at https://developer.spotify.com/ and get a Client ID
2. `npm install`
3. Create a `.env` file:
REACT_APP_SPOTIFY_CLIENT_ID=your_client_id_here
REACT_APP_SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000
> The redirect URI must exactly match what you set in the Spotify Developer Dashboard.
4. `npm start`

## What I Learned
- Managing shared state across multiple React components
- Controlling async/await flow in real API interactions
- Using `useEffect` and `useCallback` appropriately
- Debugging authentication issues against a live API (scope errors, token caching, PKCE flow)
- Understanding OAuth2 PKCE from authorization request to token refresh

## License
MIT License  
© 2025 IK-MEE  
*(Developed as a learning project with guidance from Claude by Anthropic and ChatGPT from OpenAI)*
