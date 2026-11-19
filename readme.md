# 3d-mapbox

## Setup

```bash
# Install dependencies (only the first time)
npm install

# Run the local server at localhost:5173
npm run dev

# Build for production in the dist/ directory
npm run build
```

The Mapbox token goes in a `.env` file at the root (see `.env.sample`):

```
VITE_MAPBOX_TOKEN=pk.xxxx
```

Open `http://localhost:5173/#debug` for the debug panel. F toggles fly mode (WASD, E/Q, Shift, wheel for speed).
