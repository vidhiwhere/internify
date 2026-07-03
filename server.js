const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Helper to read database
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // Default DB structure if it doesn't exist
      const defaultDB = { settings: {}, internships: [], logs: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2));
      return defaultDB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file:', err);
    return { settings: {}, internships: [], logs: [] };
  }
}

// Helper to write database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}

// Helper to generate secure tokens
function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

// Helper to validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Helper to format date for email
function formatDate(dateStr) {
  if (!dateStr) return '(not provided)';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options); // e.g. 15 May 2026
  } catch (e) {
    return dateStr;
  }
}

// ==================== REST ENDPOINTS ====================

// GET: Settings
app.get('/api/settings', (req, res) => {
  const db = readDB();
  res.json(db.settings || {});
});

// POST: Update Settings
app.post('/api/settings', (req, res) => {
  const db = readDB();
  db.settings = { ...db.settings, ...req.body };
  writeDB(db);
  res.json({ message: 'Settings updated successfully', settings: db.settings });
});

// GET: Internships
app.get('/api/internships', (req, res) => {
  const db = readDB();
  res.json(db.internships || []);
});

// POST: Create Internship
app.post('/api/internships', (req, res) => {
  const db = readDB();
  const { studentName, studentEmail, companyName, hrName, hrEmail, startDate, endDate } = req.body;

  if (!studentName || !companyName || !hrEmail) {
    return res.status(400).json({ error: 'Missing required fields (Student Name, Company, HR Email)' });
  }

  const newInternship = {
    id: crypto.randomBytes(8).toString('hex'),
    studentName,
    studentEmail: studentEmail || '',
    companyName,
    hrName: hrName || 'Hiring Team',
    hrEmail: hrEmail.trim(),
    startDate: startDate || '',
    endDate: endDate || '',
    status: 'Pending',
    token: generateToken(),
    sentOn: null,
    verifiedOn: null,
    feedback: ''
  };

  db.internships.unshift(newInternship); // Add to the top
  writeDB(db);
  res.status(201).json(newInternship);
});

// PUT: Update Internship details
app.put('/api/internships/:id', (req, res) => {
  const db = readDB();
  const index = db.internships.findIndex(item => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Internship not found' });
  }

  db.internships[index] = {
    ...db.internships[index],
    ...req.body,
    // Keep internal values unless explicitly modified
    id: db.internships[index].id,
    token: db.internships[index].token
  };

  writeDB(db);
  res.json(db.internships[index]);
});

// DELETE: Remove Internship
app.delete('/api/internships/:id', (req, res) => {
  const db = readDB();
  const index = db.internships.findIndex(item => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Internship not found' });
  }

  const deleted = db.internships.splice(index, 1);
  writeDB(db);
  res.json({ message: 'Internship deleted successfully', deleted: deleted[0] });
});

// GET: Simulated Email Logs
app.get('/api/logs', (req, res) => {
  const db = readDB();
  res.json(db.logs || []);
});

// POST: Clear Simulated logs
app.post('/api/logs/clear', (req, res) => {
  const db = readDB();
  db.logs = [];
  writeDB(db);
  res.json({ message: 'Logs cleared successfully' });
});

// GET: HR Verification metadata (Public Route)
app.get('/api/verify/:token', (req, res) => {
  const db = readDB();
  const internship = db.internships.find(item => item.token === req.params.token);

  if (!internship) {
    return res.status(404).json({ error: 'Verification link is invalid or has expired' });
  }

  // Return limited safe details
  res.json({
    studentName: internship.studentName,
    companyName: internship.companyName,
    startDate: internship.startDate,
    endDate: internship.endDate,
    hrName: internship.hrName,
    collegeName: db.settings.collegeName || 'Your College',
    status: internship.status,
    verifiedOn: internship.verifiedOn,
    feedback: internship.feedback
  });
});

// POST: HR Submits Verification (Public Route)
app.post('/api/verify/:token', (req, res) => {
  const db = readDB();
  const index = db.internships.findIndex(item => item.token === req.params.token);

  if (index === -1) {
    return res.status(404).json({ error: 'Verification link is invalid or has expired' });
  }

  const { approve, feedback } = req.body;

  db.internships[index].status = approve ? 'Verified' : 'Correction Requested';
  db.internships[index].verifiedOn = new Date().toISOString();
  db.internships[index].feedback = feedback || '';

  writeDB(db);
  res.json({
    message: approve ? 'Internship details verified successfully' : 'Correction request received',
    status: db.internships[index].status
  });
});

// ==================== EMAIL MAILER CONTROLLER ====================

// Helper to format HTML email content
function generateEmailHTML(studentName, company, startDate, endDate, hrName, collegeName, verifyLink) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { background-color: #f8fafc; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
        .message { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
        .details-box { background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 28px; border: 1px solid #e2e8f0; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
        .detail-row:last-child { margin-bottom: 0; }
        .detail-label { color: #64748b; font-weight: 500; text-align: left; }
        .detail-val { color: #0f172a; font-weight: 600; text-align: right; }
        .cta-container { text-align: center; margin-bottom: 28px; }
        .btn { display: inline-block; background-color: #6366f1; color: #ffffff !important; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 15px; text-decoration: none; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2); }
        .btn:hover { background-color: #4f46e5; }
        .footer { padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; background-color: #fafafa; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>Internship Verification Request</h1>
          </div>
          <div class="content">
            <div class="greeting">Dear ${hrName},</div>
            <div class="message">
              <strong>${collegeName}</strong> is verifying student internship records as part of our graduation and placement cell audit. We would be grateful if you could confirm the details of the internship completed by our student:
            </div>
            
            <div class="details-box">
              <div class="detail-row">
                <span class="detail-label">Student Name:</span>
                <span class="detail-val">${studentName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Company Name:</span>
                <span class="detail-val">${company}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-val">${startDate} to ${endDate}</span>
              </div>
            </div>

            <div class="message">
              Please click the link below to verify these details. You will be able to review, approve, or request corrections directly.
            </div>

            <div class="cta-container">
              <a href="${verifyLink}" class="btn" target="_blank">Review & Verify Internship</a>
            </div>

            <div class="message" style="font-size: 13px; color: #64748b; text-align: center;">
              Alternatively, copy and paste this link in your browser:<br>
              <a href="${verifyLink}" style="color: #6366f1; word-break: break-all;">${verifyLink}</a>
            </div>
          </div>
          <div class="footer">
            Sent by the Training & Placement Cell, ${collegeName}.<br>
            Please do not reply directly to this automated email.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// core email sending helper
async function sendMail(settings, toEmail, subject, textBody, htmlBody) {
  if (settings.mailerMode === 'mock') {
    // Simulated Mailer
    const db = readDB();
    const mockLog = {
      id: crypto.randomBytes(8).toString('hex'),
      to: toEmail,
      subject,
      body: textBody,
      html: htmlBody,
      sentOn: new Date().toISOString()
    };
    db.logs = db.logs || [];
    db.logs.unshift(mockLog);
    writeDB(db);
    return { success: true, mode: 'mock' };
  } else {
    // Real SMTP Mailer
    if (!settings.smtpHost || !settings.smtpPort || !settings.smtpUser || !settings.smtpPass) {
      throw new Error('SMTP credentials are not configured in settings.');
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: parseInt(settings.smtpPort),
      secure: settings.smtpSecure || false, // true for 465, false for other ports
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass
      }
    });

    const mailOptions = {
      from: `"${settings.collegeName} Verification" <${settings.smtpUser}>`,
      to: toEmail,
      subject,
      text: textBody,
      html: htmlBody,
      replyTo: settings.replyToEmail || undefined
    };

    await transporter.sendMail(mailOptions);
    return { success: true, mode: 'smtp' };
  }
}

// POST: Trigger email for single record
app.post('/api/internships/send', async (req, res) => {
  const db = readDB();
  const { id } = req.body;

  const index = db.internships.findIndex(item => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Internship record not found' });
  }

  const record = db.internships[index];
  const settings = db.settings || {};

  if (!record.hrEmail || !isValidEmail(record.hrEmail)) {
    db.internships[index].status = 'Error: invalid HR email';
    writeDB(db);
    return res.status(400).json({ error: 'Invalid or missing HR email' });
  }

  const clientUrl = req.headers.origin || (req.protocol + '://' + req.get('host'));
  const verifyLink = `${clientUrl}/verify/${record.token}`;

  const formattedStart = formatDate(record.startDate);
  const formattedEnd = formatDate(record.endDate);
  const collegeName = settings.collegeName || 'Our College';

  const subject = `Internship Verification Request — ${record.studentName} (${collegeName})`;
  const textBody = `Dear ${record.hrName},\n\n${collegeName} is verifying internship records for our student ${record.studentName} at ${record.companyName} (${formattedStart} to ${formattedEnd}) as part of our graduation documentation cell review.\n\nPlease review and verify these details at:\n${verifyLink}\n\nBest regards,\n${collegeName} Placement Cell`;
  const htmlBody = generateEmailHTML(record.studentName, record.companyName, formattedStart, formattedEnd, record.hrName, collegeName, verifyLink);

  try {
    await sendMail(settings, record.hrEmail, subject, textBody, htmlBody);
    db.internships[index].status = 'Sent';
    db.internships[index].sentOn = new Date().toISOString();
    writeDB(db);
    res.json({ message: 'Verification email sent successfully', status: 'Sent' });
  } catch (err) {
    console.error('Mail sending error:', err);
    db.internships[index].status = `Error: ${err.message}`;
    writeDB(db);
    res.status(500).json({ error: `Mail transmission failed: ${err.message}` });
  }
});

// POST: Trigger bulk emails
app.post('/api/internships/bulk-send', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'Invalid payload: ids array is required' });
  }

  const db = readDB();
  const settings = db.settings || {};
  const clientUrl = req.headers.origin || (req.protocol + '://' + req.get('host'));
  const collegeName = settings.collegeName || 'Our College';

  let sent = 0;
  let errors = 0;

  for (const id of ids) {
    const index = db.internships.findIndex(item => item.id === id);
    if (index === -1) continue;

    const record = db.internships[index];

    // Skip already verified
    if (record.status === 'Verified') continue;

    if (!record.hrEmail || !isValidEmail(record.hrEmail)) {
      db.internships[index].status = 'Error: invalid HR email';
      errors++;
      continue;
    }

    const verifyLink = `${clientUrl}/verify/${record.token}`;
    const formattedStart = formatDate(record.startDate);
    const formattedEnd = formatDate(record.endDate);

    const subject = `Internship Verification Request — ${record.studentName} (${collegeName})`;
    const textBody = `Dear ${record.hrName},\n\n${collegeName} is verifying internship records for our student ${record.studentName} at ${record.companyName} (${formattedStart} to ${formattedEnd}) as part of our graduation documentation cell review.\n\nPlease review and verify these details at:\n${verifyLink}\n\nBest regards,\n${collegeName} Placement Cell`;
    const htmlBody = generateEmailHTML(record.studentName, record.companyName, formattedStart, formattedEnd, record.hrName, collegeName, verifyLink);

    try {
      await sendMail(settings, record.hrEmail, subject, textBody, htmlBody);
      db.internships[index].status = 'Sent';
      db.internships[index].sentOn = new Date().toISOString();
      sent++;
    } catch (err) {
      console.error(`Bulk sending error for id ${id}:`, err);
      db.internships[index].status = `Error: ${err.message}`;
      errors++;
    }
  }

  writeDB(db);
  res.json({ message: `Bulk dispatch completed. Sent: ${sent}, Errors: ${errors}`, sent, errors });
});

// ==================== SERVE FRONTEND ====================

// Serve static production build files if they exist
const distPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(distPath));

// Fallback routing for SPA pages (like dashboard / and verification page /verify/:token)
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.status(200).send('Internify backend running. Front-end assets build pending.');
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`Internify Backend server running on port ${PORT}`);
  console.log(`=================================================`);
});
