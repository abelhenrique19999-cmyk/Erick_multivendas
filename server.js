const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Sessão Segura
app.use(session({
    secret: 'segredo_super_seguro_cakto_2026_mkt',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Mudar para true se usar HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 4 // Duracao: 4 horas
    }
}));

// Banco de Dados SQLite
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) console.error("Erro SQLite:", err);
    else console.log("Banco de dados SQLite conectado.");
});

// Inicialização de Tabelas
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        image TEXT,
        price REAL,
        cakto_link TEXT,
        what_will_learn TEXT,
        target_audience TEXT,
        modules TEXT,
        active INTEGER DEFAULT 1
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS faqs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT,
        answer TEXT
    )`);

    // Admin Padrão (Email: admin@mkt.com | Senha: admin123password)
    db.get("SELECT * FROM admins WHERE email = ?", ['admin@mkt.com'], async (err, row) => {
        if (!row) {
            const hash = await bcrypt.hash('admin123password', 10);
            db.run("INSERT INTO admins (email, password) VALUES (?, ?)", ['admin@mkt.com', hash]);
            console.log("Admin padrao criado: admin@mkt.com / admin123password");
        }
    });

    // Configurações Padrão Iniciais
    const defaults = [
        ['hero_title', 'Aprenda Marketing Digital e Comece a Construir Seu Próprio Negócio'],
        ['hero_subtitle', 'Cursos do zero ao avançado para quem deseja criar uma estrutura de vendas online altamente lucrativa.'],
        ['contact_email', 'suporte@suaempresa.com'],
        ['contact_phone', '(11) 99999-9999']
    ];
    defaults.forEach(([key, val]) => {
        db.run("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", [key, val]);
    });
});

// Middleware de Autenticação Segura
function checkAuth(req, res, next) {
    if (req.session && req.session.adminId) {
        return next();
    }
    return res.status(401).json({ error: "Acesso não autorizado." });
}

/* ================= ROTAS DE AUTENTICAÇÃO ================= */

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM admins WHERE email = ?", [email], async (err, admin) => {
        if (err || !admin) return res.status(400).json({ error: "E-mail ou senha incorretos." });
        const match = await bcrypt.compare(password, admin.password);
        if (!match) return res.status(400).json({ error: "E-mail ou senha incorretos." });

        req.session.adminId = admin.id;
        res.json({ message: "Login autorizado." });
    });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: "Sessão encerrada." });
});

app.post('/api/auth/change-password', checkAuth, async (req, res) => {
    const { newPassword } = req.body;
    const hash = await bcrypt.hash(newPassword, 10);
    db.run("UPDATE admins SET password = ? WHERE id = ?", [hash, req.session.adminId], (err) => {
        if (err) return res.status(500).json({ error: "Erro ao alterar a senha." });
        res.json({ message: "Senha alterada com sucesso!" });
    });
});

/* ================= ROTAS PÚBLICAS ================= */

app.get('/api/settings', (req, res) => {
    db.all("SELECT * FROM settings", [], (err, rows) => {
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        res.json(settings);
    });
});

app.get('/api/courses', (req, res) => {
    db.all("SELECT * FROM courses WHERE active = 1", [], (err, rows) => {
        res.json(rows);
    });
});

app.get('/api/courses/:id', (req, res) => {
    db.get("SELECT * FROM courses WHERE id = ? AND active = 1", [req.params.id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: "Curso não encontrado." });
        res.json(row);
    });
});

app.get('/api/faqs', (req, res) => {
    db.all("SELECT * FROM faqs", [], (err, rows) => res.json(rows));
});

/* ================= ROTAS ADMINISTRATIVAS ================= */

app.get('/api/admin/courses', checkAuth, (req, res) => {
    db.all("SELECT * FROM courses", [], (err, rows) => res.json(rows));
});

app.post('/api/admin/courses', checkAuth, (req, res) => {
    const { id, title, description, image, price, cakto_link, what_will_learn, target_audience, modules, active } = req.body;
    
    if (id) {
        db.run(`UPDATE courses SET title=?, description=?, image=?, price=?, cakto_link=?, what_will_learn=?, target_audience=?, modules=?, active=? WHERE id=?`,
        [title, description, image, price, cakto_link, what_will_learn, target_audience, modules, active, id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Curso atualizado com sucesso!" });
        });
    } else {
        db.run(`INSERT INTO courses (title, description, image, price, cakto_link, what_will_learn, target_audience, modules, active) VALUES (?,?,?,?,?,?,?,?,?)`,
        [title, description, image, price, cakto_link, what_will_learn, target_audience, modules, active ?? 1], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Curso criado com sucesso!", id: this.lastID });
        });
    }
});

app.delete('/api/admin/courses/:id', checkAuth, (req, res) => {
    db.run("DELETE FROM courses WHERE id = ?", [req.params.id], (err) => {
        res.json({ message: "Curso removido!" });
    });
});

app.post('/api/admin/settings', checkAuth, (req, res) => {
    const settings = req.body;
    const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    for (const [key, value] of Object.entries(settings)) {
        stmt.run(key, value);
    }
    stmt.finalize();
    res.json({ message: "Configurações atualizadas!" });
});

app.post('/api/admin/faqs', checkAuth, (req, res) => {
    const { question, answer } = req.body;
    db.run("INSERT INTO faqs (question, answer) VALUES (?, ?)", [question, answer], function(err) {
        res.json({ id: this.lastID });
    });
});

app.delete('/api/admin/faqs/:id', checkAuth, (req, res) => {
    db.run("DELETE FROM faqs WHERE id = ?", [req.params.id], (err) => res.json({ message: "FAQ deletada." }));
});

// Redirecionamentos de suporte
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public/admin/index.html')));
app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, 'public/admin/login.html')));

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));