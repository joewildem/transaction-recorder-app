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

});