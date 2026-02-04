document.addEventListener('DOMContentLoaded', () => {

    // Aquí dentro escribiremos todo nuestro código...
    console.log("El documento está listo y el JS conectado.");

   // ==========================================
    // SECCIÓN 1: INPUT, CALCULADORA Y FORMATO
    // ==========================================

    const inputAmount = document.getElementById('input');
    
    // Calculadora Elements
    const calcOverlay = document.getElementById('calculator-overlay');
    const calcPreview = document.getElementById('calc-preview');
    const calcButtons = document.querySelectorAll('.calc-btn');

    // Variable interna para guardar la operación "pura" (ej: "1000+500") sin comas
    let currentCalcString = "0"; 

    // --- A. FUNCIONES DE FORMATO (Miles con comas) ---
    
    // Formatea un número individual (ej: "1000" -> "1,000")
    function formatNumber(numStr) {
        if (!numStr) return "";
        const parts = numStr.split('.');
        // Agrega comas a la parte entera
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join('.');
    }

    // Formatea una expresión completa (ej: "1000+2000" -> "1,000 + 2,000")
    function formatExpression(expr) {
        // Separa por operadores (+ - * / %) manteniendo el operador
        // Regex mágica: separa pero captura el separador
        const parts = expr.split(/([+\-*/%])/);
        
        return parts.map(part => {
            // Si es operador, lo devolvemos tal cual (con espacios para estética)
            if ("+-*/%".includes(part)) return ` ${part} `;
            // Si es número, lo formateamos
            return formatNumber(part);
        }).join('');
    }

    // Actualiza la pantalla de la calculadora
    function updateCalcDisplay() {
        calcPreview.innerText = formatExpression(currentCalcString);
    }

    // --- B. EVENTOS INPUT (Escritorio) ---
    
    // Formatear mientras escribes en Desktop
    inputAmount.addEventListener('input', (e) => {
        // 1. Guardar posición del cursor (para que no salte al final)
        const cursorPosition = inputAmount.selectionStart;
        
        // 2. Limpiar valor (quitar comas viejas y letras)
        // Permitimos números y un solo punto
        let rawValue = inputAmount.value.replace(/,/g, '');
        if (isNaN(rawValue) && rawValue !== ".") rawValue = ""; // Validación simple
        
        // 3. Formatear y devolver al input
        inputAmount.value = formatNumber(rawValue);
        
        // 4. Actualizar variable interna de la calc por si acaso abre mobile después
        currentCalcString = rawValue || "0";
    });

    // Abrir calculadora en Móvil
    inputAmount.addEventListener('click', (e) => {
        if (window.innerWidth <= 480) {
            e.preventDefault();
            inputAmount.blur();
            
            // Si el input tiene valor "1,000", lo limpiamos a "1000" para la lógica matemática
            currentCalcString = inputAmount.value.replace(/,/g, '') || "0";
            updateCalcDisplay();
            calcOverlay.classList.remove('hidden');
        }
    });

    // --- C. LÓGICA CALCULADORA ---
    calcButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const num = btn.dataset.num;
            const op = btn.dataset.op;

            // 1. NÚMEROS
            if (num !== undefined) {
                if (currentCalcString === "0" && num !== ".") {
                    currentCalcString = num;
                } else {
                    currentCalcString += num;
                }
            } 
            // 2. OPERACIONES
            else if (op) {
                if (op === 'C') { // AC: Borrar todo
                    currentCalcString = "0";
                } 
                else if (op === 'del') { // DEL: Borrar último caracter
                    currentCalcString = currentCalcString.slice(0, -1);
                    if (currentCalcString === "") currentCalcString = "0";
                } 
                else if (op === 'neg') { // +/-: Negativo
                    // Lógica simple: si lo último es número, ponle un - delante
                    // Para prototipo, simplemente multiplicamos el string evaluado por -1
                    try {
                        let val = eval(currentCalcString);
                        val = val * -1;
                        currentCalcString = val.toString();
                    } catch {
                        // Si es expresión compleja, ignoramos por ahora para no romper
                    }
                } 
                else if (op === '=') {
                    try {
                        // --- CORRECCIÓN LÓGICA DE PORCENTAJE ---
                        
                        // Paso 1: Resolver Sumas y Restas con % (Estilo Negocio)
                        // Convierte "100 - 70%" en "100 - (100 * 70 / 100)"
                        // Regex: Busca [Numero] [Singo + o -] [Numero] %
                        let expression = currentCalcString.replace(/(\d+(?:\.\d+)?)([\+\-])(\d+(?:\.\d+)?)%/g, (match, num1, operator, num2) => {
                            const val1 = parseFloat(num1);
                            const val2 = parseFloat(num2);
                            const percentVal = (val1 * val2) / 100; // Calcula el % del número base
                            return `${val1}${operator}${percentVal}`;
                        });

                        // Paso 2: Resolver Multiplicaciones, Divisiones o % sueltos
                        // Convierte "100 * 50%" en "100 * 50 / 100" -> 50
                        expression = expression.replace(/%/g, '/100');
                        
                        // Evaluamos
                        let result = eval(expression).toString();
                        
                        // Redondeo
                        if (result.includes('.')) {
                             result = parseFloat(result).toFixed(2);
                             if (result.endsWith('.00')) result = result.slice(0, -3);
                        }
                        currentCalcString = result;
                        
                        // Pasar valor al input
                        inputAmount.value = formatNumber(currentCalcString);
                        
                    } catch (error) {
                        currentCalcString = "Error";
                    }
                }
                else { // +, -, *, /, %
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

    // --- D. LIGHT DISMISS (Cerrar al tocar fuera) ---
    calcOverlay.addEventListener('click', (e) => {
        // e.target es el elemento exacto donde hiciste clic.
        // calcOverlay es el contenedor padre que cubre toda la pantalla.
        
        if (e.target === calcOverlay) {
             // Si coinciden, significa que diste clic en el "espacio vacío"
             calcOverlay.classList.add('hidden');
             
             // Opcional: Aseguramos que el valor se actualice en el input al cerrar así
             inputAmount.value = formatNumber(currentCalcString);
        }
    });

    // Clear input general
    window.clearInput = function() {
        inputAmount.value = "";
        currentCalcString = "0";
    };


    // ==========================================
    // SECCIÓN 2: NAVEGACIÓN Y CATEGORÍAS
    // ==========================================

    // 1. REFERENCIAS (Variables para esta sección)
    const moreBtn = document.querySelector('.more');
    const moreText = document.querySelector('.more-text');
    const moreIconSvg = document.querySelector('.more-icon svg'); // Seleccionamos el SVG dentro del icono
    const secondaryTypesUl = document.getElementById('secondary-types');

    // 2. LÓGICA DEL BOTÓN "MORE"
    moreBtn.addEventListener('click', () => {
        // A. Toggle de visibilidad
        // 'classList.toggle' es mágico: si tiene la clase 'hidden', se la quita. 
        // Si no la tiene, se la pone. Nos ahorra un if/else.
        secondaryTypesUl.classList.toggle('hidden');
        
        // B. Verificar estado actual
        // Preguntamos: "¿Después del toggle, la lista está oculta?"
        const isHidden = secondaryTypesUl.classList.contains('hidden');
        
        // C. Actualizar UI (Texto e Icono)
        if (isHidden) {
            moreText.innerText = "More"; // Si está oculto, decimos "Ver más"
            moreIconSvg.style.transform = "rotate(0deg)"; // Flecha normal
        } else {
            moreText.innerText = "Less"; // Si está visible, decimos "Ver menos"
            moreIconSvg.style.transform = "rotate(180deg)"; // Volteamos la flecha
            
            // Opcional: Agregar una transición suave en CSS al icono si no la tiene
            moreIconSvg.style.transition = "transform 0.3s ease"; 
        }
    });


   // ==========================================
    // 3. LÓGICA DE SELECCIÓN DE CATEGORÍAS
    // ==========================================

    const chips = document.querySelectorAll('.chip');
    const expensesTypesDiv = document.querySelector('.expenses-types');
    const transferTypesDiv = document.querySelector('.transfer-types');
    const hiddenCategory = document.getElementById('selected-category');

    // Referencias a las cards de abajo (settings)
    // [0]: Sub Category, [1]: Date, [2]: Account, [3]: Note
    const settingsCards = document.querySelectorAll('.selection-card');
    const cardSubCategory = settingsCards[0];
    const cardAccount = settingsCards[2];

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            // A. LIMPIEZA VISUAL
            chips.forEach(c => c.classList.remove('active-chip'));
            chip.classList.add('active-chip');
            
            // AGREGA ESTA LÍNEA AQUÍ:
            resetSubCategorySelection(); // <--- Limpia la subcategoría al cambiar de chip principal

            // B. OBTENER VALOR
            const category = (chip.dataset.value || chip.innerText).toLowerCase();
            hiddenCategory.value = category;

            // C. RESET GENERAL (Estado Base: Todo visible y secciones ocultas)
            expensesTypesDiv.classList.add('hidden');
            transferTypesDiv.classList.add('hidden');
            
            // Importante: Volvemos a mostrar las cards por si venimos de 'transfer'
            cardSubCategory.classList.remove('hidden');
            cardAccount.classList.remove('hidden');

            // D. REGLAS POR CATEGORÍA
            if (category === 'expense') {
                expensesTypesDiv.classList.remove('hidden');
            } 
            else if (category === 'transfer') {
                transferTypesDiv.classList.remove('hidden');
                // Transfer: Ocultamos Sub Categoría y Cuenta
                cardSubCategory.classList.add('hidden');
                cardAccount.classList.add('hidden');
            }
            // NUEVA REGLA: INVESTMENT
            else if (category === 'investment') {
                // Investment: Ocultamos Sub Categoría
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
        
        // AGREGA ESTA LÍNEA:
        resetSubCategorySelection(); // <--- Limpia al cambiar de tab
    });

    // B. Clic en FLEXIBLE
    flexibleTab.addEventListener('click', () => {
        flexibleTab.classList.add('active-tab-flexible');
        fixedTab.classList.remove('active-tab-fixed');
        
        // AGREGA ESTA LÍNEA:
        resetSubCategorySelection(); // <--- Limpia al cambiar de tab
    });

    // ==========================================
    // 5. SISTEMA DE MODALES (Con Callback de Selección)
    // ==========================================

    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const fromBtn = document.querySelector('.from');
    const toBtn = document.querySelector('.to');

    // Referencias a los textos que vamos a cambiar
    const fromSelectionText = document.querySelector('.from-selection');
    const toSelectionText = document.querySelector('.to-selection');
    
    // Referencias a los inputs ocultos (para guardar el dato real)
    const fromInputHidden = document.getElementById('selected-account-from');
    const toInputHidden = document.getElementById('selected-account-to');

    // Función maestra actualizada: Ahora recibe 'onSelect' (una función)
    function openModal(title, primaryItems, secondaryItems = [], onSelect) {
        modalTitle.innerText = title;
        modalContent.innerHTML = ''; 

        // 1. Renderizar lista PRINCIPAL
        renderList(primaryItems, modalContent, onSelect);

        // 2. Renderizar lista SECUNDARIA (si existe)
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
    }

    // Función auxiliar actualizada para manejar el click
    function renderList(items, container, onSelect) {
        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'modal-list-item';
            itemDiv.innerText = item;
            
            itemDiv.addEventListener('click', () => {
                // AQUÍ OCURRE LA MAGIA:
                // Si nos pasaron una función 'onSelect', la ejecutamos con el valor seleccionado
                if (onSelect) {
                    onSelect(item);
                }
                modalOverlay.classList.add('hidden');
            });
            
            container.appendChild(itemDiv);
        });
    }

    // Cerrar Modal
    closeModalBtn.addEventListener('click', () => { modalOverlay.classList.add('hidden'); });
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) modalOverlay.classList.add('hidden');
    });

    // ==========================================
    // 6. DATOS Y CONEXIÓN
    // ==========================================

    const primaryAccounts = ["Cash", "HSBC 2Now", "MiCuenta Banamex", "Joy Banamex"];
    const secondaryAccounts = ["TDC", "Nu Crédito", "Nu Debito", "Azul BBVA", "Libretón BBVA", "Liverpool"];

    // Clic en FROM
    fromBtn.addEventListener('click', () => {
        openModal("From account", primaryAccounts, secondaryAccounts, (selectedValue) => {
            // Instrucciones específicas para FROM:
            fromSelectionText.innerText = selectedValue;       // 1. Cambiar texto visual
            fromSelectionText.style.color = "var(--body-white)"; // 2. (Opcional) Ponerlo blanco para indicar que ya no es placeholder
            fromInputHidden.value = selectedValue;             // 3. Guardar en input oculto
        });
    });

    // Clic en TO
    toBtn.addEventListener('click', () => {
        openModal("To account", primaryAccounts, secondaryAccounts, (selectedValue) => {
            // Instrucciones específicas para TO:
            toSelectionText.innerText = selectedValue;
            toSelectionText.style.color = "var(--body-white)";
            toInputHidden.value = selectedValue;
        });
    });


    // ==========================================
    // 7. LÓGICA DE SUB CATEGORÍAS (Dinámica)
    // ==========================================

    const subCategoryText = cardSubCategory.querySelector('.selection-name');
    const subCategoryInputHidden = document.getElementById('selected-subcategory');

    // --- NUEVA FUNCIÓN: RESETEAR SELECCIÓN ---
    function resetSubCategorySelection() {
        subCategoryText.innerText = "Select"; // Volver al texto por defecto
        subCategoryText.style.color = "var(--system-1)"; // Volver al color gris
        subCategoryInputHidden.value = ""; // Borrar el dato guardado
    }

    // A. BASE DE DATOS DE SUBCATEGORÍAS
    const subCategoriesData = {
        fixed: ["House Rent", "Electricity Bill", "Internet", "Phone credit", "Food", "Pantry", "Home", "Transport", "Health"],
        flexible: ["Subscriptions", "Clothes", "Swimming", "Gifts", "Jana", "Learning", "Entertainment", "Misc", "Travel", "Gym"],
        income: ["Salary", "Extra", "Investments & Savings", "Previous balance"],
        savings: ["Emergency Fund", "Auto", "Trips", "Guitar", "Jana", "Misc"],
        loans: ["HSBC 2Now", "Joy Banamex", "Nubank", "Liverpool", "Mercado Crédito", "BBVA Azul"]
    };

    // B. EVENTO CLICK EN LA CARD
    cardSubCategory.addEventListener('click', () => {
        // 1. Averiguar en qué estado estamos
        const currentCategory = hiddenCategory.value; // expense, income, savings...
        let listToShow = [];

        // 2. Selección de lista según lógica de negocio
        if (currentCategory === 'expense') {
            // Si es gasto, preguntamos: ¿Está activo Fixed o Flexible?
            if (fixedTab.classList.contains('active-tab-fixed')) {
                listToShow = subCategoriesData.fixed;
            } else {
                listToShow = subCategoriesData.flexible;
            }
        } 
        else if (currentCategory === 'income') {
            listToShow = subCategoriesData.income;
        }
        else if (currentCategory === 'savings') {
            listToShow = subCategoriesData.savings;
        }
        else if (currentCategory === 'loans') {
            listToShow = subCategoriesData.loans;
        }

        // 3. Abrir el Modal
        // Usamos nuestra función maestra. Pasamos [] como segundo array porque aquí no hay "secundarios"
        openModal("Select Category", listToShow, [], (selectedValue) => {
            // Actualizar UI y Guardar
            subCategoryText.innerText = selectedValue;
            subCategoryText.style.color = "var(--body-white)";
            subCategoryInputHidden.value = selectedValue;
        });
    });

   // ==========================================
    // 8. LÓGICA DE FECHA (Técnica Overlay Invisible)
    // ==========================================

    const dateCard = settingsCards[1];
    const dateText = dateCard.querySelector('.selection-name');

    // 1. Preparamos la tarjeta contenedora
    dateCard.style.position = 'relative'; // Necesario para que el hijo absoluto se pegue aquí

    // 2. Creamos el input y lo ponemos ENCIMA de todo (Overlay)
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    
    Object.assign(dateInput.style, {
        position: 'absolute',
        left: '0',
        top: '0',
        width: '100%',     // Cubre todo el ancho
        height: '100%',    // Cubre todo el alto
        opacity: '0',      // Totalmente transparente (invisible)
        zIndex: '10',      // ENCIMA del texto (clave para que funcione en móvil)
        border: 'none',
        cursor: 'pointer',  // Para que en web salga la manita
        display: 'block'    // Asegura que ocupe espacio
    });

    dateCard.appendChild(dateInput); 

    // 3. Formateador de fecha
    function formatDate(dateString) {
        if (!dateString) return "Select Date";
        const date = new Date(dateString + 'T00:00:00');
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-GB', options);
    }

    // 4. Inicializar con fecha de HOY
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateText.innerText = formatDate(today);
    dateText.style.color = "var(--body-white)";

    // 5. Escuchar cambios
    // NOTA: Ya no necesitamos un evento 'click' en la card para abrir el picker,
    // porque al estar el input ENCIMA, el usuario lo clica directamente.
    dateInput.addEventListener('change', () => {
        if (dateInput.value) {
            dateText.innerText = formatDate(dateInput.value);
        }
    });
    
    // Fix extra para que en iOS se sienta instantáneo
    dateInput.addEventListener('click', (e) => {
        // Esto asegura que el evento se propague correctamente
        e.stopPropagation(); 
    });
    
});