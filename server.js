import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// Google Sheets config
const SHEET_ID = '1l-xLW7qgtIZF7aOodYezravvXvhu0ug1lHQdDg2FzgA'; // เปลี่ยนเป็นของคุณ
const SHEET_SUBJECTS = 'Subjects';
const SHEET_ACTIVITIES = 'Activities';

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'booming-flash-437514-j2-8cc4dcd18ad9.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});
const sheets = google.sheets({ version: 'v4', auth });

// Write data to Google Sheet
async function writeSheetValues(sheetName, values) {
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: sheetName
  });
  if (!values.length) return;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: sheetName,
    valueInputOption: 'RAW',
    requestBody: { values }
  });
}

// API: save data
app.post('/api/save', async (req, res) => {
  try {
    const { subjects, activities } = req.body;

    const subjectsValues = subjects.map(s => [s.id, s.title, s.subtitle||'', s.level, s.symbol, s.time||'']);
    const activitiesValues = [];
    for(const date in activities){
      activities[date].forEach(a=>{
        activitiesValues.push([date, a.id, a.title, a.subtitle||'', a.level, a.symbol, a.time||'']);
      });
    }

    await writeSheetValues(SHEET_SUBJECTS, subjectsValues);
    await writeSheetValues(SHEET_ACTIVITIES, activitiesValues);

    res.json({ success: true });
  } catch(err){
    console.error("SAVE ERROR:", err.stack);
    res.status(500).json({ error:'Failed to save data', message: err.message });
  }
});

// API: load data
app.get('/api/data', async (req, res) => {
  try {
    const subjectsRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: SHEET_SUBJECTS });
    const activitiesRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: SHEET_ACTIVITIES });

    const subjects = (subjectsRes.data.values||[]).map(r=>({
      id:r[0], title:r[1], subtitle:r[2], level:r[3], symbol:r[4], time:r[5]
    }));

    const activities = {};
    (activitiesRes.data.values||[]).forEach(r=>{
      const date = r[0];
      const act = { id:r[1], title:r[2], subtitle:r[3], level:r[4], symbol:r[5], time:r[6] };
      if(!activities[date]) activities[date] = [];
      activities[date].push(act);
    });

    res.json({ subjects, activities });
  } catch(err){
    console.error("LOAD ERROR:", err.stack);
    res.status(500).json({ error:'Failed to load data', message: err.message });
  }
});

app.listen(3000, ()=>console.log("Server running on http://localhost:3000"));
