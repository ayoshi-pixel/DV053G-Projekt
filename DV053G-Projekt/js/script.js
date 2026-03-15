const monthTitle = document.getElementById("monthTitle");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");
// Array med datum-platser
const dates = [
    document.getElementById("d0"),
    document.getElementById("d1"),
    document.getElementById("d2"),
    document.getElementById("d3"),
    document.getElementById("d4"),
];
// Array med alla månader
const months = [
    "Januari","Februari","Mars","April","Maj","Juni",
    "Juli","Augusti","September","Oktober","November","December"
];
// Skapar dagens datum
let currentDate = new Date();

// Funktion som uppdaterar kalendern
function updateCalendar(){

    // Hämtar året
    let year = currentDate.getFullYear();
    // Hämtar månad 0-11
    let month = currentDate.getMonth();
    // Visar månad och år
    monthTitle.textContent = months[month] + "  " + year;

// första dagen i månaden
    let firstDay = new Date(year, month, 1);

    // hittar första måndagen
    let day = firstDay.getDay();
    // Räknar dagarna till första måndag
    let diff = (day === 0 ? 1 : 8 - day);
    // Skapar första måndagen
    let monday = new Date(year, month, 1 + diff);

// fyll datumen i kalendern
    for(let i = 0; i < 5; i++){

        let d = new Date(monday);
        // Lägger till resterande dagar från måndag
        d.setDate(monday.getDate() + i);
        // Visar dag och månad
        dates[i].textContent = d.getDate() + "/" + (d.getMonth()+1);

    }

}
// Visning av förgående månad vid click
prevBtn.addEventListener("click", function(){

    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();

});
// Visning av nästkommande månad vid click
nextBtn.addEventListener("click", function(){

    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();

});
// Körs direkt när sidan laddas
updateCalendar();
// ── TILLAGD KOD: boka, avboka, filtrera ──────────────────────────

const bookings = {};
const HOURS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"];
let currentFilter = "all";

// Kör efter original updateCalendar — fyller cellerna med slot-knappar
function renderSlots() {
    const rows = document.querySelectorAll(".calendar tbody tr");
    const dateSpans = [
        document.getElementById("d0"),
        document.getElementById("d1"),
        document.getElementById("d2"),
        document.getElementById("d3"),
        document.getElementById("d4"),
    ];

    // Bygg weekDates från de datum som visas i headern
    const weekDates = dateSpans.map(span => {
        const parts = span.textContent.split("/");
        const d = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;
        const y = currentDate.getFullYear();
        return new Date(y, m, d);
    });

    HOURS.forEach((hour, rowIndex) => {
        const row = rows[rowIndex];
        if (!row) return;
        const cells = row.querySelectorAll("td:not(.time)");
        cells.forEach((td, col) => {
            td.innerHTML = "";
            const date = weekDates[col];
            const key = slotKey(date, hour);
            const isBooked = !!bookings[key];

            const btn = document.createElement("button");
            btn.className = "slot " + (isBooked ? "booked" : "free");
            btn.dataset.key = key;

            if (isBooked) {
                btn.innerHTML = `<span>✓ Bokad</span><span class="slot-label">${bookings[key].name}</span>`;
                btn.onclick = () => openCancelModal(key, date, hour);
            } else {
                btn.innerHTML = `<span>Ledig</span>`;
                btn.onclick = () => openBookModal(key, date, hour);
            }

            applyFilter(btn, isBooked);
            td.appendChild(btn);
        });
    });
}

function slotKey(date, hour) {
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,"0");
    const d = String(date.getDate()).padStart(2,"0");
    return `${y}-${m}-${d}_${hour}`;
}

// ── FILTER ──
function setFilter(f) {
    currentFilter = f;
    document.getElementById("filterAll").className    = "filter-btn" + (f==="all"    ? " active" : "");
    document.getElementById("filterFree").className   = "filter-btn" + (f==="free"   ? " free-active" : "");
    document.getElementById("filterBooked").className = "filter-btn" + (f==="booked" ? " booked-active" : "");
    document.querySelectorAll(".slot").forEach(btn => {
        applyFilter(btn, btn.classList.contains("booked"));
    });
}

function applyFilter(btn, isBooked) {
    btn.classList.remove("hidden");
    if (currentFilter === "free"   &&  isBooked) btn.classList.add("hidden");
    if (currentFilter === "booked" && !isBooked) btn.classList.add("hidden");
}

// ── BOKA ──
function openBookModal(key, date, hour) {
    const dayStr = date.toLocaleDateString("sv-SE", {weekday:"long", day:"numeric", month:"long"});
    document.getElementById("modalTitle").textContent = "Boka tid";
    document.getElementById("modalMeta").textContent  = dayStr + " · " + hour;
    document.getElementById("modalBody").innerHTML = `
        <label for="bookName">Ditt namn</label>
        <input id="bookName" type="text" placeholder="ex. Anna Svensson" autofocus>
        <label for="bookNote">Notering (valfri)</label>
        <input id="bookNote" type="text" placeholder="ex. Handledning">
    `;
    const actions = document.getElementById("modalActions");
    actions.innerHTML = "";

    const ok = document.createElement("button");
    ok.className = "btn btn-primary";
    ok.textContent = "Bekräfta bokning";
    ok.onclick = () => {
        const name = document.getElementById("bookName").value.trim();
        if (!name) return;
        bookings[key] = { name, note: document.getElementById("bookNote").value.trim() };
        closeModal();
        showToast("✓ Tid bokad för " + name);
        updateCalendar();
        renderSlots();
        setFilter(currentFilter);
    };

    const cancel = document.createElement("button");
    cancel.className = "btn btn-cancel";
    cancel.textContent = "Avbryt";
    cancel.onclick = closeModal;

    actions.appendChild(ok);
    actions.appendChild(cancel);
    openModal();
}

// ── AVBOKA ──
function openCancelModal(key, date, hour) {
    const b = bookings[key];
    const dayStr = date.toLocaleDateString("sv-SE", {weekday:"long", day:"numeric", month:"long"});
    document.getElementById("modalTitle").textContent = "Avboka tid";
    document.getElementById("modalMeta").textContent  = dayStr + " · " + hour;
    document.getElementById("modalBody").innerHTML = `
        <label>Bokad av</label>
        <input type="text" value="${b.name}" readonly style="background:#f5f4f0;">
        ${b.note ? `<label>Notering</label><input type="text" value="${b.note}" readonly style="background:#f5f4f0;">` : ""}
    `;
    const actions = document.getElementById("modalActions");
    actions.innerHTML = "";

    const del = document.createElement("button");
    del.className = "btn btn-danger";
    del.textContent = "Avboka";
    del.onclick = () => {
        const name = bookings[key].name;
        delete bookings[key];
        closeModal();
        showToast("✗ Bokning avbokad för " + name);
        updateCalendar();
        renderSlots();
        setFilter(currentFilter);
    };

    const cancel = document.createElement("button");
    cancel.className = "btn btn-cancel";
    cancel.textContent = "Stäng";
    cancel.onclick = closeModal;

    actions.appendChild(del);
    actions.appendChild(cancel);
    openModal();
}

// ── MODAL HELPERS ──
function openModal()  { document.getElementById("modalOverlay").classList.add("open"); }
function closeModal() { document.getElementById("modalOverlay").classList.remove("open"); }
document.getElementById("modalOverlay").addEventListener("click", e => {
    if (e.target === e.currentTarget) closeModal();
});

// ── TOAST ──
let toastTimer;
function showToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

// Kör renderSlots efter att originalet kört updateCalendar
const _origUpdate = updateCalendar;
updateCalendar = function() {
    _origUpdate();
    renderSlots();
};
updateCalendar();
