document.addEventListener('DOMContentLoaded', () => {
    initAdmin();

    document.getElementById('btn-logout').addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/admin/login';
    });

    document.getElementById('course-form').addEventListener('submit', saveCourse);
});

async function initAdmin() {
    const res = await fetch('/api/admin/courses');
    if (res.status === 401) return window.location.href = '/admin/login';

    const courses = await res.json();
    renderCourseList(courses);

    const setRes = await fetch('/api/settings');
    const settings = await setRes.json();
    if (settings.hero_title) document.getElementById('hero_title').value = settings.hero_title;
    if (settings.hero_subtitle) document.getElementById('hero_subtitle').value = settings.hero_subtitle;
}

async function saveSettings() {
    await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            hero_title: document.getElementById('hero_title').value,
            hero_subtitle: document.getElementById('hero_subtitle').value
        })
    });
    alert('Configurações publicadas com sucesso!');
}

async function saveCourse(e) {
    e.preventDefault();
    const data = {
        id: document.getElementById('course_id').value || null,
        title: document.getElementById('course_title').value,
        description: document.getElementById('course_desc').value,
        image: document.getElementById('course_image').value,
        price: parseFloat(document.getElementById('course_price').value),
        cakto_link: document.getElementById('course_cakto').value,
        what_will_learn: document.getElementById('course_learn').value,
        target_audience: document.getElementById('course_target').value,
        modules: document.getElementById('course_modules').value,
        active: document.getElementById('course_active').checked ? 1 : 0
    };

    await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    alert('Curso salvo!');
    location.reload();
}

function renderCourseList(courses) {
    const list = document.getElementById('admin-courses-list');
    list.innerHTML = courses.map(c => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 12px; border-bottom: 1px solid var(--border);">
            <div>
                <strong>${c.title}</strong> - R$ ${parseFloat(c.price).toFixed(2)} [${c.active ? 'Ativo' : 'Inativo'}]
                <br><small style="color: var(--accent);">${c.cakto_link}</small>
            </div>
            <button onclick="deleteCourse(${c.id})" style="background:#ef4444; border:none; color:#fff; padding:6px 12px; border-radius:4px; cursor:pointer;">Deletar</button>
        </div>
    `).join('');
}

async function deleteCourse(id) {
    if (confirm('Deseja excluir este curso?')) {
        await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
        initAdmin();
    }
}