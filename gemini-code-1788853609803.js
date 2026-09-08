document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadCourses();
    loadFAQs();
});

async function loadSettings() {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.hero_title) document.getElementById('hero-title').innerText = data.hero_title;
    if (data.hero_subtitle) document.getElementById('hero-subtitle').innerText = data.hero_subtitle;
    if (data.contact_email) document.getElementById('contact-info').innerText = `Contato: ${data.contact_email} | ${data.contact_phone || ''}`;
}

async function loadCourses() {
    const res = await fetch('/api/courses');
    const courses = await res.json();
    const grid = document.getElementById('courses-grid');
    grid.innerHTML = '';

    courses.forEach(c => {
        grid.innerHTML += `
            <div class="card">
                <img src="${c.image || 'https://via.placeholder.com/400x200'}" alt="${c.title}">
                <div class="card-content">
                    <h3 class="card-title">${c.title}</h3>
                    <p class="card-desc">${c.description}</p>
                    <div class="card-price">R$ ${parseFloat(c.price).toFixed(2)}</div>
                    <div style="display:flex; gap: 10px; margin-top: auto;">
                        <a href="/curso.html?id=${c.id}" class="btn-secondary" style="flex:1;">Detalhes</a>
                        <a href="${c.cakto_link}" target="_blank" class="btn-buy" style="flex:1;">Comprar</a>
                    </div>
                </div>
            </div>
        `;
    });
}

async function loadFAQs() {
    const res = await fetch('/api/faqs');
    const faqs = await res.json();
    const container = document.getElementById('faq-list');
    container.innerHTML = faqs.map(f => `
        <div style="background: var(--bg-card); padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid var(--border);">
            <h4 style="font-size:1.1rem; margin-bottom: 0.5rem;">${f.question}</h4>
            <p style="color: var(--text-muted);">${f.answer}</p>
        </div>
    `).join('');
}