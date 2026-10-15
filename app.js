const TARIFAS_DEFAULT = {
    "G1": { desc: "500 kg / 1 palet", min: 70, km_std: 0.55, km_ptl: 0.55, h_std: 22, h_ptl: 22, carga: 8 },
    "G2": { desc: "1200 kg / 3 palets", min: 70, km_std: 0.55, km_ptl: 0.55, h_std: 25, h_ptl: 25, carga: 8 },
    "G3": { desc: "1200 kg / 4 palets", min: 70, km_std: 0.55, km_ptl: 0.55, h_std: 25, h_ptl: 25, carga: 8 },
    "G4": { desc: "1200 kg / 5 palets", min: 70, km_std: 0.55, km_ptl: 0.60, h_std: 25, h_ptl: 30, carga: 8 },
    "G5": { desc: "800 kg / 8 palets", min: 80, km_std: 0.65, km_ptl: 0.70, h_std: 30, h_ptl: 35, carga: 10 },
    "G6": { desc: "2300 kg / 10 palets", min: 80, km_std: 0.70, km_ptl: 0.75, h_std: 35, h_ptl: 40, carga: 12 },
    "G7": { desc: "3000 kg / 14-16 palets", min: 90, km_std: 0.90, km_ptl: 0.95, h_std: 38, h_ptl: 42, carga: 14 },
    "G8": { desc: "8000 kg / 18-20 palets", min: 90, km_std: 1.00, km_ptl: 1.10, h_std: 40, h_ptl: 45, carga: 16 }
};

let tarifas;
try {
    tarifas = JSON.parse(localStorage.getItem('tarifas_config')) || TARIFAS_DEFAULT;
} catch (e) {
    tarifas = TARIFAS_DEFAULT;
}

function init() {
    const sel = document.getElementById('vehiculo');
    if (!sel) return;
    sel.innerHTML = '';
    for (let cod in tarifas) {
        let opt = document.createElement('option');
        opt.value = cod;
        opt.innerText = `${cod} -${tarifas[cod].desc}`;
        sel.appendChild(opt);
    }
    sel.value = "G4";
    calcular();
}

function mround(val, multiple) {
    return Math.round(val / multiple) * multiple;
}

function calcularHoras(h1Str, h2Str) {
    if (!h1Str || !h2Str) return 0;
    const [h1, m1] = h1Str.split(':').map(Number);
    const [h2, m2] = h2Str.split(':').map(Number);
    let min1 = h1 * 60 + m1;
    let min2 = h2 * 60 + m2;
    if (min2 < min1) min2 += 24 * 60;
    return (min2 - min1) / 60;
}

function calcular() {
    const sel = document.getElementById('vehiculo');
    if (!sel) return;
    const cod = sel.value;
    if (!cod || !tarifas[cod]) return;
    
    const t = tarifas[cod];
    const servicio = document.getElementById('servicio').value;
    const km = parseFloat(document.getElementById('km').value) || 0;
    const paralizacion = parseFloat(document.getElementById('paralizacion').value) || 0;
    const esPtl = document.getElementById('ptl').checked;
    const esPernocta = document.getElementById('pernocta').checked;

    const horas = calcularHoras(document.getElementById('hInicio').value, document.getElementById('hFin').value);
    document.getElementById('totalHoras').value = horas.toFixed(2) + " hrs";

    const tKm = esPtl ? t.km_ptl : t.km_std;
    const tHora = esPtl ? t.h_ptl : t.h_std;

    let horasComputables = 0;
    if (servicio === "Reparto") {
        horasComputables = horas - (km / 80.0);
    } else if (servicio === "Recogida") {
        horasComputables = horas;
    } // Directo = 0.0

    const costoKm = km * tKm;
    const costoHoras = (horasComputables + paralizacion) * tHora;
    const costoCarga = t.carga;
    const costoPernocta = esPernocta ? 60.0 : 0.0;

    const subtotal = costoKm + costoHoras + costoCarga + costoPernocta;
    const base = Math.max(t.min, subtotal);
    const final = mround(Math.ceil(base) + 2.49, 5);

    document.getElementById('precioFinal').innerText = final.toFixed(2) + " €";
    document.getElementById('detalles').innerText = `Tarifa Mín: ${t.min} € \vert{} Subtotal:${subtotal.toFixed(2)} €`;
}

function abrirAjustes() {
    const vehiculoActual = document.getElementById('vehiculo').value;
    const container = document.getElementById('formAjustes');
    
    // Generar botones de pestañas (G1 a G8)
    let navHtml = `<div style="display:flex; gap:4px; overflow-x:auto; padding-bottom:10px; margin-bottom:10px;">`;
    for (let cod in tarifas) {
        const activeStyle = cod === vehiculoActual ? "background:#38bdf8; color:#0f172a;" : "background:#1e293b; color:#fff;";
        navHtml += `<button type="button" id="tab_btn_${cod}" onclick="cambiarTabAjustes('${cod}')" style="padding:6px 10px; border:1px solid #334155; border-radius:6px; font-weight:bold; cursor:pointer; ${activeStyle}">${cod}</button>`;
    }
    navHtml += `</div>`;

    // Generar los formularios para todos los vehículos (ocultando los que no están activos)
    let formHtml = ``;
    for (let cod in tarifas) {
        const t = tarifas[cod];
        const isHidden = cod === vehiculoActual ? "" : "display:none;";
        formHtml += `
            <div id="tab_content_${cod}" class="tab-content" style="${isHidden}">
                <h4 style="color:#38bdf8; margin-bottom:10px; text-align:center;">${cod} - ${t.desc}</h4>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:10px;">
                    <div><label>Tarifa Mín (€):</label><input type="number" id="edit_min_${cod}" value="${t.min}"></div>
                    <div><label>Carga (€):</label><input type="number" id="edit_carga_${cod}" value="${t.carga}"></div>
                    <div><label>Km Std (€):</label><input type="number" step="0.01" id="edit_km_std_${cod}" value="${t.km_std}"></div>
                    <div><label>Km PTL (€):</label><input type="number" step="0.01" id="edit_km_ptl_${cod}" value="${t.km_ptl}"></div>
                    <div><label>Hora Std (€):</label><input type="number" id="edit_h_std_${cod}" value="${t.h_std}"></div>
                    <div><label>Hora PTL (€):</label><input type="number" id="edit_h_ptl_${cod}" value="${t.h_ptl}"></div>
                </div>
            </div>
        `;
    }

    container.innerHTML = navHtml + formHtml;
    document.getElementById('modalAjustes').style.display = 'flex';
}

function cambiarTabAjustes(codSeleccionado) {
    for (let cod in tarifas) {
        const content = document.getElementById(`tab_content_${cod}`);
        const btn = document.getElementById(`tab_btn_${cod}`);
        if (cod === codSeleccionado) {
            if (content) content.style.display = 'block';
            if (btn) {
                btn.style.background = '#38bdf8';
                btn.style.color = '#0f172a';
            }
        } else {
            if (content) content.style.display = 'none';
            if (btn) {
                btn.style.background = '#1e293b';
                btn.style.color = '#fff';
            }
        }
    }
}

function guardarAjustes() {
    for (let cod in tarifas) {
        const inputMin = document.getElementById(`edit_min_${cod}`);
        if (inputMin) {
            tarifas[cod].min = parseFloat(inputMin.value) || 0;
            tarifas[cod].carga = parseFloat(document.getElementById(`edit_carga_${cod}`).value) || 0;
            tarifas[cod].km_std = parseFloat(document.getElementById(`edit_km_std_${cod}`).value) || 0;
            tarifas[cod].km_ptl = parseFloat(document.getElementById(`edit_km_ptl_${cod}`).value) || 0;
            tarifas[cod].h_std = parseFloat(document.getElementById(`edit_h_std_${cod}`).value) || 0;
            tarifas[cod].h_ptl = parseFloat(document.getElementById(`edit_h_ptl_${cod}`).value) || 0;
        }
    }

    try {
        localStorage.setItem('tarifas_config', JSON.stringify(tarifas));
    } catch(e) {}
    
    cerrarAjustes();
    calcular();
}

function cerrarAjustes() {
    document.getElementById('modalAjustes').style.display = 'none';
}

window.onload = init;