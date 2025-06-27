import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../');

let events = [];
let lastChallengeRequest = null;

const pruneOldEvents = () => {
  const now = Date.now();
  events = events.filter(e => now - e.timestamp < 24 * 60 * 60 * 1000);
};

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(root, 'public')));

app.get('/webhook', (req, res) => {
  const { challenge } = req.query;
  if (challenge) {
    lastChallengeRequest = {
      timestamp: new Date().toISOString(),
      query: req.query,
      headers: req.headers
    };
    return res.send(challenge);
  }
  res.sendStatus(400);
});

app.post('/webhook', (req, res) => {
  const timestamp = Date.now();
  const hasError = JSON.stringify(req.body).toLowerCase().includes('error');
  events.push({ timestamp, event: req.body, isError: hasError });
  pruneOldEvents();
  res.sendStatus(200);
});

app.get('/api/events', (req, res) => {
  pruneOldEvents();
  res.json(events);
});

app.get('/api/challenge-info', (req, res) => {
  res.json(lastChallengeRequest || {});
});

app.listen(port, () => console.log(`Server listening on port ${port}`));
