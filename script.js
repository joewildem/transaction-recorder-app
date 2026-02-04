document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 0. BLOQUE MAESTRO DE REFERENCIAS (GLOBALES)
    // ==========================================
    // Aquí definimos las cosas que se usan en varias secciones para no repetir y evitar errores
    
    // Tarjetas principales
    const settingsCards = document.querySelectorAll('.selection-card');
    
    if (settingsCards.length < 4) {
        console.error("Error Crítico: No encuentro las 4 tarjetas. Revisa el HTML.");
    }

    const cardSubCategory = settingsCards[0]; 
    const cardDate        = settingsCards[1]; 
    const cardAccount     = settingsCards[2]; 
    const cardNote        = settingsCards[3];

    // --- ESTADO INICIAL: BLOQUEADO ---
    // La tarjeta nace deshabilitada hasta que el usuario elija algo
    cardSubCategory.classList.add('card-disabled');

    // Componentes del Modal
    const modalOverlay = document.getElementById('modal-overlay');
    const innerModalCard = document.querySelector('.modal-card'); // La tarjeta blanca
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // Inputs Ocultos
    const hiddenCategory = document.getElementById('selected-category');
    const subCategoryInputHidden = document.getElementById('selected-subcategory');
    const fromInputHidden = document.getElementById('selected-account-from');
    const toInputHidden = document.getElementById('selected-account-to');
    
    // Textos dinámicos
    const fromSelectionText = document.querySelector('.from-selection');
    const toSelectionText = document.querySelector('.to-selection');

    console.log("Sistema iniciado correctamente.");

    // ==========================================
    // SECCIÓN 1: INPUT, CALCULADORA Y FORMATO
    // ==========================================

    const inputAmount = document.getElementById('input');
    
    // Elementos de la Calculadora
    const calcOverlay = document.getElementById('calculator-overlay');
    const calcPreview = document.getElementById('calc-preview');
    const calcButtons = document.querySelectorAll('.calc-btn');
    
    // NUEVO: Referencia al botón de calculadora en el header
    const calcIcon = document.querySelector('.header-icon'); 

    // Variable interna para guardar la operación "pura"
    let currentCalcString = "0"; 

    // --- A. FUNCIONES DE FORMATO ---
    function formatNumber(numStr) {
        if (!numStr) return "";
        const parts = numStr.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join('.');
    }

    function formatExpression(expr) {
        const parts = expr.split(/([+\-*/%])/);
        return parts.map(part => {
            if ("+-*/%".includes(part)) return ` ${part} `;
            return formatNumber(part);
        }).join('');
    }

    function updateCalcDisplay() {
        calcPreview.innerText = formatExpression(currentCalcString);
    }

    // --- B. EVENTOS INPUT (Teclado Nativo) ---
    
    // Escuchar lo que escribe el usuario para formatearlo y actualizar la variable
    inputAmount.addEventListener('input', (e) => {
        // 1. Limpieza y validación básica
        let rawValue = inputAmount.value.replace(/,/g, '');
        if (isNaN(rawValue) && rawValue !== ".") rawValue = "";
        
        // 2. Formatear visualmente (poner comas)
        inputAmount.value = formatNumber(rawValue);
        
        // 3. IMPORTANTE: Sincronizar con la variable de la calculadora
        // Así, si luego abres la calculadora, ya tiene lo que escribiste a mano.
        currentCalcString = rawValue || "0";
    });

    // --- C. ABRIR CALCULADORA (Solo con el Icono) ---
    
    if (calcIcon) {
        calcIcon.addEventListener('click', () => {
            // 1. Ocultar teclado nativo (quita el foco del input)
            inputAmount.blur();
            
            // 2. Preparar datos
            // Nos aseguramos que la calculadora inicie con lo que haya en el input
            let val = inputAmount.value.replace(/,/g, '') || "0";
            currentCalcString = val;
            updateCalcDisplay();
            
            // 3. Mostrar Overlay
            calcOverlay.classList.remove('hidden');
        });
    }

    // --- D. LÓGICA DE BOTONES DE CALCULADORA (Igual que antes) ---
    calcButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const num = btn.dataset.num;
            const op = btn.dataset.op;

            if (num !== undefined) {
                if (currentCalcString === "0" && num !== ".") {
                    currentCalcString = num;
                } else {
                    currentCalcString += num;
                }
            } 
            else if (op) {
                if (op === 'C') { currentCalcString = "0"; } 
                else if (op === 'del') { 
                    currentCalcString = currentCalcString.slice(0, -1);
                    if (currentCalcString === "") currentCalcString = "0";
                } 
                else if (op === 'neg') { 
                    try {
                        let val = eval(currentCalcString) * -1;
                        currentCalcString = val.toString();
                    } catch {}
                } 
                else if (op === '=') {
                    try {
                        // Lógica de porcentaje y evaluación
                        let expression = currentCalcString.replace(/(\d+(?:\.\d+)?)([\+\-])(\d+(?:\.\d+)?)%/g, (match, num1, operator, num2) => {
                            const val1 = parseFloat(num1);
                            const val2 = parseFloat(num2);
                            return `${val1}${operator}${(val1 * val2) / 100}`;
                        });
                        expression = expression.replace(/%/g, '/100');
                        
                        let result = eval(expression).toString();
                        
                        // Redondeo a 2 decimales si es necesario
                        if (result.includes('.')) {
                             result = parseFloat(result).toFixed(2);
                             if (result.endsWith('.00')) result = result.slice(0, -3);
                        }
                        currentCalcString = result;
                        inputAmount.value = formatNumber(currentCalcString);
                    } catch { currentCalcString = "Error"; }
                } 
                else { // Operadores +, -, *, /
                    const lastChar = currentCalcString.slice(-1);
                    if ("+-*/%".includes(lastChar)) {
                        currentCalcString = currentCalcString.slice(0, -1) + op;
                    } else {
                        currentCalcString += op;
                    }
                }
            }
            updateCalcDisplay();
        });
    });

    // Cerrar calculadora al tocar fuera
    calcOverlay.addEventListener('click', (e) => {
        if (e.target === calcOverlay) {
             calcOverlay.classList.add('hidden');
             inputAmount.value = formatNumber(currentCalcString);
        }
    });

    // Botón Done interno de la calculadora
    document.getElementById('calc-close').addEventListener('click', () => {
         calcOverlay.classList.add('hidden');
         inputAmount.value = formatNumber(currentCalcString);
    });

    window.clearInput = function() {
        inputAmount.value = "";
        currentCalcString = "0";
    };


    // ==========================================
    // SECCIÓN 2: NAVEGACIÓN Y CATEGORÍAS
    // ==========================================

    const moreBtn = document.querySelector('.more');
    const moreText = document.querySelector('.more-text');
    const moreIconSvg = document.querySelector('.more-icon svg');
    const secondaryTypesUl = document.getElementById('secondary-types');

    moreBtn.addEventListener('click', () => {
        secondaryTypesUl.classList.toggle('hidden');
        const isHidden = secondaryTypesUl.classList.contains('hidden');
        
        if (isHidden) {
            moreText.innerText = "More";
            moreIconSvg.style.transform = "rotate(0deg)";
        } else {
            moreText.innerText = "Less";
            moreIconSvg.style.transform = "rotate(180deg)";
            moreIconSvg.style.transition = "transform 0.3s ease"; 
        }
    });


    // ==========================================
    // 3. LÓGICA DE SELECCIÓN DE CATEGORÍAS
    // ==========================================

    const chips = document.querySelectorAll('.chip');
    const expensesTypesDiv = document.querySelector('.expenses-types');
    const transferTypesDiv = document.querySelector('.transfer-types');
    // Nota: 'hiddenCategory' y 'settingsCards' ya se definieron arriba en el Bloque 0

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active-chip'));
            chip.classList.add('active-chip');
            
            resetSubCategorySelection(); 

            const category = (chip.dataset.value || chip.innerText).toLowerCase();
            hiddenCategory.value = category;

            // Reset Paneles y Cards
            expensesTypesDiv.classList.add('hidden');
            transferTypesDiv.classList.add('hidden');
            cardSubCategory.classList.remove('hidden');
            cardAccount.classList.remove('hidden');
            
            // --- LÓGICA DE BLOQUEO DE SUBCATEGORÍA ---
            if (category === 'expense') {
                expensesTypesDiv.classList.remove('hidden');
                
                // EN EXPENSE: Bloqueamos la tarjeta.
                // El usuario DEBE hacer clic en "Fixed" o "Flexible" para desbloquearla.
                cardSubCategory.classList.add('card-disabled'); 
                
                // Opcional: Quitamos la selección visual de los botones Fixed/Flex para reiniciar
                fixedTab.classList.remove('active-tab-fixed');
                flexibleTab.classList.remove('active-tab-flexible');
            } 
            else if (category === 'income' || category === 'savings' || category === 'loans') {
                // EN ESTOS: Desbloqueamos inmediatamente
                cardSubCategory.classList.remove('card-disabled');
            }
            else if (category === 'transfer') {
                transferTypesDiv.classList.remove('hidden');
                cardSubCategory.classList.add('hidden');
                cardAccount.classList.add('hidden');
            }
            else if (category === 'investment') {
                cardSubCategory.classList.add('hidden');
            }
        });
    });

    // ==========================================
    // 4. LÓGICA DE TABS (FIXED / FLEXIBLE)
    // ==========================================

    const fixedTab = document.querySelector('.fixed-tab');
    const flexibleTab = document.querySelector('.flexible-tab');

    // A. Clic en FIXED
    fixedTab.addEventListener('click', () => {
        fixedTab.classList.add('active-tab-fixed');
        flexibleTab.classList.remove('active-tab-flexible');
        
        resetSubCategorySelection(); 
        
        // ¡DESBLOQUEAR! Ahora sí sabemos que quiere gastos fijos
        cardSubCategory.classList.remove('card-disabled');
    });

    // B. Clic en FLEXIBLE
    flexibleTab.addEventListener('click', () => {
        flexibleTab.classList.add('active-tab-flexible');
        fixedTab.classList.remove('active-tab-fixed');
        
        resetSubCategorySelection();
        
        // ¡DESBLOQUEAR! Ahora sí sabemos que quiere gastos flexibles
        cardSubCategory.classList.remove('card-disabled');
    });

    // ==========================================
    // 5. SISTEMA DE MODALES 
    // ==========================================

    const fromBtn = document.querySelector('.from');
    const toBtn = document.querySelector('.to');
    // Nota: 'modalOverlay', 'modalTitle', etc. ya se definieron en el Bloque 0

    function openModal(title, primaryItems, secondaryItems = [], onSelect) {
        modalTitle.innerText = title;
        modalContent.innerHTML = ''; 

        renderList(primaryItems, modalContent, onSelect);

        if (secondaryItems && secondaryItems.length > 0) {
            const secondaryContainer = document.createElement('div');
            secondaryContainer.className = 'modal-secondary-list hidden';
            
            renderList(secondaryItems, secondaryContainer, onSelect);
            modalContent.appendChild(secondaryContainer);

            // Botón More
            const moreContainer = document.createElement('div');
            moreContainer.className = 'modal-more-container';
            moreContainer.innerHTML = `
                <span class="modal-more-text">More</span>
                <span class="modal-more-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </span>
            `;
            moreContainer.addEventListener('click', () => {
                secondaryContainer.classList.toggle('hidden');
                const isHidden = secondaryContainer.classList.contains('hidden');
                moreContainer.querySelector('.modal-more-text').innerText = isHidden ? "More" : "Less";
                moreContainer.querySelector('.modal-more-icon').style.transform = isHidden ? "rotate(0deg)" : "rotate(180deg)";
            });
            modalContent.appendChild(moreContainer);
        }
        
        modalOverlay.classList.remove('hidden');
        // Aseguramos que la tarjeta BLANCA sea visible (por si venimos de la fecha)
        innerModalCard.classList.remove('hidden');
    }

    function renderList(items, container, onSelect) {
        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'modal-list-item';
            itemDiv.innerText = item;
            
            itemDiv.addEventListener('click', () => {
                if (onSelect) onSelect(item);
                modalOverlay.classList.add('hidden');
            });
            
            container.appendChild(itemDiv);
        });
    }

    closeModalBtn.addEventListener('click', () => { modalOverlay.classList.add('hidden'); });
    
    // Light Dismiss (Modificado para ignorar si estamos en modo fecha)
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
             modalOverlay.classList.add('hidden');
             // Restaurar tarjeta blanca por seguridad
             innerModalCard.classList.remove('hidden'); 
        }
    });

    // ==========================================
    // 6. DATOS Y CONEXIÓN DE CUENTAS (Transfer + General)
    // ==========================================

    const primaryAccounts = ["Cash", "HSBC 2Now", "MiCuenta Banamex", "Joy Banamex"];
    const secondaryAccounts = ["TDC", "Nu Crédito", "Nu Debito", "Azul BBVA", "Libretón BBVA", "Liverpool"];

    // A. LÓGICA PARA TRANSFERENCIAS (From / To)
    fromBtn.addEventListener('click', () => {
        openModal("From account", primaryAccounts, secondaryAccounts, (selectedValue) => {
            fromSelectionText.innerText = selectedValue;
            fromSelectionText.style.color = "var(--body-white)";
            fromInputHidden.value = selectedValue;
        });
    });

    toBtn.addEventListener('click', () => {
        openModal("To account", primaryAccounts, secondaryAccounts, (selectedValue) => {
            toSelectionText.innerText = selectedValue;
            toSelectionText.style.color = "var(--body-white)";
            toInputHidden.value = selectedValue;
        });
    });

    // B. LÓGICA PARA CUENTA GENERAL (Expense / Income)
    // Usamos 'cardAccount' que ya definimos en el Bloque Maestro
    
    // 1. Referencias locales
    const accountText = cardAccount.querySelector('.selection-name');
    const accountInputHidden = document.getElementById('selected-account');

    // 2. Evento Click
    cardAccount.addEventListener('click', () => {
        openModal("Select Account", primaryAccounts, secondaryAccounts, (selectedValue) => {
            // Actualizar UI
            accountText.innerText = selectedValue;
            accountText.style.color = "var(--body-white)";
            
            // Guardar datos (si agregaste el input al HTML)
            if (accountInputHidden) {
                accountInputHidden.value = selectedValue;
            }
        });
    });

    // ==========================================
    // 7. LÓGICA DE SUB CATEGORÍAS
    // ==========================================

    const subCategoryText = cardSubCategory.querySelector('.selection-name');
    // 'subCategoryInputHidden' definido arriba

    function resetSubCategorySelection() {
        subCategoryText.innerText = "Select";
        subCategoryText.style.color = "var(--system-1)";
        subCategoryInputHidden.value = "";
    }

    const subCategoriesData = {
        fixed: ["House Rent", "Electricity Bill", "Internet", "Phone credit", "Food", "Pantry", "Home", "Transport", "Health"],
        flexible: ["Subscriptions", "Clothes", "Swimming", "Gifts", "Jana", "Learning", "Entertainment", "Misc", "Travel", "Gym"],
        income: ["Salary", "Extra", "Investments & Savings", "Previous balance"],
        savings: ["Emergency Fund", "Auto", "Trips", "Guitar", "Jana", "Misc"],
        loans: ["HSBC 2Now", "Joy Banamex", "Nubank", "Liverpool", "Mercado Crédito", "BBVA Azul"]
    };

    cardSubCategory.addEventListener('click', () => {
        const currentCategory = hiddenCategory.value;
        let listToShow = [];

        if (currentCategory === 'expense') {
            if (fixedTab.classList.contains('active-tab-fixed')) {
                listToShow = subCategoriesData.fixed;
            } else {
                listToShow = subCategoriesData.flexible;
            }
        } 
        else if (currentCategory === 'income') { listToShow = subCategoriesData.income; }
        else if (currentCategory === 'savings') { listToShow = subCategoriesData.savings; }
        else if (currentCategory === 'loans') { listToShow = subCategoriesData.loans; }

        openModal("Select Category", listToShow, [], (selectedValue) => {
            subCategoryText.innerText = selectedValue;
            subCategoryText.style.color = "var(--body-white)";
            subCategoryInputHidden.value = selectedValue;
        });
    });

    // ==========================================
    // 8. LÓGICA DE FECHA (WEB + MOBILE DARK OVERLAY)
    // ==========================================

    const dateText = cardDate.querySelector('.selection-name');

    cardDate.style.position = 'relative'; 

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    Object.assign(dateInput.style, {
        position: 'absolute',
        left: '0',
        top: '0',
        width: '100%',
        height: '100%',
        opacity: '0',
        zIndex: '10',
        border: 'none',
        cursor: 'pointer'
    });
    cardDate.appendChild(dateInput); 

    function formatDate(dateString) {
        if (!dateString) return "Select Date";
        const date = new Date(dateString + 'T00:00:00');
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-GB', options);
    }

    // 4. Inicializar con fecha LOCAL (GMT-6)
    const now = new Date();
    // Construimos YYYY-MM-DD manualmente usando la hora local del dispositivo
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Los meses van de 0 a 11
    const day = String(now.getDate()).padStart(2, '0');
    
    const today = `${year}-${month}-${day}`;
    
    // Asignar valores
    dateInput.value = today;
    dateText.innerText = formatDate(today);
    dateText.style.color = "var(--body-white)";

    // 5. EVENTOS CLAVE

    // A. Fix WEB: Forzar apertura al hacer clic (Con truco de alineación a la derecha)
    dateInput.addEventListener('click', (e) => {
        e.stopPropagation(); 
        try { 
            // 1. TRUCO DE MAGIA:
            // Temporalmente hacemos el input diminuto y lo pegamos a la derecha.
            // Esto obliga al navegador a anclar el calendario en el borde derecho.
            dateInput.style.left = 'auto';
            dateInput.style.right = '0';
            dateInput.style.width = '0px'; // O '1px' si algún navegador se pone exigente
            
            // 2. Abrimos el picker (que ahora se alineará al elemento "fantasma" de la derecha)
            dateInput.showPicker(); 
            
            // 3. RESTAURACIÓN:
            // Usamos setTimeout(..., 0) para devolver el input a su tamaño original 
            // inmediatamente después de que el navegador haya calculado la posición del calendario.
            setTimeout(() => {
                dateInput.style.left = '0';
                dateInput.style.right = 'auto'; // Limpiamos
                dateInput.style.width = '100%';
            }, 0);

        } catch (err) {
            // Fallback para navegadores antiguos que no soportan showPicker
            // En caso de error, restauramos por seguridad
            dateInput.style.left = '0';
            dateInput.style.width = '100%';
        }
    });

    // B. Fix Visual: Lógica condicional (Mobile vs Desktop)
    dateInput.addEventListener('focus', () => {
        // DETALLE IMPORTANTE:
        // Solo activamos el fondo oscuro si es una pantalla pequeña (Móvil)
        if (window.innerWidth <= 480) {
            innerModalCard.classList.add('hidden'); // Ocultar tarjeta blanca
            modalOverlay.classList.remove('hidden'); // Mostrar fondo negro
        }
        // En Desktop no hacemos nada, dejamos que el calendario flote normal
    });

    dateInput.addEventListener('blur', () => {
        // Al salir, restauramos todo (no importa si es web o mobile)
        modalOverlay.classList.add('hidden');
        innerModalCard.classList.remove('hidden');
    });

    // C. Actualizar Texto
    dateInput.addEventListener('change', () => {
        if (dateInput.value) dateText.innerText = formatDate(dateInput.value);
        // Quitamos el foco manualmente para cerrar el ciclo visual
        dateInput.blur(); 
    });
    
    // ==========================================
    // 9. LÓGICA DE NOTA (Input de Texto)
    // ==========================================

    const noteText = cardNote.querySelector('.selection-name');
    const noteInputHidden = document.getElementById('note-text');

    cardNote.addEventListener('click', () => {
        // 1. Configurar Título y Limpiar
        modalTitle.innerText = "Note";
        modalContent.innerHTML = ''; 

        // 2. Crear Contenedor del Formulario
        const container = document.createElement('div');
        container.className = 'modal-note-container';

        // 3. Crear Input de Texto
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'modal-note-input';
        input.placeholder = "Transaction details"; // Texto fantasma
        input.value = noteInputHidden.value;       // Cargar nota previa si existe
        
        // Auto-focus: Para que el teclado salga rápido en móviles
        setTimeout(() => input.focus(), 100); 

        // 4. Crear Botón "Add note"
        const saveBtn = document.createElement('button');
        saveBtn.className = 'modal-note-btn';
        saveBtn.innerText = "Add note";

        // 5. Lógica de Guardado
        saveBtn.addEventListener('click', () => {
            const val = input.value.trim();
            
            // A. Guardar en input oculto
            noteInputHidden.value = val;
            
            // B. Actualizar la Tarjeta UI
            if (val.length > 0) {
                // Si el texto es muy largo, mostramos "Texto..." para que quepa
                noteText.innerText = val.length > 15 ? val.substring(0, 15) + "..." : val;
                noteText.style.color = "var(--body-white)";
            } else {
                // Si lo dejó vacío
                noteText.innerText = "Select";
                noteText.style.color = "var(--system-1)";
            }

            // C. Cerrar Modal
            modalOverlay.classList.add('hidden');
        });

        // 6. Armar todo y mostrar
        container.appendChild(input);
        container.appendChild(saveBtn);
        modalContent.appendChild(container);

        modalOverlay.classList.remove('hidden');
        innerModalCard.classList.remove('hidden'); // Aseguramos que se vea la tarjeta blanca
    });


});