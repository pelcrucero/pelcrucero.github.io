document.addEventListener('DOMContentLoaded', () => {

    let products = { comida: [], bebida: [] };
    let currentTab = 'comida';

    const DEFAULT_PRODUCTS = [
        { name: 'Morcilla',        price: 1.7, category: 'comida', order: 1 },
        { name: 'Chorizo',         price: 1.7, category: 'comida', order: 2 },
        { name: 'Morro',           price: 1.7, category: 'comida', order: 3 },
        { name: 'Tortilla',        price: 1.7, category: 'comida', order: 4 },
        { name: 'Langostinos',     price: 2.5, category: 'comida', order: 5 },
        { name: 'Caña/Con Limón',  price: 1.3, category: 'bebida', order: 1 },
        { name: 'Vaso Calimocho',  price: 2.0, category: 'bebida', order: 2 },
        { name: 'Tinto de Verano', price: 2.0, category: 'bebida', order: 3 },
        { name: 'Vino',            price: 1.3, category: 'bebida', order: 4 },
        { name: 'Cachi',           price: 4.5, category: 'bebida', order: 5 },
        { name: 'Refresco',        price: 1.7, category: 'bebida', order: 6 },
        { name: 'Mosto',           price: 1.0, category: 'bebida', order: 7 },
        { name: 'Agua',            price: 1.0, category: 'bebida', order: 8 }
    ];

    async function loadProducts() {
        try {
            const stored = localStorage.getItem('pelcrucero_products');
            if (stored) {
                buildProductsFromArray(JSON.parse(stored));
            } else {
                const res = await fetch('productos.json');
                buildProductsFromArray(await res.json());
            }
        } catch (_) {
            buildProductsFromArray(DEFAULT_PRODUCTS);
        }
        openTab('comida');
    }

    function buildProductsFromArray(arr) {
        products = { comida: [], bebida: [] };
        [...arr].sort((a, b) => a.order - b.order).forEach(item => {
            const cat = item.category;
            if (products[cat]) {
                products[cat].push({ name: item.name, price: item.price, order: item.order, quantity: 0 });
            }
        });
    }

    function productsToArray() {
        const arr = [];
        ['comida', 'bebida'].forEach(cat => {
            products[cat].forEach(p => arr.push({ name: p.name, price: p.price, category: cat, order: p.order }));
        });
        return arr;
    }

    function renderProducts(category) {
        const container = document.getElementById(category);
        container.innerHTML = '';
        products[category].forEach((product, index) => {
            const el = document.createElement('div');
            el.className = 'product';
            el.innerHTML = `
                <div>
                    <span class="product-name">${product.name}</span>
                    <span class="product-price">${product.price.toFixed(2)}€</span>
                </div>
                <div class="product-controls">
                    <button class="${product.quantity > 0 ? 'button-nonzero' : 'button-zero'}" onclick="updateQuantity('${category}', ${index}, -1)">-</button>
                    <input type="number" value="${product.quantity}" onchange="setQuantity('${category}', ${index}, this.value)">
                    <button class="${product.quantity > 0 ? 'button-nonzero' : 'button-zero'}" onclick="updateQuantity('${category}', ${index}, 1)">+</button>
                </div>
            `;
            container.appendChild(el);
        });
        updateTotal();
    }

    window.updateQuantity = function(category, index, change) {
        products[category][index].quantity += change;
        if (products[category][index].quantity < 0) products[category][index].quantity = 0;
        renderProducts(category);
    };

    window.setQuantity = function(category, index, value) {
        const qty = parseInt(value);
        if (!isNaN(qty) && qty >= 0) products[category][index].quantity = qty;
        renderProducts(category);
    };

    window.openTab = function(category) {
        currentTab = category;
        document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
        document.getElementById(category).style.display = 'block';
        document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('tab-selected'));
        document.querySelector(`.tab-link-${category}`).classList.add('tab-selected');
        renderProducts(category);
    };

    function updateTotal() {
        let total = 0;
        Object.keys(products).forEach(cat => {
            products[cat].forEach(p => { total += p.quantity * p.price; });
        });
        document.getElementById('total-amount').textContent = total.toFixed(2) + '€';
        if (document.getElementById('payment-input').value !== '') calculateChange();
    }

    window.resetQuantities = function() {
        Object.keys(products).forEach(cat => {
            products[cat].forEach(p => { p.quantity = 0; });
        });
        renderProducts(currentTab);
        document.getElementById('payment-input').value = '';
        updateTotal();
        calculateChange();
    };

    window.calculateChange = function() {
        const total = parseFloat(document.getElementById('total-amount').textContent.replace('€', '')) || 0;
        const payment = parseFloat(document.getElementById('payment-input').value.replace(',', '.')) || 0;
        document.getElementById('change-amount').textContent = (payment - total).toFixed(2) + '€';
    };

    document.getElementById('payment-input').addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9.,]/g, '');
    });

    // ── Admin panel ──────────────────────────────────────────────

    function openAdmin() {
        document.getElementById('admin-overlay').style.display = 'flex';
        document.getElementById('admin-login').style.display = 'flex';
        document.getElementById('admin-panel').style.display = 'none';
        document.getElementById('admin-user').value = '';
        document.getElementById('admin-pass').value = '';
        document.getElementById('admin-error').textContent = '';
        document.getElementById('admin-gh-token').value = localStorage.getItem('pelcrucero_gh_token') || window.GH_TOKEN || '';
        setTimeout(() => document.getElementById('admin-user').focus(), 50);
    }

    window.adminLogin = function() {
        const user = document.getElementById('admin-user').value;
        const pass = document.getElementById('admin-pass').value;
        if (user === 'admin' && pass === 'pelcrucero') {
            document.getElementById('admin-login').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'flex';
            renderAdminTable();
        } else {
            document.getElementById('admin-error').textContent = 'Usuario o contraseña incorrectos';
        }
    };

    document.getElementById('admin-pass').addEventListener('keydown', e => {
        if (e.key === 'Enter') window.adminLogin();
    });

    function renderAdminTable() {
        const arr = productsToArray().sort((a, b) => {
            if (a.category !== b.category) return a.category === 'comida' ? -1 : 1;
            return a.order - b.order;
        });
        const tbody = document.getElementById('admin-table-body');
        tbody.innerHTML = '';
        arr.forEach(p => tbody.appendChild(createAdminRow(p)));
    }

    function createAdminRow(p) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="number" class="adm-order" value="${p.order}" min="1"></td>
            <td><input type="text"   class="adm-name"  value="${p.name}"></td>
            <td><input type="number" class="adm-price" value="${p.price}" step="0.1" min="0"></td>
            <td>
                <select class="adm-category">
                    <option value="comida" ${p.category === 'comida' ? 'selected' : ''}>Comida</option>
                    <option value="bebida" ${p.category === 'bebida' ? 'selected' : ''}>Bebida</option>
                </select>
            </td>
            <td><button class="adm-delete" onclick="this.closest('tr').remove()">Borrar</button></td>
        `;
        tr.querySelector('.adm-order').addEventListener('change', () => normalizeOrders(tr));
        return tr;
    }

    function normalizeOrders(triggerRow) {
        const cat = triggerRow.querySelector('.adm-category').value;
        const rows = [...document.querySelectorAll('#admin-table-body tr')]
            .filter(tr => tr.querySelector('.adm-category').value === cat);

        // Ordenar por valor actual; en empate el triggerRow gana (ocupa la posición que pidió)
        rows.sort((a, b) => {
            const oa = parseInt(a.querySelector('.adm-order').value) || 1;
            const ob = parseInt(b.querySelector('.adm-order').value) || 1;
            if (oa !== ob) return oa - ob;
            return a === triggerRow ? -1 : 1;
        });

        // Reasignar números secuenciales
        rows.forEach((tr, i) => { tr.querySelector('.adm-order').value = i + 1; });
    }

    window.adminAddItem = function() {
        const tbody = document.getElementById('admin-table-body');
        const orders = [...tbody.querySelectorAll('tr')]
            .filter(tr => tr.querySelector('.adm-category').value === 'comida')
            .map(tr => parseInt(tr.querySelector('.adm-order').value) || 0);
        const nextOrder = orders.length ? Math.max(...orders) + 1 : 1;
        tbody.appendChild(createAdminRow({ name: '', price: 0, category: 'comida', order: nextOrder }));
        tbody.lastElementChild.querySelector('.adm-name').focus();
    };

    window.adminSave = async function() {
        const arr = [];
        document.querySelectorAll('#admin-table-body tr').forEach(tr => {
            const name = tr.querySelector('.adm-name').value.trim();
            if (!name) return;
            arr.push({
                name,
                price:    parseFloat(tr.querySelector('.adm-price').value)    || 0,
                category: tr.querySelector('.adm-category').value,
                order:    parseInt(tr.querySelector('.adm-order').value)       || 1
            });
        });
        // Garantizar órdenes secuenciales por categoría antes de guardar
        ['comida', 'bebida'].forEach(cat => {
            const items = arr.filter(p => p.category === cat).sort((a, b) => a.order - b.order);
            items.forEach((p, i) => { p.order = i + 1; });
        });

        // Guardar token si se ha introducido
        const token = document.getElementById('admin-gh-token').value.trim();
        if (token) localStorage.setItem('pelcrucero_gh_token', token);

        // Persistir localmente y refrescar la app
        localStorage.setItem('pelcrucero_products', JSON.stringify(arr));
        buildProductsFromArray(arr);
        renderProducts(currentTab);

        // Subir a GitHub si hay token
        if (token) {
            showToast('Subiendo a GitHub…', '#1e3d59');
            const ok = await pushToGitHub(arr, token);
            showToast(
                ok ? 'Guardado y subido a GitHub ✓' : 'Error al subir a GitHub. Revisa el token.',
                ok ? '#5cb85c' : '#d9534f'
            );
        } else {
            showToast('Guardado localmente (sin token GitHub)');
        }
    };

    async function pushToGitHub(arr, token) {
        const apiUrl = 'https://api.github.com/repos/pelcrucero/pelcrucero.github.io/contents/productos.json';
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };
        try {
            // Obtener SHA si el fichero ya existe; si no existe (404) se crea nuevo
            const getRes = await fetch(apiUrl, { headers });
            let sha = null;
            if (getRes.ok) {
                sha = (await getRes.json()).sha;
            } else if (getRes.status !== 404) {
                return false;
            }

            const json = JSON.stringify(arr, null, 2);
            const content = btoa(unescape(encodeURIComponent(json)));
            const body = { message: 'Actualizar productos desde panel de administración', content };
            if (sha) body.sha = sha;

            const putRes = await fetch(apiUrl, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            return putRes.ok;
        } catch (_) {
            return false;
        }
    }

    window.adminClose = function() {
        document.getElementById('admin-overlay').style.display = 'none';
    };

    function showToast(msg, color = '#5cb85c') {
        const toast = document.createElement('div');
        toast.className = 'admin-toast';
        toast.style.background = color;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    document.getElementById('logo-admin-trigger').addEventListener('dblclick', openAdmin);

    loadProducts();
});
