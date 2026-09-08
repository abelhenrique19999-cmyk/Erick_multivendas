document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) return window.location.href = '/';

    const res = await fetch(`/api/courses/${id}`);
    if (!res.ok) return window.location.href = '/';

    const c = await res.json();

    document.getElementById('course-detail').innerHTML = `
        <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
            <img src="${c.image}" style="max-width: 450px; width: 100%; border-radius: 8px; object-fit: cover;">
            <div style="flex: 1; min-width: 280px;">
                <h1 style="font-size: 2.2rem; margin-bottom: 1rem;">${c.title}</h1>
                <p style="color: var(--text-muted); margin-bottom: 1.5rem;">${c.description}</p>
                <div style="font-size: 2.2rem; font-weight: 800; color: var(--accent); margin-bottom: 1.5rem;">R$ ${parseFloat(c.price).toFixed(2)}</div>
                <a href="${c.cakto_link}" target="_blank" class="btn-buy" style="padding: 1rem; font-size: 1.1rem;">COMPRAR AGORA NO CHECKOUT CAKTO</a>
            </div>
        </div>
        <hr style="border: 0; border-top: 1px solid var(--border); margin: 2rem 0;">
        <div>
            <h3 style="margin-bottom: 0.5rem;">O que você vai aprender</h3>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">${c.what_will_learn || 'Treinamento prático direto ao ponto.'}</p>
            
            <h3 style="margin-bottom: 0.5rem;">Para quem é este curso</h3>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">${c.target_audience || 'Para iniciantes que desejam vender no digital.'}</p>
            
            <h3 style="margin-bottom: 0.5rem;">Conteúdo e Módulos</h3>
            <p style="color: var(--text-muted);">${c.modules || 'Acesso imediato após a confirmação do pagamento.'}</p>
        </div>
    `;
});