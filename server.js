import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const IESO_BASE_URL = 'https://reports-public.ieso.ca/public/GenOutputCapability/';
const IESO_ADEQUACY_BASE_URL = 'https://reports-public.ieso.ca/public/Adequacy3/';
const IESO_VG_BASE_URL = 'https://reports-public.ieso.ca/public/VGForecastSummary/';

/**
 * Server-side API proxy for IESO XML generation report
 * GET /api/ieso-generation?filename=PUB_GenOutputCapability.xml
 */
app.get('/api/ieso-generation', async (req, res) => {
  try {
    const rawFilename = req.query.filename || 'PUB_GenOutputCapability.xml';
    // Sanitize filename to prevent directory traversal
    const cleanFilename = path.basename(String(rawFilename));
    const targetUrl = `${IESO_BASE_URL}${cleanFilename}`;

    console.log(`[Proxy] Fetching XML report from: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IESO-Generator-Dashboard/1.0',
        'Accept': 'application/xml, text/xml, */*'
      }
    });

    if (!response.ok) {
      console.error(`[Proxy] IESO server returned status ${response.status}`);
      return res.status(response.status).json({ error: `IESO server returned status ${response.status}` });
    }

    const xmlText = await response.text();
    res.set('Content-Type', 'text/xml');
    res.send(xmlText);
  } catch (error) {
    console.error('[Proxy Error] Failed to fetch IESO XML:', error);
    res.status(500).json({ error: 'Server proxy failed to fetch IESO XML report' });
  }
});

/**
 * Server-side API proxy for IESO XML Adequacy report
 * GET /api/ieso-adequacy?filename=PUB_Adequacy3.xml
 */
app.get('/api/ieso-adequacy', async (req, res) => {
  try {
    const rawFilename = req.query.filename || 'PUB_Adequacy3.xml';
    const cleanFilename = path.basename(String(rawFilename));
    const targetUrl = `${IESO_ADEQUACY_BASE_URL}${cleanFilename}`;

    console.log(`[Proxy] Fetching Adequacy XML report from: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IESO-Generator-Dashboard/1.0',
        'Accept': 'application/xml, text/xml, */*'
      }
    });

    if (!response.ok) {
      console.error(`[Proxy] Adequacy server returned status ${response.status}`);
      return res.status(response.status).json({ error: `Adequacy server returned status ${response.status}` });
    }

    const xmlText = await response.text();
    res.set('Content-Type', 'text/xml');
    res.send(xmlText);
  } catch (error) {
    console.error('[Proxy Error] Failed to fetch Adequacy XML:', error);
    res.status(500).json({ error: 'Server proxy failed to fetch IESO Adequacy report' });
  }
});

/**
 * Server-side API proxy for IESO Variable Generation (VG) Wind/Solar Forecast XML
 * GET /api/ieso-vg-forecast?filename=PUB_VGForecastSummary.xml
 */
app.get('/api/ieso-vg-forecast', async (req, res) => {
  try {
    const rawFilename = req.query.filename || 'PUB_VGForecastSummary.xml';
    const cleanFilename = path.basename(String(rawFilename));
    const targetUrl = `${IESO_VG_BASE_URL}${cleanFilename}`;

    console.log(`[Proxy] Fetching VG Forecast XML from: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IESO-Generator-Dashboard/1.0',
        'Accept': 'application/xml, text/xml, */*'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `VG Forecast returned status ${response.status}` });
    }

    const xmlText = await response.text();
    res.set('Content-Type', 'text/xml');
    res.send(xmlText);
  } catch (error) {
    console.error('[Proxy Error] Failed to fetch VG Forecast XML:', error);
    res.status(500).json({ error: 'Server proxy failed to fetch VG Forecast XML' });
  }
});

/**
 * Server-side API proxy for Open-Meteo 7-day Wind Weather Forecast (ECMWF & GFS 100m Hub Height)
 * GET /api/wind-weather-forecast
 */
app.get('/api/wind-weather-forecast', async (req, res) => {
  try {
    const targetUrl = 'https://api.open-meteo.com/v1/forecast?latitude=43.8,42.4,44.0,44.5,46.5&longitude=-81.3,-82.0,-80.0,-76.0,-84.0&hourly=wind_speed_100m,wind_speed_10m&models=ecmwf_ifs025,gfs_seamless';
    console.log(`[Proxy] Fetching Wind Weather Forecast from Open-Meteo...`);

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IESO-Generator-Dashboard/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Open-Meteo API returned status ${response.status}` });
    }

    const json = await response.json();
    res.json(json);
  } catch (error) {
    console.error('[Proxy Error] Failed to fetch Wind Weather Forecast:', error);
    res.status(500).json({ error: 'Server proxy failed to fetch Wind Weather Forecast' });
  }
});

/**
 * Server-side API proxy for IESO historical directory index
 * GET /api/ieso-directory
 */
app.get('/api/ieso-directory', async (req, res) => {
  try {
    const targetUrl = `${IESO_BASE_URL}?C=M;O=D`;
    console.log(`[Proxy] Fetching directory index from: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IESO-Generator-Dashboard/1.0',
        'Accept': 'text/html, */*'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `IESO directory returned status ${response.status}` });
    }

    const htmlText = await response.text();
    res.set('Content-Type', 'text/html');
    res.send(htmlText);
  } catch (error) {
    console.error('[Proxy Error] Failed to fetch directory index:', error);
    res.status(500).json({ error: 'Server proxy failed to fetch IESO directory index' });
  }
});

// Serve static frontend files from Vite build output directory (dist)
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  IESO Generator Summary Server Running`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Proxy Endpoint: http://localhost:${PORT}/api/ieso-generation`);
  console.log(`==================================================`);
});
