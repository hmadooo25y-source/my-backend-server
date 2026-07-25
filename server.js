const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
// استخدام المنفذ الذي تحدده المنصة أو 3000 محلياً
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const dataFile = path.join(__dirname, 'data.json');

function saveToDatabase(type, data) {
    let db = { locations: [], snapshots: [] };
    if (fs.existsSync(dataFile)) {
        db = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    }
    
    if (type === 'location') {
        db.locations.push({ ...data, timestamp: new Date().toISOString() });
    } else if (type === 'snapshot') {
        const filename = `img_${Date.now()}.png`;
        const base64Data = data.replace(/^data:image\/png;base64,/, "");
        fs.writeFileSync(path.join(uploadsDir, filename), base64Data, 'base64');
        db.snapshots.push({ filename, timestamp: new Date().toISOString() });
    }
    
    fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
}

app.post('/api/location', (req, res) => {
    const { latitude, longitude, accuracy } = req.body;
    if (!latitude || !longitude) {
        return res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
    }
    saveToDatabase('location', { latitude, longitude, accuracy });
    res.json({ success: true, message: 'تم حفظ الموقع' });
});

app.post('/api/snapshot', (req, res) => {
    const { image } = req.body;
    if (!image) {
        return res.status(400).json({ success: false, message: 'لا توجد صورة' });
    }
    saveToDatabase('snapshot', image);
    res.json({ success: true, message: 'تم حفظ الصورة' });
});

app.listen(PORT, () => {
    console.log(`الخادم يعمل على المنفذ ${PORT}`);
});
