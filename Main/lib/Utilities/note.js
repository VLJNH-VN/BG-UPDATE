exports.name = '/note/:uuid';

const fs = require('fs-extra');
const path = require('path');

// In-memory storage for notes (you can replace this with a database)
let notes = {};

// Load existing notes from file if it exists
const notesFile = path.join(__dirname, 'database', 'notes.json');
try {
    if (fs.existsSync(notesFile)) {
        notes = JSON.parse(fs.readFileSync(notesFile, 'utf8'));
    }
} catch (e) {
    console.log('Failed to load notes:', e.message);
}

// Save notes to file
function saveNotes() {
    try {
        fs.ensureDirSync(path.dirname(notesFile));
        fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2));
    } catch (e) {
        console.log('Failed to save notes:', e.message);
    }
}

exports.index = async (req, res, next) => {
    const uuid = req.params.uuid;
    const isRaw = uuid.endsWith('-raw');
    const actualUuid = isRaw ? uuid.replace('-raw', '') : uuid;

    try {
        switch (req.method) {
            case 'GET':
                if (!notes[actualUuid]) {
                    return res.status(404).json({
                        error: 'Note not found',
                        uuid: actualUuid
                    });
                }

                if (isRaw) {
                    // Return raw content
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    return res.send(notes[actualUuid].content);
                } else {
                    // Return edit interface
                    const editHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Edit Note - ${actualUuid}</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-bottom: 20px; }
        .info { background: #e3f2fd; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
        textarea { width: 100%; height: 500px; font-family: 'Courier New', monospace; font-size: 14px; border: 1px solid #ddd; padding: 10px; border-radius: 4px; }
        .buttons { margin-top: 20px; }
        button { background: #2196F3; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; margin-right: 10px; font-size: 14px; }
        button:hover { background: #1976D2; }
        .raw-link { background: #4CAF50; }
        .raw-link:hover { background: #45a049; }
        .success { background: #d4edda; color: #155724; padding: 10px; border-radius: 4px; margin-top: 10px; display: none; }
        .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin-top: 10px; display: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📝 Edit Note</h1>
        <div class="info">
            <strong>UUID:</strong> ${actualUuid}<br>
            <strong>Raw URL:</strong> <a href="/note/${actualUuid}-raw" target="_blank">/note/${actualUuid}-raw</a><br>
            <strong>Edit URL:</strong> <a href="/note/${actualUuid}" target="_blank">/note/${actualUuid}</a>
        </div>

        <textarea id="content" placeholder="Enter your note content here...">${notes[actualUuid].content || ''}</textarea>

        <div class="buttons">
            <button onclick="saveNote()">💾 Save</button>
            <button onclick="window.open('/note/${actualUuid}-raw', '_blank')" class="raw-link">📄 View Raw</button>
        </div>

        <div id="success" class="success"></div>
        <div id="error" class="error"></div>
    </div>

    <script>
        async function saveNote() {
            const content = document.getElementById('content').value;
            const successDiv = document.getElementById('success');
            const errorDiv = document.getElementById('error');

            try {
                const response = await fetch('/note/${actualUuid}', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'text/plain; charset=utf-8'
                    },
                    body: content
                });

                if (response.ok) {
                    successDiv.textContent = '✅ Note saved successfully!';
                    successDiv.style.display = 'block';
                    errorDiv.style.display = 'none';
                    setTimeout(() => successDiv.style.display = 'none', 3000);
                } else {
                    throw new Error('Failed to save note');
                }
            } catch (error) {
                errorDiv.textContent = '❌ Error saving note: ' + error.message;
                errorDiv.style.display = 'block';
                successDiv.style.display = 'none';
            }
        }

        // Auto-save every 30 seconds
        setInterval(saveNote, 30000);
    </script>
</body>
</html>`;
                    res.setHeader('Content-Type', 'text/html');
                    return res.send(editHtml);
                }
                break;

            case 'PUT':
                // Save note content
                const content = req.body;

                notes[actualUuid] = {
                    content: content,
                    updatedAt: new Date().toISOString(),
                    createdAt: notes[actualUuid]?.createdAt || new Date().toISOString()
                };

                saveNotes();

                return res.json({
                    success: true,
                    message: 'Note saved successfully',
                    uuid: actualUuid,
                    updatedAt: notes[actualUuid].updatedAt
                });
                break;

            case 'DELETE':
                if (!notes[actualUuid]) {
                    return res.status(404).json({
                        error: 'Note not found',
                        uuid: actualUuid
                    });
                }

                delete notes[actualUuid];
                saveNotes();

                return res.json({
                    success: true,
                    message: 'Note deleted successfully',
                    uuid: actualUuid
                });
                break;

            default:
                return res.status(405).json({
                    error: 'Method not allowed',
                    allowed: ['GET', 'PUT', 'DELETE']
                });
        }
    } catch (error) {
        console.error('Note API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
};