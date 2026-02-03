document.addEventListener('DOMContentLoaded', () => {
    
    // --- VARIABLES DE ESTADO Y ELEMENTOS DOM ---
    const inputAmount = document.getElementById('input');
    const clearBtn = document.querySelector('.clear-button');
    const calcOverlay = document.getElementById('calculator-overlay');
    const calcPreview = document.getElementById('calc-preview');
    const calcClose = document.getElementById('calc-close');
    
    // Categorías
    const chips = document.querySelectorAll('.chip');
    const moreBtn = document.querySelector('.more');
    const moreText = document.querySelector('.more-text');
    const secondaryTypes = document.getElementById('secondary-types');
    const fixedTab = document.querySelector('.fixed-tab');
    const flexibleTab = document.querySelector('.flexible-tab');
    const expensesTypesDiv = document.querySelector('.expenses-types');
    const transferTypesDiv = document.querySelector('.transfer-types');
    
    // Cards de acción
    const cardDate = document.querySelector('.info-name:contains("Date")') ? null : document.querySelectorAll('.selection-card')[1]; 
    // Nota: Seleccionamos por índice basado en tu HTML actual (0:Sub, 1:Date, 2:Account, 3:Note)
    const cardSubCategory = document.querySelectorAll('.selection-card')[0];
    const cardAccount = document.querySelectorAll('.selection-card')[2];
    const cardNote = document.querySelectorAll('.selection-card')[3];
    
    // Hidden Inputs
    const hiddenCategory = document.getElementById('selected-category');
    
    // --- INICIALIZACIÓN ---
    let currentAmount = "";
    
    // Establecer fecha de hoy por defecto visualmente (más adelante lógica real)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('selected-date').value = today;

    // --- 1. LÓGICA DE INPUT Y CALCULADORA ---
    
    // Detectar si estamos en móvil para abrir calculadora custom
    inputAmount.addEventListener('click', (e) => {
        if (window.innerWidth < 480) {
            e.preventDefault(); 
            inputAmount.blur(); // Quitar foco nativo
            openCalculator();
        }
    });

    function openCalculator() {
        calcOverlay.classList.remove('hidden');
        currentAmount = inputAmount.value || "0";
        calcPreview.innerText = currentAmount;
    }

    calcClose.addEventListener('click', () => {
        calcOverlay.classList.add('hidden');
        inputAmount.value = calcPreview.innerText;
        // Trigger visual update if needed
    });

    // Lógica de botones de la calculadora
    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const num = btn.dataset.num;
            const op = btn.dataset.op;

            if (num !== undefined) {
                if (currentAmount === "0" && num !== ".") currentAmount = "";
                currentAmount += num;
            } else if (op) {
                handleCalcOperation(op);
            }
            
            calcPreview.innerText = currentAmount;
        });
    });

    function handleCalcOperation(op) {
        if (op === 'C') {
            currentAmount = "0";
        } else if (op === 'back') {
            currentAmount = currentAmount.slice(0, -1) || "0";
        } else if (op === '=') {
            try {
                // Precaución: eval es peligroso en producción real, aquí es prototipo.
                // En prod usar una librería de math o parser seguro.
                currentAmount = String(eval(currentAmount)); 
            } catch {
                currentAmount = "Error";
            }
        } else {
            // Operadores +, -, *, /, %
            // Evitar doble operador seguido
            const lastChar = currentAmount.slice(-1);
            if ("+-*/%".includes(lastChar)) {
                currentAmount = currentAmount.slice(0, -1);
            }
            currentAmount += op;
        }
    }

    // Botón borrar input principal
    window.clearInput = function() {
        inputAmount.value = "";
        currentAmount = "0";
    };

    // --- 2. LÓGICA DE CATEGORÍAS (CHIPS) ---
    
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Remover clase activa de todos
            chips.forEach(c => c.classList.remove('active-chip'));
            // Activar clickeado
            chip.classList.add('active-chip');
            
            const type = chip.innerText.toLowerCase() || chip.dataset.value;
            hiddenCategory.value = type;
            
            updateUIBasedOnCategory(type);
        });
    });

    // Inicializar Expense como activo
    chips[0].classList.add('active-chip');

    // Botón More/Less
    moreBtn.addEventListener('click', () => {
        secondaryTypes.classList.toggle('hidden');
        const isHidden = secondaryTypes.classList.contains('hidden');
        
        moreText.innerText = isHidden ? "More" : "Less";
        // Rotar icono flecha (opcional con CSS class, por ahora simple)
    });

    function updateUIBasedOnCategory(type) {
        // Reset UI
        expensesTypesDiv.classList.add('hidden');
        transferTypesDiv.classList.add('hidden');
        
        // Logica condicional
        if (type === 'expense') {
            expensesTypesDiv.classList.remove('hidden');
        } else if (type === 'transfer') {
            transferTypesDiv.classList.remove('hidden');
        } else {
            // Income, Investment, Savings, Loans -> No muestran extras
        }
    }

    // Tabs Fixed / Flexible
    fixedTab.addEventListener('click', () => {
        fixedTab.classList.add('active-tab-fixed');
        flexibleTab.classList.remove('active-tab-flexible');
        // Guardar estado en variable si es necesario
    });

    flexibleTab.addEventListener('click', () => {
        flexibleTab.classList.add('active-tab-flexible');
        fixedTab.classList.remove('active-tab-fixed');
    });


    // --- 3. LOGICA DE ACCIONABLES (MODALES & DATE) ---

    // Date Picker Nativo
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.style.position = 'absolute'; 
    dateInput.style.opacity = '0'; // Invisible pero funcional
    dateInput.style.height = '0';
    document.body.appendChild(dateInput);

    cardDate.addEventListener('click', () => {
        dateInput.showPicker(); // API moderna de navegadores
    });

    dateInput.addEventListener('change', (e) => {
        const selected = new Date(e.target.value);
        // Actualizar texto visual en la card
        cardDate.querySelector('.selection-name').innerText = selected.toLocaleDateString();
        document.getElementById('selected-date').value = e.target.value;
    });

    // Modales Genéricos
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    const modalTitle = document.getElementById('modal-title');
    const closeModalBtn = document.getElementById('close-modal-btn');

    function openModal(title, items, callback) {
        modalTitle.innerText = title;
        modalContent.innerHTML = ''; // Limpiar
        
        if (title === "Note") {
             modalContent.innerHTML = `<textarea style="width:100%; height:100px; background:#333; color:white; border:none; padding:10px; border-radius:8px;" placeholder="Write a note..."></textarea><button id="save-note" class="primary-button" style="margin-top:10px; height:40px;">Save</button>`;
             document.getElementById('save-note').addEventListener('click', () => {
                 const txt = modalContent.querySelector('textarea').value;
                 document.getElementById('note-text').value = txt;
                 cardNote.querySelector('.selection-name').innerText = txt ? "Note added" : "Select";
                 modalOverlay.classList.add('hidden');
             });
        } else {
            // Lista de items
            items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'modal-list-item';
                div.innerText = item;
                div.addEventListener('click', () => {
                    callback(item);
                    modalOverlay.classList.add('hidden');
                });
                modalContent.appendChild(div);
            });
        }
        
        modalOverlay.classList.remove('hidden');
    }

    closeModalBtn.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
    });

    // Eventos Cards
    cardSubCategory.addEventListener('click', () => {
        // Ejemplo de datos, luego vendrán de tu base real
        const subs = ["Food", "Transport", "Health", "Entertainment"];
        openModal("Sub Category", subs, (val) => {
            cardSubCategory.querySelector('.selection-name').innerText = val;
            document.getElementById('selected-subcategory').value = val;
        });
    });

    cardAccount.addEventListener('click', () => {
        const accounts = ["Cash", "BBVA Debit", "Credit Card"];
        openModal("Account", accounts, (val) => {
            cardAccount.querySelector('.selection-name').innerText = val;
        });
    });
    
    cardNote.addEventListener('click', () => {
        openModal("Note", [], null);
    });

    // --- 4. SUBMIT ---
    document.querySelector('.primary-button').addEventListener('click', () => {
        alert("Transaction Created! (Data ready to send to Sheets)");
        // Aquí iría la lógica de fetch() para Google Sheets
    });

});