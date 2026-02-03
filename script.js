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
    const hiddenCategory = document.getElementById('selected-category'); // Input oculto

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            // A. LIMPIEZA VISUAL
            // Primero quitamos la clase 'active-chip' de TODOS los chips para "apagarlos"
            chips.forEach(c => c.classList.remove('active-chip'));
            
            // B. ACTIVAR EL SELECCIONADO
            // Agregamos la clase solo al que recibio el clic
            chip.classList.add('active-chip');
            
            // C. OBTENER EL VALOR DE LA CATEGORÍA
            // Si tiene data-value (ej: investment) úsalo, si no, usa el texto (Expense)
            const category = (chip.dataset.value || chip.innerText).toLowerCase();
            hiddenCategory.value = category; // Lo guardamos en el input oculto para usarlo luego

            // D. RESET DE PANELES (Estado Base)
            // Por seguridad, ocultamos AMBOS paneles primero. 
            // Así evitamos que se queden encimados o visibles por error.
            expensesTypesDiv.classList.add('hidden');
            transferTypesDiv.classList.add('hidden');

            // E. REGLA: EXPENSE
            if (category === 'expense') {
                // Si seleccionaste Expense, quitamos el 'hidden' de los tipos de gasto
                expensesTypesDiv.classList.remove('hidden');
            }
            
            // Aquí abajo agregaremos las reglas para Transfer e Income en el siguiente paso...
            if (category === 'expense') {
                expensesTypesDiv.classList.remove('hidden');
            } 
            // AGREGA ESTO:
            else if (category === 'transfer') {
                transferTypesDiv.classList.remove('hidden');
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
        // 1. Activar Fixed (ponerle su color rojo)
        fixedTab.classList.add('active-tab-fixed');
        
        // 2. Desactivar Flexible (quitarle su color amarillo por si lo tenía)
        flexibleTab.classList.remove('active-tab-flexible');
    });

    // B. Clic en FLEXIBLE
    flexibleTab.addEventListener('click', () => {
        // 1. Activar Flexible (ponerle su color amarillo)
        flexibleTab.classList.add('active-tab-flexible');
        
        // 2. Desactivar Fixed (quitarle su color rojo por si lo tenía)
        fixedTab.classList.remove('active-tab-fixed');
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

});