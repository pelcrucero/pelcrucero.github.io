document.addEventListener('DOMContentLoaded', () => {
    const products = {
        comida: [
            { name: 'Morcilla', price: 1.7, quantity: 0 },
            { name: 'Chorizo', price: 1.7, quantity: 0 },
            { name: 'Morro', price: 1.7, quantity: 0 },
            { name: 'Tortilla', price: 1.7, quantity: 0 },                        
            { name: 'Langostinos', price: 2, quantity: 0 },
            { name: 'Patatas / Chaskis', price: 1, quantity: 0 }
        ],
        bebida: [
            { name: 'Caña/Con Limón', price: 1.3, quantity: 0 },
            { name: 'Vino', price: 1.3, quantity: 0 },
            { name: 'Cachi', price: 4.5, quantity: 0 },
            { name: 'Refresco', price: 1.7, quantity: 0 },
            { name: 'Mosto', price: 1, quantity: 0 },
            { name: 'Agua', price: 1, quantity: 0 },
            { name: 'Café', price: 1, quantity: 0 },
        ]
    };

    function renderProducts(category) {
        const container = document.getElementById(category);
        container.innerHTML = '';
        products[category].forEach((product, index) => {
            const productElement = document.createElement('div');
            productElement.className = 'product';
            productElement.innerHTML = `
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
            container.appendChild(productElement);
        });
        updateTotal();
    }

    window.updateQuantity = function(category, index, change) {
        products[category][index].quantity += change;
        if (products[category][index].quantity < 0) {
            products[category][index].quantity = 0;
        }
        renderProducts(category);
    }

    window.setQuantity = function(category, index, value) {
        const quantity = parseInt(value);
        if (!isNaN(quantity) && quantity >= 0) {
            products[category][index].quantity = quantity;
        }
        renderProducts(category);
    }

    window.openTab = function(category) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        document.getElementById(category).style.display = 'block';
        document.querySelectorAll('.tab-link').forEach(button => {
            button.classList.remove('tab-selected');
        });
        document.querySelector(`.tab-link-${category}`).classList.add('tab-selected');
        renderProducts(category);
    }

    function updateTotal() {
        let total = 0;
        Object.keys(products).forEach(category => {
            products[category].forEach(product => {
                total += product.quantity * product.price;
            });
        });
        document.getElementById('total-amount').textContent = total.toFixed(2) + '€';
        const totalAmountBottom = document.getElementById('total-amount');
        if (totalAmountBottom) {
            totalAmountBottom.textContent = total.toFixed(2) + '€';
        }
        if(document.getElementById('payment-input').value != ""){
            calculateChange();
        }
    }

    window.resetQuantities = function() {
        Object.keys(products).forEach(category => {
            products[category].forEach(product => {
                product.quantity = 0;
            });
        });
        renderProducts(document.querySelector('.tab-content:not([style*="display: none"])').id);
        document.getElementById('payment-input').value="";
        updateTotal();
        calculateChange();
    }

    window.calculateChange = function() {
        const totalAmountElement = document.getElementById('total-amount');
        const totalAmount = totalAmountElement ? parseFloat(totalAmountElement.textContent.replace('€', '')) : 0;
        const paymentInput = document.getElementById('payment-input').value.replace(',', '.');
        const paymentAmount = parseFloat(paymentInput) || 0;
        const change = paymentAmount - totalAmount;
        document.getElementById('change-amount').textContent = change.toFixed(2) + '€';
    }

    document.getElementById('payment-input').addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9.,]/g, '');
    });

    openTab('comida');
});
