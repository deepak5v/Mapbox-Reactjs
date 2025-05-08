# Mapbox React Application

A React application using Mapbox GL JS for interactive maps.

## Features

- Search locations
- Get driving directions
- Animate car movement along routes
- Speed control for animations
- Bookmarks for favorite locations
- Traffic layer toggle
- Multiple map styles

## Setup

1. Clone the repository
```bash
git clone <your-repo-url>
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Mapbox token:
```
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

4. Start the development server
```bash
npm run dev
```

## Environment Variables

Create a `.env` file with the following:

```
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
