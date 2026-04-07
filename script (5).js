/* ==========================================
   COTIZADOR PRO - SUROESTE TRAVEL
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {

    const ACCESS_PASSWORD = '3054466406*'; // Puedes cambiarla si lo deseas

    // --- CONFIGURACIÓN FIREBASE (SUROESTE TRAVEL) ---
    // IMPORTANTE: Debes llenar estos datos con tu nuevo proyecto de Firebase
    const firebaseConfig = {
        apiKey: "TU_NUEVA_API_KEY",
        authDomain: "tu-nuevo-proyecto.firebaseapp.com",
        projectId: "tu-nuevo-proyecto",
        storageBucket: "tu-nuevo-proyecto.firebasestorage.app",
        messagingSenderId: "TU_SENDER_ID",
        appId: "TU_APP_ID"
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

    // --- ASESORES SUROESTE TRAVEL ---
    const ADVISORS = {
        'Daniela': { 
            name: 'Daniela Cardona', 
            photoUrl: 'https://i.imgur.com/Rnc6C2t.png', // Reemplazar por la foto real de Daniela
            defaultWhatsapp: '573216148555' 
        }
    };

    // ... (Mantener constantes ICONS, REGIMEN_TEMPLATES, TERMS_AND_CONDITIONS y GENERAL_TERMS intactas) ...

    // --- LÓGICA DE LOGIN ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (passwordInput.value.trim() === ACCESS_PASSWORD) {
            loginOverlay.style.display = 'none';
            mainWrapper.style.display = 'block';
            // fetchTRM(); // Opcional si usas TRM
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
            // ... (Lógica de filtrado intacta)
        } catch (error) {
            quotesList.innerHTML = '<p style="color:red;">Error al cargar datos. Verifica tu configuración de Firebase.</p>';
            console.error(error);
        }
    }

    // ... (Mantener funciones renderQuotes, generateQuoteNumber, addSection, removeSection, handlePaste intactas) ...

    function initializeForm() {
        form.reset();
        pastedImages = {};
        hotelCounter = 0;
        cruiseCounter = 0;
        dynamicComponentsContainer.innerHTML = '';
        document.querySelectorAll('.add-section-btn').forEach(btn => btn.style.display = 'block');
        document.getElementById('group-booking-fields').style.display = 'none';
        
        advisorSelect.innerHTML = '<option value="" disabled selected>Selecciona tu nombre</option>' + Object.keys(ADVISORS).map(id => `<option value="${id}">${ADVISORS[id].name}</option>`).join('');
        
        // ... (Resto de inicialización intacta)
    }

    advisorSelect.addEventListener('change', () => {
        const selectedAdvisor = ADVISORS[advisorSelect.value];
        if (selectedAdvisor) advisorWhatsappInput.value = selectedAdvisor.defaultWhatsapp;
    });

    // --- RENDERIZADO DEL PDF ---
    function populateQuote() {
        const quoteNumber = document.getElementById('cotizacion-numero')?.value || '';
        const advisor = ADVISORS[advisorSelect.value];
        const whatsappLink = `https://wa.me/${advisorWhatsappInput.value}`;
        
        // 1. INYECTAR TARJETA DEL ASESOR (NUEVO REQUERIMIENTO)
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

        // ... (Mantener el resto de la lógica de populateQuote intacta para Hoteles, Cruceros, Vuelos, etc.)['cta-reservar', 'cta-contactar'].forEach(id => {
            const el = document.getElementById(id);
            if (el && advisor) {
                const baseText = id === 'cta-reservar' ? `¡Hola ${advisor.name}! Estoy listo para reservar según la cotización *${quoteNumber}*.` : `Hola ${advisor.name}, tengo una pregunta sobre la cotización *${quoteNumber}*.`;
                el.href = `${whatsappLink}?text=${encodeURIComponent(baseText)}`;
            }
        });
    }

    // ... (Mantener lógica de html2canvas y jsPDF intacta)
});