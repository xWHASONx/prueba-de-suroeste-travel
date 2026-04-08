/* ==========================================
   COTIZADOR PRO - SUROESTE TRAVEL
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {

    const ACCESS_PASSWORD = 'HOLA';

    // --- CONFIGURACIÓN FIREBASE ---
    const firebaseConfig = {
        apiKey: "AIzaSyDKcIaC0Iok9Qjzt5nunQT3RcE8My8OcbM",
        authDomain: "suroeste-travel.firebaseapp.com",
        projectId: "suroeste-travel",
        storageBucket: "suroeste-travel.firebasestorage.app",
        messagingSenderId: "1024155836116",
        appId: "1:1024155836116:web:a87276237fc133d2322541"
    };
    
    let db, storage;
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        storage = firebase.storage();
    } catch (error) {
        console.warn("Firebase no está configurado correctamente aún. Algunas funciones fallarán.");
    }

    // --- VARIABLES GLOBALES ---
    let currentTRM = 0; 
    let currentQuoteId = null; 
    let pastedImages = {};
    let hotelCounter = 0;
    let cruiseCounter = 0;

    // --- ELEMENTOS DEL DOM ---
    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password-input');
    const mainWrapper = document.querySelector('.wrapper');
    
    const dashboardSection = document.getElementById('dashboard-section');
    const formTitleSection = document.getElementById('form-title-section');
    const formSection = document.getElementById('form-section');
    const confirmationSection = document.getElementById('confirmation-section');
    
    const btnCreateNew = document.getElementById('btn-create-new');
    const searchQuoteInput = document.getElementById('search-quote');
    const quotesList = document.getElementById('quotes-list');
    
    const form = document.getElementById('pre-reserva-form');
    const dynamicComponentsContainer = document.getElementById('dynamic-components-container');
    const confirmationComponentsContainer = document.getElementById('confirmation-components-container');
    const advisorSelect = document.getElementById('asesor');
    const advisorWhatsappInput = document.getElementById('whatsapp-asesor');

    const ADVISORS = {
        'Julio': { 
            name: 'Julio Nieto', 
            photoUrl: 'https://i.imgur.com/UVWjrb6.jpeg', 
            defaultWhatsapp: '573216148555' /* Cambia este número si el WhatsApp de Julio es diferente */
        }
    };

    const ICONS = {
        destination: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>',
        calendar: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>',
        moon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>',
        bed: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7h2a2 2 0 012 2v9a2 2 0 01-2 2h-2m-6 0H7a2 2 0 01-2-2V9a2 2 0 012-2h2m4-4h2a2 2 0 012 2v2H9V5a2 2 0 012-2zM9 12h6"></path></svg>',
        check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        plane: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>',
        ship: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v12zm0 0v7"></path></svg>'
    };

    const REGIMEN_TEMPLATES = {
        'todo_incluido': `Todo incluido: Desayunos, almuerzos, cenas, snacks y bebidas ilimitadas.`,
        'pension_completa': `Pensión Completa: Desayuno, almuerzo y cena.`,
        'media_pension': `Media Pensión: Desayuno y cena.`,
        'desayuno': `Alojamiento y Desayuno.`,
        'solo_hotel': `Solo alojamiento.`
    };

    const TERMS_AND_CONDITIONS = {
        flights: `<p style="margin-bottom: 10px;"><strong>✈️ Tiquetes Aéreos:</strong> Los valores e itinerarios cotizados están sujetos a cambios y disponibilidad por parte de las aerolíneas sin previo aviso. Los vuelos incluidos en esta cotización son aproximados al momento de su emisión. Para garantizar el valor y el itinerario proporcionado, se debe realizar el pago total inmediato. Ninguna aerolínea permite separar, reservar o congelar precios sin el pago completo. En caso de cambio de fecha, nombre del pasajero o cualquier modificación, la aerolínea aplicará penalidades según su política interna. Niños mayores de 2 años cumplidos pagan tarifa de adulto.</p>`,
        hotels: `<p style="margin-bottom: 10px;"><strong>🏨 Hoteles:</strong> La reserva hotelera se realiza inicialmente con un pago parcial (separación). El saldo restante deberá estar completamente pagado al menos 45 días antes de la fecha del viaje. Si deseas modificar la fecha del viaje, se validará primero la disponibilidad en el hotel. En caso de no estar disponible, se intentará mantener el valor en otro hotel de la misma categoría. Si la nueva fecha corresponde a temporada alta y el valor se incrementa, el cliente deberá asumir la diferencia.</p>`,
        transfers: `<p style="margin-bottom: 10px;"><strong>🚐 Traslados:</strong> Si el plan incluye traslados desde el aeropuerto al hotel y posteriormente decides comprar vuelos con llegada a otra ciudad, los traslados adicionales correrán por cuenta del cliente debido a la diferencia de distancia y el reajuste necesario en la logística.</p>`,
        cruises: `<p style="margin-bottom: 10px;"><strong>🚢 Cruceros:</strong> La tarifa oficial del crucero es en dólares estadounidenses y el valor dado en pesos es únicamente un estimado ya que el valor real puede variar dependiendo de la tasa de cambio el día del pago. El pago del crucero se realiza directamente a la naviera a través de un link oficial donde se deberá cancelar el valor con tarjeta débito o crédito.</p>`
    };

    const GENERAL_TERMS = `<p style="margin-bottom: 10px;"><strong>Términos y condiciones generales:</strong> Al confirmar una reserva con Suroeste Travel (en adelante, “la Agencia”), el pasajero y/o titular de la reserva (en adelante, “el Cliente”) acepta los presentes términos y condiciones: 1) Rol de la Agencia: La Agencia actúa como intermediaria entre el Cliente y los proveedores de servicios turísticos. Los servicios efectivamente prestados son responsabilidad directa de cada proveedor. 2) Itinerarios, horarios y cambios operativos: Los itinerarios, horarios, rutas, escalas, cabinas, asientos, tipos de habitación, categorías, servicios incluidos y demás características del viaje pueden ser modificados por los proveedores por razones operativas, climáticas, de seguridad, disposiciones gubernamentales o causas de fuerza mayor. La Agencia no se hace responsable por cambios, reprogramaciones, demoras, cancelaciones, overbooking, sustituciones de equipo, cierres de puertos/aeropuertos. 3) Documentación y requisitos de viaje: Es responsabilidad del Cliente contar con documentos vigentes y requisitos exigidos para su viaje: pasaporte, visas, permisos, vacunas, formularios migratorios, seguros, autorizaciones para menores, entre otros. 4) Exactitud de datos: El Cliente debe suministrar datos correctos y completos. Errores o inconsistencias pueden generar costos adicionales. 5) Pagos, confirmación y emisión: Las reservas se confirman únicamente cuando el pago ha sido recibido según lo acordado. 6) Tarifas administrativas y cargos por gestión: Las tarifas administrativas, cargos de gestión y/o cargos por servicio cobrados por la Agencia no son reembolsables. 7) Fuerza mayor y eventos fuera de control: La Agencia no será responsable por incumplimientos o afectaciones derivadas de eventos fuera de control razonable. 8) Aceptación: La compra, pago o confirmación de la reserva implica aceptación total de estos términos.</p>
    <p style="margin-bottom: 10px;"><strong>Políticas de Cancelación, Cambios y Reembolsos:</strong> 1) Política general: Todas las solicitudes de cancelación, cambios, reembolsos, reemisiones, cambios de nombre/fecha o correcciones están sujetas a las políticas y condiciones del proveedor y al tipo de tarifa adquirida. 2) Tarifas administrativas no reembolsables: Independientemente del resultado ante el proveedor, las tarifas administrativas de la Agencia no son reembolsables. 3) Penalidades, retenciones y diferencias tarifarias: En caso de que el proveedor permite cambios o reembolsos, el Cliente podrá asumir penalidades por cambio/cancelación, diferencia de tarifa, impuestos no reembolsables. 4) No show (no presentación): Si el Cliente no se presenta a tiempo, aplicarán políticas de no show del proveedor, que suelen implicar pérdida total del valor pagado. 5) Tiempos de reembolso: Cuando un reembolso sea aprobado por el proveedor, los tiempos de devolución dependen del proveedor y/o entidad financiera. La Agencia no controla estos plazos. 6) Cancelaciones o cambios del proveedor: Si el proveedor cancela o modifica el servicio, se aplicarán sus políticas. 7) Recomendación de seguro de viaje: Se recomienda adquirir seguro de asistencia/seguro de cancelación para cubrir imprevistos médicos, interrupciones del viaje o cancelaciones por causas justificadas.</p>`;

    // --- OBTENER TRM OFICIAL ---
    async function fetchTRM() {
        try {
            const response = await fetch('https://www.datos.gov.co/resource/32sa-8pi3.json?$limit=1&$order=vigenciadesde%20DESC');
            const data = await response.json();
            if (data && data.length > 0) {
                currentTRM = Math.round(parseFloat(data[0].valor));
            } else {
                throw new Error("Datos vacíos");
            }
        } catch (error) {
            console.warn("No se pudo obtener la TRM oficial, usando valor por defecto.", error);
            currentTRM = 4000; 
        }
    }

   // --- SUBIDA DE IMÁGENES EN HD A FIREBASE STORAGE ---
    async function handlePaste(e) {
        e.preventDefault();
        const pasteArea = e.currentTarget; 
        const imageId = pasteArea.dataset.imgId;
        const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'));
        
        if (item) {
            const file = item.getAsFile();
            const pTag = pasteArea.querySelector('p');
            const imgElement = pasteArea.querySelector('img');
            const removeBtn = pasteArea.querySelector('.remove-img-btn');
            const spinner = pasteArea.querySelector('.loader-spinner');

            if(pTag) pTag.style.display = 'none';
            if(imgElement) imgElement.style.display = 'none';
            if(removeBtn) removeBtn.style.display = 'none';
            if(spinner) spinner.style.display = 'block';

            try {
                if (!storage) throw new Error("Storage no configurado");
                const uniqueName = `cotizaciones/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
                const storageRef = storage.ref(uniqueName);
                
                const snapshot = await storageRef.put(file);
                const downloadURL = await snapshot.ref.getDownloadURL(); 

                imgElement.crossOrigin = "anonymous";
                imgElement.src = downloadURL;
                imgElement.style.display = 'block';
                if(removeBtn) removeBtn.style.display = 'flex';
                
                pastedImages[imageId] = downloadURL;
            } catch (error) {
                console.error("Error subiendo imagen:", error);
                alert("Hubo un error subiendo la imagen. Revisa tu conexión a internet o la configuración de Firebase.");
                if(pTag) pTag.style.display = 'block';
            } finally {
                if(spinner) spinner.style.display = 'none';
            }
        }
    }

    // --- LÓGICA DE LOGIN ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (passwordInput.value.trim() === ACCESS_PASSWORD) {
            loginOverlay.style.display = 'none';
            mainWrapper.style.display = 'block';
            await fetchTRM();
            loadDashboard();
        } else {
            document.getElementById('login-error').style.display = 'block';
            passwordInput.value = '';
        }
    });

    // --- DASHBOARD Y FIREBASE ---
    function showView(view) {
        dashboardSection.style.display = view === 'dashboard' ? 'block' : 'none';
        formTitleSection.style.display = view === 'form' ? 'block' : 'none';
        formSection.style.display = view === 'form' ? 'block' : 'none';
        confirmationSection.style.display = view === 'pdf' ? 'block' : 'none';
        window.scrollTo(0, 0);
    }

    async function loadDashboard() {
        showView('dashboard');
        quotesList.innerHTML = '<p>Cargando cotizaciones...</p>';
        if (!db) {
            quotesList.innerHTML = '<p style="color:red;">⚠️ Firebase no configurado. Configura las credenciales en el código.</p>';
            return;
        }
        try {
            const snapshot = await db.collection('cotizaciones').orderBy('createdAt', 'desc').limit(50).get();
            let allDocs = snapshot.docs;
            renderQuotes(allDocs);
            
            const filterData = () => {
                const term = searchQuoteInput.value.toLowerCase();
                const status = document.getElementById('filter-status').value;
                
                const filtered = allDocs.filter(doc => {
                    const data = doc.data();
                    const matchSearch = data.quoteNumber.toLowerCase().includes(term);
                    const matchStatus = status === 'Todos' || (data.status || 'Pendiente') === status;
                    return matchSearch && matchStatus;
                });
                renderQuotes(filtered);
            };

            searchQuoteInput.addEventListener('input', filterData);
            document.getElementById('filter-status').addEventListener('change', filterData);
        } catch (error) {
            quotesList.innerHTML = '<p style="color:red;">Error al cargar datos. Por favor, desactiva tu bloqueador de anuncios o revisa Firebase.</p>';
            console.error(error);
        }
    }

    function renderQuotes(docs) {
        quotesList.innerHTML = '';
        if (docs.length === 0) { quotesList.innerHTML = '<p>No hay cotizaciones que coincidan.</p>'; return; }
        
        const statusColors = { 'Pendiente': '#f39c12', 'Vendida': '#27ae60', 'Rechazada': '#c0392b' };

        docs.forEach(doc => {
            const data = doc.data();
            const date = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString('es-ES') : 'Fecha desconocida';
            const currentStatus = data.status || 'Pendiente';
            
            const card = document.createElement('div');
            card.className = 'quote-card';
            card.innerHTML = `
                <span class="quote-badge">${data.quoteNumber}</span>
                <h3 style="margin-top: 15px;">Cotización</h3>
                <p>Asesor: ${data.advisorName}</p>
                <span class="quote-date">Creada: ${date}</span>
                
                <select class="status-select" data-id="${doc.id}" style="width: 100%; margin-top: 10px; padding: 8px; border-radius: 8px; border: none; color: white; font-weight: bold; background-color: ${statusColors[currentStatus]}; cursor: pointer;">
                    <option value="Pendiente" ${currentStatus === 'Pendiente' ? 'selected' : ''}>🟡 Pendiente</option>
                    <option value="Vendida" ${currentStatus === 'Vendida' ? 'selected' : ''}>🟢 Vendida</option>
                    <option value="Rechazada" ${currentStatus === 'Rechazada' ? 'selected' : ''}>🔴 Rechazada</option>
                </select>

                <button class="btn-duplicate" data-id="${doc.id}">📄 Duplicar Cotización</button>
                <button class="btn-delete" data-id="${doc.id}" style="background: #ffeaea; border: 1px solid #ffccc7; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: bold; color: #ff4d4f; margin-top: 10px; width: 100%; transition: background 0.2s;">🗑️ Eliminar Cotización</button>
            `;
            
            card.querySelector('.status-select').addEventListener('change', async (e) => {
                const newStatus = e.target.value;
                e.target.style.backgroundColor = statusColors[newStatus];
                try {
                    if(db) await db.collection('cotizaciones').doc(doc.id).update({ status: newStatus });
                } catch (error) {
                    console.error("Error actualizando estado:", error);
                    alert("No se pudo actualizar el estado.");
                }
            });

            card.querySelector('.btn-delete').addEventListener('click', async (e) => {
                e.stopPropagation(); 
                if(confirm("⚠️ ¿Estás seguro de eliminar esta cotización? Esta acción es irreversible.")) {
                    try {
                        if(db) await db.collection('cotizaciones').doc(doc.id).delete();
                        card.remove();
                    } catch (error) {
                        alert("Error al eliminar la cotización.");
                    }
                }
            });

            card.addEventListener('click', (e) => {
                if(e.target.classList.contains('btn-duplicate') || e.target.classList.contains('status-select') || e.target.classList.contains('btn-delete')) return; 
                loadQuoteIntoForm(doc.id, data);
            });

            card.querySelector('.btn-duplicate').addEventListener('click', (e) => {
                e.stopPropagation();
                const duplicatedData = { ...data, quoteNumber: generateQuoteNumber(), status: 'Pendiente' };
                loadQuoteIntoForm(null, duplicatedData); 
            });

            quotesList.appendChild(card);
        });
    }

    btnCreateNew.addEventListener('click', () => {
        currentQuoteId = null;
        initializeForm();
        showView('form');
    });

    function generateQuoteNumber() {
        const now = new Date();
        return `COT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    }

    // --- LÓGICA DEL FORMULARIO ---
    function addSection(sectionKey) {
        let templateId = `template-${sectionKey}`;
        let counter = 0;
        
        if (sectionKey === 'hotel') { hotelCounter++; counter = hotelCounter; }
        if (sectionKey === 'cruises') { cruiseCounter++; counter = cruiseCounter; }

        const template = document.getElementById(templateId);
        if (!template) return;

        let cloneHtml = template.innerHTML.replace(/PLACEHOLDER/g, counter || '');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cloneHtml;
        const cloneNode = tempDiv.firstElementChild;

        dynamicComponentsContainer.appendChild(cloneNode);

        if (sectionKey === 'hotel') {
            populateSelect(`cantidad-noches-${counter}`, 1, 30, 4, 'noche');
            populateSelect(`cantidad-habitaciones-${counter}`, 1, 10, 1, 'habitación', 'habitaciones');
            if (counter === 1) document.querySelector(`.add-section-btn[data-section="hotel"]`).style.display = 'none';
            if (counter > 1) document.querySelector(`#hotel-form-wrapper-${counter - 1} .add-subsection-btn`).style.display = 'none';
        }
        
        if (sectionKey === 'cruises') {
            populateSelect(`noches-crucero-${counter}`, 1, 30, 7, 'noche');
            if (counter === 1) document.querySelector(`.add-section-btn[data-section="cruises"]`).style.display = 'none';
            if (counter > 1) document.querySelector(`#cruises-form-wrapper-${counter - 1} .add-subsection-btn`).style.display = 'none';
        }

        if (['flights', 'tours', 'transfers'].includes(sectionKey)) {
            document.querySelector(`.add-section-btn[data-section="${sectionKey}"]`).style.display = 'none';
        }

        addEventListenersToSection(cloneNode);
    }
   
    function populateSelect(id, min, max, defaultVal, singular, plural = singular + 's') {
        const select = document.getElementById(id);
        if(!select) return;
        for (let i = min; i <= max; i++) {
            const option = new Option(`${i} ${i === 1 ? singular : plural}`, i);
            if (i === defaultVal) option.selected = true;
            select.add(option);
        }
    }

    function removeSection(sectionKey) {
        if (sectionKey.startsWith('hotel-') || sectionKey.startsWith('cruises-')) {
            const type = sectionKey.split('-')[0];
            const num = sectionKey.split('-')[1];
            const wrapper = document.getElementById(`${type}-form-wrapper-${num}`);
            if (wrapper) wrapper.remove();
            
            if (document.querySelectorAll(`.${type}-form-wrapper`).length === 0) {
                document.querySelector(`.add-section-btn[data-section="${type === 'hotel' ? 'hotel' : 'cruises'}"]`).style.display = 'block';
                if(type === 'hotel') hotelCounter = 0;
                if(type === 'cruises') cruiseCounter = 0;
            } else {
                const lastItem = Array.from(document.querySelectorAll(`.${type}-form-wrapper`)).pop();
                lastItem.querySelector('.add-subsection-btn').style.display = 'block';
            }
        } else {
            const wrapper = document.getElementById(`${sectionKey}-form-wrapper`);
            if (wrapper) {
                wrapper.remove();
                document.querySelector(`.add-section-btn[data-section="${sectionKey}"]`).style.display = 'block';
            }
        }
    }

    form.addEventListener('click', e => {
        const { target } = e;
        const { section, subsection } = target.dataset;
        
        if (target.matches('.add-section-btn')) addSection(section);

        if (target.matches('.remove-img-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const pasteArea = target.closest('.paste-area');
            const imageId = pasteArea.dataset.imgId;
            const imgElement = pasteArea.querySelector('img');
            const placeholder = pasteArea.querySelector('.paste-placeholder');
            
            delete pastedImages[imageId];
            
            imgElement.src = '';
            imgElement.style.display = 'none';
            target.style.display = 'none';
            if(placeholder) placeholder.style.display = 'block';
        }
        
        if (target.matches('.remove-section-btn') && !target.matches('.remove-cabin-btn')) {
            if (target.dataset.subsection) {
                const wrapper = document.getElementById(`${target.dataset.subsection}-form-wrapper`);
                if(wrapper) { 
                    wrapper.style.display = 'none'; 
                    const btnAdd = document.getElementById(`btn-add-${target.dataset.subsection}`);
                    if(btnAdd) btnAdd.style.display = 'block';
                }
            } else {
                removeSection(section);
            }
        }
        
        if (target.matches('.add-subsection-btn') && !target.matches('.add-cabin-btn')) {
            if(section === 'hotel' || section === 'cruises') addSection(section);
            else {
                const wrapper = document.getElementById(`${subsection}-form-wrapper`);
                if(wrapper) { 
                    wrapper.style.display = 'block'; 
                    target.style.display = 'none'; 
                    if(subsection.endsWith('-2')) {
                        const btnAdd3 = document.getElementById(`btn-add-${subsection.replace('-2', '-3')}`);
                        if(btnAdd3) btnAdd3.style.display = 'block';
                    }
                }
            }
        }

        if (target.matches('.add-cabin-btn')) {
            addCabinToCruise(target.dataset.cruise);
        }
        if (target.matches('.remove-cabin-btn')) {
            const targetId = target.dataset.target;
            const el = document.getElementById(targetId);
            if (el) el.remove();
        }
        if (target.matches('.generate-itinerary-btn')) {
            generateItineraryTable(target.dataset.target);
        }
    });

    document.getElementById('is-group-booking').addEventListener('change', (e) => {
        document.getElementById('group-booking-fields').style.display = e.target.checked ? 'grid' : 'none';
    });

    form.addEventListener('click', e => {
        if (e.target.matches('.remove-img-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const pasteArea = e.target.closest('.paste-area');
            const imageId = pasteArea.dataset.imgId;
            const imgElement = pasteArea.querySelector('img');
            const pTag = pasteArea.querySelector('p'); 
            
            delete pastedImages[imageId];
            
            imgElement.src = '';
            imgElement.style.display = 'none';
            e.target.style.display = 'none';
            if(pTag) pTag.style.display = 'block'; 
        }
    });

    function addEventListenersToSection(sectionElement) {
        sectionElement.querySelectorAll('.paste-area').forEach(area => area.addEventListener('paste', handlePaste));
    }

    function initializeForm() {
        form.reset();
        pastedImages = {};
        hotelCounter = 0;
        cruiseCounter = 0;
        dynamicComponentsContainer.innerHTML = '';
        document.querySelectorAll('.add-section-btn').forEach(btn => btn.style.display = 'block');
        document.getElementById('group-booking-fields').style.display = 'none';
        
        advisorSelect.innerHTML = '<option value="" disabled selected>Selecciona tu nombre</option>' + Object.keys(ADVISORS).map(id => `<option value="${id}">${ADVISORS[id].name}</option>`).join('');
        
        populateSelect('adultos', 1, 20, 2, 'Adulto');
        populateSelect('jovenes', 0, 10, 0, 'Joven', 'Jóvenes');
        populateSelect('ninos', 0, 10, 0, 'Niño');
        
        document.getElementById('cotizacion-numero').value = generateQuoteNumber();
    }

    advisorSelect.addEventListener('change', () => {
        const selectedAdvisor = ADVISORS[advisorSelect.value];
        if (selectedAdvisor) advisorWhatsappInput.value = selectedAdvisor.defaultWhatsapp;
    });

    // --- LÓGICA DE SUB-MÓDULOS (CABINAS E ITINERARIO) ---
    function addCabinToCruise(cruiseId) {
        const container = document.getElementById(`cabins-container-${cruiseId}`);
        if (!container) return;
        const cabinCount = container.children.length + 1;
        const template = document.getElementById('template-cabin').innerHTML;
        const html = template.replace(/CRUISEID/g, cruiseId).replace(/CABINID/g, cabinCount);
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        container.appendChild(tempDiv.firstElementChild);
    }

    function generateItineraryTable(cruiseId) {
        const startDateInput = document.getElementById(`fecha-zarpe-${cruiseId}`);
        const nightsInput = document.getElementById(`noches-crucero-${cruiseId}`);
        
        if (!startDateInput?.value || !nightsInput?.value) {
            alert("Por favor, ingresa la Fecha de Embarque y las Noches primero.");
            return;
        }

        const startDate = new Date(startDateInput.value + 'T12:00:00');
        const nights = parseInt(nightsInput.value);
        
        let html = '<table class="itinerary-table"><tr><th>Día</th><th>Fecha</th><th>Puerto</th><th>Llegada</th><th>Salida</th></tr>';
        
        for(let i = 0; i <= nights; i++) {
            let dateStr = startDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            html += `<tr>
                <td>${i + 1}</td>
                <td>${dateStr}</td>
                <td><input type="text" id="itin-port-${cruiseId}-${i}" placeholder="Ej: Miami"></td>
                <td><input type="text" id="itin-arr-${cruiseId}-${i}" placeholder="08:00 AM"></td>
                <td><input type="text" id="itin-dep-${cruiseId}-${i}" placeholder="05:00 PM"></td>
            </tr>`;
            startDate.setDate(startDate.getDate() + 1);
        }
        html += '</table>';
        document.getElementById(`itinerary-container-${cruiseId}`).innerHTML = html;
    }

    // --- GUARDAR EN FIREBASE ---
    form.addEventListener('submit', async e => { 
        e.preventDefault(); 
        if (!form.checkValidity()) { form.reportValidity(); return; }
        if (dynamicComponentsContainer.children.length === 0) { alert('Añade al menos un componente.'); return; }
        
        const quoteData = {
            quoteNumber: document.getElementById('cotizacion-numero').value,
            advisorId: advisorSelect.value,
            advisorName: ADVISORS[advisorSelect.value].name,
            status: 'Pendiente', 
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            formData: serializeForm(form),
            images: pastedImages
        };

        const payloadSize = JSON.stringify(quoteData).length;
        if (payloadSize > 1000000) {
            alert("⚠️ La cotización tiene demasiadas imágenes o son muy pesadas. Por favor, elimina algunas fotos e intenta de nuevo.");
            return;
        }

        try {
            document.getElementById('loader-overlay').style.display = 'flex';
            document.getElementById('loader-text').textContent = "Guardando en la nube...";
            
            if (db) {
                if (currentQuoteId) {
                    delete quoteData.createdAt; 
                    delete quoteData.status; 
                    await db.collection('cotizaciones').doc(currentQuoteId).update(quoteData);
                } else {
                    const docRef = await db.collection('cotizaciones').add(quoteData);
                    currentQuoteId = docRef.id;
                }
            } else {
                console.warn("Firebase no configurado. Saltando guardado en la nube.");
            }
            
            populateQuote(); 
            showView('pdf');
        } catch (error) {
            console.error("Error guardando:", error);
            alert("Hubo un error guardando la cotización. Revisa tu conexión.");
        } finally {
            document.getElementById('loader-overlay').style.display = 'none';
        }
    });

    function serializeForm(formNode) {
        const obj = {};
        const elements = formNode.querySelectorAll('input, select, textarea');
        elements.forEach(el => { 
            if(el.id) {
                if(el.type === 'checkbox') obj[el.id] = el.checked;
                else obj[el.id] = el.value;
            }
        });
        return obj;
    }

    function loadQuoteIntoForm(id, data) {
        currentQuoteId = id;
        initializeForm();
        
        pastedImages = data.images || {};
        const keys = Object.keys(data.formData);
        
        const hotelIds = new Set(keys.filter(k => k.startsWith('hotel-')).map(k => k.split('-')[1]));
        const cruiseIds = new Set(keys.filter(k => k.startsWith('barco-')).map(k => k.split('-')[1]));
        
        hotelIds.forEach(() => addSection('hotel'));
        cruiseIds.forEach(cId => {
            addSection('cruises');
            const cabinKeys = keys.filter(k => k.startsWith(`tipo-cabina-${cId}-`));
            cabinKeys.forEach((_, index) => addCabinToCruise(cId));
        });
        
        if(keys.includes('ciudad-salida')) addSection('flights');
        if(keys.includes('tour-1-name')) addSection('tours');
        if(keys.includes('transfer-1-desc')) addSection('transfers');

        setTimeout(() => {
            keys.forEach(key => {
                const el = document.getElementById(key);
                if(el) {
                    if(el.type === 'checkbox') {
                        el.checked = data.formData[key];
                        if(key === 'is-group-booking') {
                            document.getElementById('group-booking-fields').style.display = el.checked ? 'grid' : 'none';
                        }
                    } else {
                        el.value = data.formData[key];
                    }
                }
            });
            
            cruiseIds.forEach(cId => {
                if(keys.some(k => k.startsWith(`itin-port-${cId}-`))) {
                    generateItineraryTable(cId);
                    keys.filter(k => k.startsWith(`itin-port-${cId}-`) || k.startsWith(`itin-arr-${cId}-`) || k.startsWith(`itin-dep-${cId}-`)).forEach(k => {
                        const el = document.getElementById(k);
                        if(el) el.value = data.formData[k];
                    });
                }
            });

            ['flight', 'tour', 'transfer'].forEach(type => {
                [2, 3].forEach(num => {
                    if(keys.some(k => k.startsWith(`${type}-${num}-`) && data.formData[k])) {
                        const wrapper = document.getElementById(`${type}-${num}-form-wrapper`);
                        const btn = document.getElementById(`btn-add-${type}-${num}`);
                        if(wrapper) wrapper.style.display = 'block';
                        if(btn) btn.style.display = 'none';
                        
                        if(num === 2) {
                            const btn3 = document.getElementById(`btn-add-${type}-3`);
                            if(btn3 && !keys.some(k => k.startsWith(`${type}-3-`) && data.formData[k])) btn3.style.display = 'block';
                        }
                    }
                });
            });

            Object.keys(pastedImages).forEach(imgId => {
                const pasteArea = document.querySelector(`[data-img-id="${imgId}"]`);
                if(pasteArea) {
                    const imgEl = pasteArea.querySelector('img');
                    const pTag = pasteArea.querySelector('.paste-placeholder');
                    const removeBtn = pasteArea.querySelector('.remove-img-btn');

                    imgEl.setAttribute('crossOrigin', 'anonymous');
                    let imgSrc = pastedImages[imgId];
                    imgSrc = imgSrc + (imgSrc.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
                    
                    imgEl.src = imgSrc;
                    imgEl.style.display = 'block';
                    if(pTag) pTag.style.display = 'none';
                    if(removeBtn) removeBtn.style.display = 'flex';
                }
            });
            
            showView('form');
        }, 200); 
    }

    // --- RENDERIZADO DEL PDF ---
    const NAVIERA_LOGOS = {
        'Royal Caribbean': 'https://i.imgur.com/vLgm4WP.png',
        'Carnival Cruise Line': 'https://i.imgur.com/3jRznTz.png',
        'MSC Cruises': 'https://i.imgur.com/N7GB1Pj.png',
        'Norwegian Cruise Line (NCL)': 'https://i.imgur.com/umtaXo7.png',
        'Princess Cruises': 'https://i.imgur.com/W2ytAT5.png',
        'Celebrity Cruises': 'https://i.imgur.com/lyLHd2L.png',
        'Disney Cruise Line': 'https://i.imgur.com/6hd8679.png',
        'AmaWaterways': 'https://i.imgur.com/JT7LBaX.png',
        'Costa Cruceros': 'https://i.imgur.com/sQaeAwI.png',
        'Virgin Voyages': 'https://i.imgur.com/Q9J5tx5.png'
    };

    function formatCurrency(value, currency = 'COP') {
        if (!value) return '';
        const number = parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
        if (isNaN(number)) return value; 
        return number.toLocaleString(currency === 'COP' ? 'es-CO' : 'en-US', { style: 'currency', currency, minimumFractionDigits: 0 }) + ' ' + currency;
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const[year, month, day] = dateStr.split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function populateQuote() {
        const quoteNumber = document.getElementById('cotizacion-numero')?.value || '';
        
        const adults = document.getElementById('adultos')?.value || '0';
        const youths = document.getElementById('jovenes')?.value || '0';
        const children = document.getElementById('ninos')?.value || '0';
        
        const introTextEl = document.getElementById('confirm-intro-text');
        if (introTextEl) {
            introTextEl.textContent = `¡Hola! Te compartimos las mejores opciones que hemos encontrado para ti.`;
        }

        let paxString = `${adults} Adulto${adults > 1 ? 's' : ''}`;
        if (parseInt(youths) > 0) paxString += `, ${youths} Joven${youths > 1 ? 'es' : ''}`;
        if (parseInt(children) > 0) paxString += `, ${children} Niño${children > 1 ? 's' : ''}`;

        const today = new Date();
        const quoteDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

        const customerBox = document.getElementById('confirm-customer-data-box');
        if (customerBox) {
            customerBox.innerHTML = `
                <p>Pasajeros: <strong>${paxString}</strong></p>
                <p>Nº Cotización: <strong>${quoteNumber}</strong> | Fecha: <strong>${quoteDate}</strong> | Validez: <strong>${document.getElementById('validez-cupos')?.value || ''}</strong></p>
            `;
        }

        const advisor = ADVISORS[advisorSelect.value];
        const whatsappLink = `https://wa.me/${advisorWhatsappInput.value}`;
        
        // INYECTAR TARJETA DEL ASESOR
        const advisorCardContainer = document.getElementById('confirm-advisor-card');
        if (advisorCardContainer && advisor) {
            const wppMessage = encodeURIComponent(`Hola ${advisor.name}, tengo una consulta sobre mi cotización *${quoteNumber}*.`);
            advisorCardContainer.innerHTML = `
                <div class="advisor-card-suroeste">
                    <div class="advisor-info-left">
                        <img src="${advisor.photoUrl}" alt="${advisor.name}">
                        <div class="text-info">
                            <p>Preparado por tu asesor de viajes:</p>
                            <h4>${advisor.name}</h4>
                        </div>
                    </div>
                    <a href="${whatsappLink}?text=${wppMessage}" target="_blank" class="btn-whatsapp pdf-link">
                        Contactar por WhatsApp
                    </a>
                </div>
            `;
        }

        confirmationComponentsContainer.innerHTML = '';
        let dynamicTermsHTML = '';

        // 1. RENDERIZAR HOTELES
        const hotelWrappers = document.querySelectorAll('.hotel-form-wrapper');
        if(hotelWrappers.length > 0) dynamicTermsHTML += TERMS_AND_CONDITIONS.hotels;
        hotelWrappers.forEach((form, index) => {
            const num = form.id.match(/\d+/)[0];
            let galleryHTML =[1, 2, 3].map(i => pastedImages[`hotel-${num}-foto-${i}`] ? `<img src="${pastedImages[`hotel-${num}-foto-${i}`]}">` : '').join('');
            
            const destino = document.getElementById(`destino-${num}`)?.value || '';
            const fecha = document.getElementById(`fecha-viaje-${num}`)?.value || '';
            const nochesEl = document.getElementById(`cantidad-noches-${num}`);
            const habsEl = document.getElementById(`cantidad-habitaciones-${num}`);
            const regimen = document.getElementById(`regimen-${num}`)?.value || '';
            const valor = document.getElementById(`valor-total-${num}`)?.value || '';
            const moneda = document.getElementById(`moneda-${num}`)?.value || 'COP';
            const hotelName = document.getElementById(`hotel-${num}`)?.value || '';

            confirmationComponentsContainer.innerHTML += `
                <div class="quote-option-box">
                    <div class="option-header"><h3>Hotel ${index + 1}</h3><span class="option-price">${formatCurrency(valor, moneda)}</span></div>
                    <div class="option-body">
                        <h4>${hotelName}</h4>
                        <div class="photo-gallery">${galleryHTML}</div>
                        <div class="details-grid">
                            <div class="data-item">${ICONS.destination}<div class="data-item-content"><strong>Destino:</strong><p>${destino}</p></div></div>
                            <div class="data-item">${ICONS.calendar}<div class="data-item-content"><strong>Fechas:</strong><p>${formatDate(fecha)}</p></div></div>
                            <div class="data-item">${ICONS.moon}<div class="data-item-content"><strong>Noches:</strong><p>${nochesEl ? nochesEl.options[nochesEl.selectedIndex].text : ''}</p></div></div>
                            <div class="data-item">${ICONS.bed}<div class="data-item-content"><strong>Habitaciones:</strong><p>${habsEl ? habsEl.options[habsEl.selectedIndex].text : ''}</p></div></div>
                            <div class="data-item full-width">${ICONS.check}<div class="data-item-content"><strong>Plan Incluye:</strong><p>${REGIMEN_TEMPLATES[regimen] || 'No especificado'}</p></div></div>
                        </div>
                    </div>
                </div>`;
        });

        // 2. RENDERIZAR CRUCEROS
        const cruiseWrappers = document.querySelectorAll('.cruises-form-wrapper');
        if(cruiseWrappers.length > 0) dynamicTermsHTML += TERMS_AND_CONDITIONS.cruises;
        
        cruiseWrappers.forEach((form, index) => {
            const num = form.id.match(/\d+/)[0];
            
            const titulo = document.getElementById(`titulo-crucero-${num}`)?.value || `OPCIÓN DE CRUCERO ${index + 1}`;
            const naviera = document.getElementById(`naviera-${num}`)?.value || '';
            const barco = document.getElementById(`barco-${num}`)?.value || '';
            const puerto = document.getElementById(`puerto-${num}`)?.value || '';
            const fecha = document.getElementById(`fecha-zarpe-${num}`)?.value || '';
            const noches = document.getElementById(`noches-crucero-${num}`)?.value || '';
            const videoLink = document.getElementById(`video-link-${num}`)?.value || '';
            
            let galleryHTML =[1, 2, 3].map(i => pastedImages[`crucero-${num}-foto-${i}`] ? `<img src="${pastedImages[`crucero-${num}-foto-${i}`]}">` : '').join('');
            let mapHTML = pastedImages[`crucero-${num}-mapa`] ? `<div class="single-photo-container"><img src="${pastedImages[`crucero-${num}-mapa`]}"></div>` : '';
            
            const logoUrl = NAVIERA_LOGOS[naviera];
            const logoHTML = logoUrl ? `<img src="${logoUrl}" alt="${naviera}" style="max-height: 60px; max-width: 200px; object-fit: contain;">` : '';

            let itineraryHTML = '';
            const itinContainer = document.getElementById(`itinerary-container-${num}`);
            if (itinContainer && itinContainer.querySelector('table')) {
                itineraryHTML = `<table class="pdf-itinerary-table"><tr><th>Día</th><th>Fecha</th><th>Puerto</th><th>Llegada</th><th>Salida</th></tr>`;
                const rows = itinContainer.querySelectorAll('tr');
                for(let i = 1; i < rows.length; i++) { 
                    const cells = rows[i].querySelectorAll('td');
                    const inputs = rows[i].querySelectorAll('input');
                    if(cells.length >= 5 && inputs.length >= 3) {
                        itineraryHTML += `<tr>
                            <td>${cells[0].textContent}</td>
                            <td>${cells[1].textContent}</td>
                            <td><strong>${inputs[0].value || '-'}</strong></td>
                            <td>${inputs[1].value || '-'}</td>
                            <td>${inputs[2].value || '-'}</td>
                        </tr>`;
                    }
                }
                itineraryHTML += `</table>`;
            }

            let cabinsHTML = '';
            const cabinElements = document.querySelectorAll(`[id^="cabin-wrapper-${num}-"]`);
            cabinElements.forEach(cabinEl => {
                const cId = cabinEl.id.split('-').pop();
                const tipo = document.getElementById(`tipo-cabina-${num}-${cId}`)?.value || '';
                const numCabina = document.getElementById(`num-cabina-${num}-${cId}`)?.value || 'Garantizada';
                const pax = document.getElementById(`pax-cabina-${num}-${cId}`)?.value || '';
                const inclusiones = document.getElementById(`inclusiones-cabina-${num}-${cId}`)?.value || '';
                const precioUSD = document.getElementById(`precio-usd-${num}-${cId}`)?.value || '';
                const reservaUSD = document.getElementById(`reserva-usd-${num}-${cId}`)?.value || '';
                const fechaPago = document.getElementById(`fecha-pago-${num}-${cId}`)?.value || '';
                const estimadoCOP = document.getElementById(`estimado-cop-${num}-${cId}`)?.value || '';

                let copDisclaimer = '';
                if (estimadoCOP) {
                    copDisclaimer = `
                        <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc;">
                            <strong style="color: var(--c-brand-primary); font-size: 15px;">Estimado en Pesos: ${formatCurrency(estimadoCOP, 'COP')}</strong>
                        </div>
                    `;
                }

                cabinsHTML += `
                    <div class="cabin-card">
                        <div class="cabin-card-header">
                            <h5>Cabina: ${tipo}</h5>
                            <div style="text-align: right;">
                                <span class="cabin-price-tag">Total: ${formatCurrency(precioUSD, 'USD')}</span>
                                ${reservaUSD ? `<div style="margin-top: 8px; font-size: 14px; color: var(--c-brand-primary); font-weight: 900;">Reserva con: ${formatCurrency(reservaUSD, 'USD')}</div>` : ''}
                                ${fechaPago ? `<div style="margin-top: 4px; font-size: 12px; color: var(--c-gray);">Paga el restante antes de: <strong>${fechaPago}</strong></div>` : ''}
                            </div>
                        </div>
                        <div class="cabin-details">
                            <p><strong>Número:</strong> ${numCabina}</p>
                            <p><strong>Pasajeros:</strong> ${pax}</p>
                            <div class="cabin-inclusions"><strong>Incluye:</strong> ${inclusiones}</div>
                        </div>
                        ${copDisclaimer}
                        <p style="font-size: 10px; color: #999; margin-top: 10px; text-align: right;">*Precio total para todos los pasajeros en esta cabina.</p>
                    </div>
                `;
            });
           
            confirmationComponentsContainer.innerHTML += `
                <div class="quote-option-box" style="position: relative;">
                    <div class="option-header">
                        <h3 style="margin: 0;">${titulo}</h3>
                    </div>
                    <div class="option-body">
                        
                        ${logoHTML ? `<div style="text-align: center; margin-bottom: 25px;">${logoHTML}</div>` : ''}
                        
                        <div class="cruise-specs-grid">
                            <div class="cruise-spec-item">${ICONS.ship} <div><strong>Barco:</strong><span>${barco}</span></div></div>
                            <div class="cruise-spec-item">${ICONS.destination} <div><strong>Puerto de Embarque:</strong><span>${puerto}</span></div></div>
                            <div class="cruise-spec-item">${ICONS.calendar} <div><strong>Fecha de Embarque:</strong><span>${formatDate(fecha)}</span></div></div>
                            <div class="cruise-spec-item">${ICONS.moon} <div><strong>Duración:</strong><span>${noches} Noches</span></div></div>
                        </div>

                        ${videoLink ? `<div style="text-align: center; margin-bottom: 20px;"><a href="${videoLink}" target="_blank" class="pdf-link" style="background: #ff0000; color: white; padding: 10px 20px; border-radius: 50px; text-decoration: none; font-weight: bold; display: inline-block;">🎬 Ver video del barco</a></div>` : ''}

                        ${mapHTML}
                        <div class="photo-gallery">${galleryHTML}</div>
                        
                        ${itineraryHTML ? `<div style="margin: 25px 0;">
                            <strong style="color: var(--c-dark-blue); display: block; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">📍 ITINERARIO DEL VIAJE:</strong>
                            ${itineraryHTML}
                        </div>` : ''}

                        <div style="margin-top: 30px;">
                            <h4 style="color: var(--c-brand-primary); margin-bottom: 15px; border-bottom: 2px solid var(--c-brand-primary); display: inline-block;">Opciones de Cabina Disponibles</h4>
                            ${cabinsHTML}
                        </div>
                    </div>
                </div>`;
        });

        // 3. RENDERIZAR VUELOS
        if (document.getElementById('flights-form-wrapper')) {
            dynamicTermsHTML += TERMS_AND_CONDITIONS.flights;
            const departureCity = document.getElementById('ciudad-salida')?.value || '';
            let optionsHTML = [1, 2, 3].map(i => {
                const airlineEl = document.getElementById(`flight-${i}-airline`);
                const descEl = document.getElementById(`flight-${i}-desc`);
                const priceEl = document.getElementById(`flight-${i}-price`);
                if (airlineEl && priceEl && airlineEl.value && priceEl.value) {
                    return `
                    <div class="item-option" style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                        <strong>Opción ${i}: ${airlineEl.value}</strong>
                        ${descEl && descEl.value ? `<p style="margin: 5px 0; font-size: 13px; color: var(--c-gray); white-space: pre-wrap;">${descEl.value}</p>` : ''}
                        <span class="item-price" style="display: block; margin-top: 5px;">Desde ${formatCurrency(priceEl.value)}</span>
                    </div>`;
                } 
                return '';
            }).join('');
            
            confirmationComponentsContainer.innerHTML += `
                <div class="component-section">
                    <div class="option-header"><h3>Vuelos Sugeridos</h3></div>
                    <div class="option-body">
                        ${pastedImages['flight-banner-preview'] ? `<div class="flight-banner" style="text-align: center; margin-bottom: 15px;"><img src="${pastedImages['flight-banner-preview']}" style="width: 100%; max-width: 780px; height: 360px; object-fit: cover; border-radius: 12px;"></div>` : ''}
                        <div id="flight-options-confirm-container">
                            <div class="data-item" style="margin-bottom: 15px;">${ICONS.plane}<div class="data-item-content"><strong>Desde:</strong><p>${departureCity}</p></div></div>
                            ${optionsHTML}
                        </div>
                        <p style="font-size: 11px; color: var(--c-gray); margin-top: 10px;">*Valores por persona, sujetos a cambio.</p>
                    </div>
                </div>`;
        }

        // 4. RENDERIZAR TOURS
        if (document.getElementById('tours-form-wrapper')) {
            let galleryHTML =[1, 2, 3].map(i => pastedImages[`tour-foto-${i}`] ? `<img src="${pastedImages[`tour-foto-${i}`]}">` : '').join('');
            
            let optionsHTML =[1, 2, 3].map(i => {
                const nameEl = document.getElementById(`tour-${i}-name`);
                const descEl = document.getElementById(`tour-${i}-desc`);
                const priceEl = document.getElementById(`tour-${i}-price`);
                if (nameEl && priceEl && nameEl.value && priceEl.value) {
                    return `
                    <div class="item-option" style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                        <strong>Opción ${i}: ${nameEl.value}</strong>
                        ${descEl && descEl.value ? `<p style="margin: 5px 0; font-size: 13px; color: var(--c-gray); white-space: pre-wrap;">${descEl.value}</p>` : ''}
                        <span class="item-price" style="display: block; margin-top: 5px;">Desde ${formatCurrency(priceEl.value)}</span>
                    </div>`;
                } 
                return '';
            }).join('');

            confirmationComponentsContainer.innerHTML += `
                <div class="component-section">
                    <div class="option-header"><h3>Tours Opcionales</h3></div>
                    <div class="option-body">
                        <div class="photo-gallery">${galleryHTML}</div>
                        ${optionsHTML}
                    </div>
                </div>`;
        }

        // 5. RENDERIZAR TRASLADOS
        if (document.getElementById('transfers-form-wrapper')) {
            dynamicTermsHTML += TERMS_AND_CONDITIONS.transfers;
            let optionsHTML =[1, 2, 3].map(i => {
                const descEl = document.getElementById(`transfer-${i}-desc`);
                const priceEl = document.getElementById(`transfer-${i}-price`);
                if (descEl && priceEl && descEl.value && priceEl.value) {
                    return `
                    <div class="item-option" style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                        <strong>Opción ${i}: ${descEl.value}</strong>
                        <span class="item-price" style="display: block; margin-top: 5px;">Desde ${formatCurrency(priceEl.value)}</span>
                    </div>`;
                } 
                return '';
            }).join('');

            confirmationComponentsContainer.innerHTML += `
                <div class="component-section">
                    <div class="option-header"><h3>Traslados</h3></div>
                    <div class="option-body">
                        ${optionsHTML}
                    </div>
                </div>`;
        }

        // INYECCIÓN DE LA BARRA DE PAGOS (SOLO GRUPOS)
        const isGroupBooking = document.getElementById('is-group-booking')?.checked;
        const paymentBar = document.getElementById('group-payment-bar');
        
        if (isGroupBooking && paymentBar) {
            const globalTotal = document.getElementById('global-total')?.value || '';
            const globalMessage = document.getElementById('global-message')?.value || '';
            
            paymentBar.style.display = 'flex';
            paymentBar.innerHTML = `
                <div class="payment-step" style="text-align: center; width: 100%;">
                    <span style="font-size: 16px;">Total Global de la Reserva:</span>
                    <h3 style="font-size: 28px; margin-top: 5px;">${globalTotal}</h3>
                    ${globalMessage ? `<p style="margin-top: 10px; font-size: 14px; opacity: 0.9;">${globalMessage}</p>` : ''}
                </div>
            `;
        } else if (paymentBar) {
            paymentBar.style.display = 'none';
        }

        const noIncluyeEl = document.getElementById('confirm-no-incluye');
        if(noIncluyeEl) noIncluyeEl.textContent = document.getElementById('no-incluye')?.value || '';

        const termsContentEl = document.getElementById('confirm-terms-content');
        if(termsContentEl) {
            termsContentEl.innerHTML = dynamicTermsHTML + GENERAL_TERMS;
            document.getElementById('terms-section-confirm').style.display = 'block';
        }

        // Asignar links de WhatsApp a los botones finales
        ['cta-reservar', 'cta-contactar'].forEach(id => {
            const el = document.getElementById(id);
            if (el && advisor) {
                const baseText = id === 'cta-reservar' ? `¡Hola ${advisor.name}! Estoy listo para reservar según la cotización *${quoteNumber}*.` : `Hola ${advisor.name}, tengo una pregunta sobre la cotización *${quoteNumber}*.`;
                el.href = `${whatsappLink}?text=${encodeURIComponent(baseText)}`;
            }
        });
    }

    document.getElementById('edit-quote-btn').addEventListener('click', () => showView('form'));
    document.getElementById('new-quote-btn').addEventListener('click', () => loadDashboard());
    
    // REEMPLAZA TODO EL EVENTO process-quote-btn AL FINAL DE script.js
    const processBtn = document.getElementById('process-quote-btn');
    if (processBtn) {
        processBtn.addEventListener('click', async () => {
            document.getElementById('loader-overlay').style.display = 'flex';
            document.getElementById('loader-text').textContent = "Generando PDF...";
            
            try {
                const elementToPrint = document.getElementById('voucher-to-print');
                const wrapperEl = document.querySelector('.wrapper');
                
                // FIX: Quitar overflow temporalmente para que html2canvas no recorte el PDF
                const originalWrapperOverflow = wrapperEl ? wrapperEl.style.overflow : '';
                const originalPrintOverflow = elementToPrint.style.overflow;
                if (wrapperEl) wrapperEl.style.overflow = 'visible';
                elementToPrint.style.overflow = 'visible';

                const images = elementToPrint.getElementsByTagName('img');
                for (let i = 0; i < images.length; i++) {
                    if (images[i].src.includes('firebasestorage')) {
                        images[i].setAttribute('crossOrigin', 'anonymous');
                        images[i].src = images[i].src + (images[i].src.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 1000));

                const canvas = await html2canvas(elementToPrint, { 
                    scale: 2, 
                    useCORS: true,
                    allowTaint: false,
                    scrollY: 0, // Forzar renderizado desde arriba
                    windowHeight: elementToPrint.scrollHeight // Capturar toda la altura real
                });
                
                // Restaurar overflow original
                if (wrapperEl) wrapperEl.style.overflow = originalWrapperOverflow;
                elementToPrint.style.overflow = originalPrintOverflow;
                
                const pdf = new window.jspdf.jsPDF({ orientation: 'p', unit: 'px', format:[canvas.width, canvas.height] });
                pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, canvas.width, canvas.height);
                
                const scaleFactor = canvas.width / elementToPrint.offsetWidth;
                
                const pdfLinks = elementToPrint.querySelectorAll('.pdf-link');
                pdfLinks.forEach(element => {
                    if (!element.href) return;
                    const rect = element.getBoundingClientRect();
                    const containerRect = elementToPrint.getBoundingClientRect();
                    pdf.link(
                        (rect.left - containerRect.left) * scaleFactor,
                        (rect.top - containerRect.top) * scaleFactor,
                        rect.width * scaleFactor,
                        rect.height * scaleFactor,
                        { url: element.href }
                    );
                });

                pdf.save(`${document.getElementById('cotizacion-numero').value}.pdf`);
            } catch (error) { 
                console.error("Error generando PDF:", error);
                alert("Error generando PDF. Revisa la consola para más detalles."); 
            } finally { 
                document.getElementById('loader-overlay').style.display = 'none'; 
            }
        });
    }
        document.getElementById('loader-overlay').style.display = 'flex';
        document.getElementById('loader-text').textContent = "Generando PDF...";
        
        try {
            const elementToPrint = document.getElementById('voucher-to-print');
            if (elementToPrint) {
                const headerEl = elementToPrint.querySelector('.confirmation-header');
                if (headerEl) {
                    headerEl.style.padding = '30px 20px';
                    headerEl.style.backgroundColor = 'var(--c-brand-primary)';
                    headerEl.style.borderRadius = '24px 24px 0 0';
                    headerEl.style.display = 'flex';
                    headerEl.style.justifyContent = 'center';
                    headerEl.style.alignItems = 'center';
                    headerEl.innerHTML = `<img src="https://i.imgur.com/Rnc6C2t.png" alt="Suroeste Travel" style="max-width: 250px; height: auto; display: block;">`;
                }
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

            const canvas = await html2canvas(elementToPrint, { 
                scale: 2, 
                useCORS: true,
                allowTaint: false 
            });
            
            const pdf = new window.jspdf.jsPDF({ orientation: 'p', unit: 'px', format:[canvas.width, canvas.height] });
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, canvas.width, canvas.height);
            
            const scaleFactor = canvas.width / elementToPrint.offsetWidth;
            
            const pdfLinks = elementToPrint.querySelectorAll('.pdf-link');
            pdfLinks.forEach(element => {
                if (!element.href) return;
                const rect = element.getBoundingClientRect();
                const containerRect = elementToPrint.getBoundingClientRect();
                pdf.link(
                    (rect.left - containerRect.left) * scaleFactor,
                    (rect.top - containerRect.top) * scaleFactor,
                    rect.width * scaleFactor,
                    rect.height * scaleFactor,
                    { url: element.href }
                );
            });

            pdf.save(`${document.getElementById('cotizacion-numero').value}.pdf`);
        } catch (error) { 
            console.error("Error generando PDF:", error);
            alert("Error generando PDF. Revisa la consola para más detalles."); 
        } finally { 
            document.getElementById('loader-overlay').style.display = 'none'; 
        }
    });
});
