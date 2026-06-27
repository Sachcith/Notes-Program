window.onload = function () {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "/login";
    }
};


let current_name = "";
let current_mode = "customer";
let currentModule = null;
const socket = io();

socket.on("error",(e)=>{
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    grid.innerHTML = "<h2>"+e.message+"</h2>"
});

const modules = {

    entry: {
        top: [
            { id: "btnTN", label: "Tamil Nadu", action: "setLocation('TN')" },
            { id: "btnKA", label: "Karnataka", action: "setLocation('KA')" },
            { id: "btnAP", label: "Andhra", action: "setLocation('AP')" }
        ],
        left: [
            { id: "addBtn", label: "+ Add Entry", action: "addTransaction()" },
            { id: "editBtn", label: "Edit", action: "editTransaction()" },
            { id: "deleteBtn", label: "Delete", action: "deleteTransaction()" },
            { id: "customer", label: "Customer", action: "selectButton(event)" , class: "customerbutton"},
            { id: "manufacturer", label: "Manufacturer", action: "selectButton(event)" , class: "manufacturerbutton"},
            { id: "wholesaler", label: "Wholesaler", action: "selectButton(event)" , class: "wholesalerbutton"},
        ]
    },

    item: {
        top: [
            { id: "allItemsBtn", label: "All Items", action: "" }
        ],
        left: [
            { id: "addBtn", label: "+ Add Item", action: "addItem()" },
            { id: "editItemBtn", label: "Edit Item", action: "editItem()" },
            { id: "deleteItemBtn", label: "Delete Item", action: "deleteItem()" }
        ]
    },

    entity: {
        top: [
            { id: "customersBtn", label: "Customers", action: "" },
            { id: "manufacturersBtn", label: "Manufacturers", action: "" }
        ],
        left: [
            { id: "addBtn", label: "+ Add Entity", action: "addEntity()" },
            { id: "customer", label: "Customer", action: "selectButton(event)" , class: "customerbutton"},
            { id: "manufacturer", label: "Manufacturer", action: "selectButton(event)" , class: "manufacturerbutton"},
            { id: "wholesaler", label: "Wholesaler", action: "selectButton(event)" , class: "wholesalerbutton"},
        ]
    },

    stock: {
        top: [
            { id: "allItemsBtn", label: "All Items", action: "" }
        ],
        left: [
            { id: "addBtn", label: "+ Add Stock", action: "addStock()" },
            { id: "editStockBtn", label: "Edit Stock", action: "editStock()" },
            { id: "deleteStockBtn", label: "Delete Stock", action: "deleteStock()" }
        ]
    },

    cash: {
        top: [
            { id: "addCashBtn", label: "All Cash", action: "" }
        ],
        left: [
            { id: "addBtn", label: "+ Add Cash", action: "addCash()" },
            { id: "getCashBtn", label: "Report", action: "getCash()" },
            { id: "showCashBtn", label: "Show Cash", action: "showCash()" },
            { id: "editCashBtn", label: "Edit Cash", action: "editCash()" },
            { id: "deleteCashBtn", label: "Delete Cash", action: "deleteTransaction()" }
        ]
    },

    report: {
        top: [],
        left: []
    }

};

function openModule(type) {
    currentModule = type;

    document.getElementById("homePage").classList.add("hidden");
    document.getElementById("appPage").classList.remove("hidden");

    selectedPage = null;

    // 🔥 dynamically change UI
    renderTop(type);
    renderLeft(type);

    if (type === "entry") {
        const searchElement = document.getElementById("searchInput");
        searchElement.id = "newSearchElement";
        getTransaction();
    }

    if (type === "item") {
        getItem();
    }

    if (type === "entity") {
        getEntity();
    }

    if (type === "stock") {
        getStock();
    }

    if (type === "cash") {
        getCash();
    }

    if (type === "report") {
        getReport();
    }
}

function home() {
    document.getElementById("homePage").classList.remove("hidden");
    document.getElementById("appPage").classList.add("hidden");
    current_name = "";
}

function renderTop(module) {
    const top = document.querySelector(".top");

    top.innerHTML = "";

    modules[module].top.forEach(btn => {
        const b = document.createElement("button");
        b.className = "location-btn";
        b.innerText = btn.label;

        if (btn.action) {
            b.setAttribute("onclick", btn.action);
        }

        if (btn.id) {
            b.id = btn.id;
        }

        top.appendChild(b);
    });

    // search always present
    const div = document.createElement("div");
    div.className = "input-wrapper";
    const search = document.createElement("input");
    search.id = "searchInput";
    search.placeholder = "Search...";
    search.value;
    search.setAttribute("autocomplete", "off");

    if(currentModule!="entry"){
        search.addEventListener("input", function(){
            searchbar();
        });

        // ✅ attach event HERE (correct place)
        search.addEventListener("keyup", function(e){
            if (e.key == "Enter") {
                current_name = search.value;

                const addBtn = document.getElementById("addBtn");
                if (addBtn) addBtn.focus();
            }
        });
    }
    div.appendChild(search);
    if(currentModule==="entry"){
        const dropdown = document.createElement("div");
        dropdown.id = "newSearchElementDropdown";
        dropdown.className = "dropdown";
        div.appendChild(dropdown);
    }
    top.appendChild(div);
}

let searchTimeout;
function searchbar(){
    clearTimeout(searchTimeout);
    let search = document.getElementById("searchInput");
    if(currentModule==="entry"){
        search = document.getElementById("newSearchElement");
    }

    searchTimeout = setTimeout(() => {
        current_name = search.value;

        if (currentModule === "item") {
            socket.emit("searchItem", {
                token: localStorage.getItem("token"),
                value: current_name
            });
        }

        if (currentModule === "entity") {
            socket.emit("searchEntity", {
                token: localStorage.getItem("token"),
                value: current_name,
                type: current_mode
            });
        }

        if (currentModule === "entry") {
            socket.emit("searchEntry", {
                token: localStorage.getItem("token"),
                value: current_name,
            });
        }

    }, 200);
}

function renderLeft(module) {
    const left = document.querySelector(".left");

    left.innerHTML = "";

    // Home button always present
    const homeBtn = document.createElement("button");
    homeBtn.innerText = "Home";
    homeBtn.onclick = home;
    left.appendChild(homeBtn);

    const heading = document.createElement("h3");
    heading.innerText = "Options";
    left.appendChild(heading);

    modules[module].left.forEach(btn => {
        const b = document.createElement("button");
        b.innerText = btn.label;

        if (btn.action) {
            b.setAttribute("onclick", btn.action);
        }

        if (btn.id) {
            b.id = btn.id;
        }

        if (btn.class) {
            b.classList.add(btn.class);
        }

        left.appendChild(b);

        // const tempbr = document.createElement("br");
        // left.appendChild(tempbr);
    });
}

let data = [];
let selectedPage = null;

/* RENDER ENTRY */
function renderEntry() {
    const grid = document.getElementById("grid");
    grid.innerHTML = "";

    data.forEach(d => {
        const div = document.createElement("div");
        div.className = "page";
        div.onclick = () => selectPage(div, d);

        div.innerHTML = `
            <b>${d.name || "New Entry"}</b><br>
            Old: ₹${d.oldBalance || 0}<br>
            Items: ${d.items ? d.items.length : 0}<br>
            Qty: ${d.totalQty || 0}<br>
            Final: ₹${d.finalBalance || 0}<br>
            <small>${d.date || ""}</small>
        `;

        grid.appendChild(div);
    });
}

/* OPEN PAGE (FULL SCREEN EDIT) */
function renderEntryEditView(d) {
    
    if (!selectedPage || !selectedPage.el) {
        console.error("selectedPage not set");
        return;
    }

    selectedPage.el.innerHTML = `
        <h2>Edit Entry</h2>

        <!-- ENTITY -->
        <input id="entity" placeholder="Entity Name" value="${d.name || current_name}">

        <!-- ITEMS HEADER -->
        <div class="header-row">
            <div>Item</div>
            <div>Type</div>
            <div>Seal</div>
            <div>Profit %</div>
            <div>Wastage %</div>
            <div>Stone</div>
            <div>Qty</div>
        </div>

        <!-- ITEMS -->
        <div id="itemsContainer"></div>

        <button onclick="addItemRow()">+ Add Item</button>

        <!-- BOTTOM PANEL -->
        <div class="bottom-panel">

            <!-- LEFT SIDE -->
            <div class="bottom-left">
                <input id="goldRate" type="number" placeholder="Gold Rate">
                <input id="cash" type="number" placeholder="Cash Adjustment">
            </div>

            <!-- RIGHT SIDE -->
            <div class="bottom-right">
                <div>Total Qty: <span id="totalQty">0</span></div>
                <div>Base Weight: <span id="totalBase">0</span></div>
                <div>Final Weight: <span id="totalFinal">0</span></div>
                <div>Balance: ₹<span id="finalBalance">0</span></div>
            </div>

        </div>

        <button onclick="saveEntry()">Save</button>
        <button onclick="cancelEntry()">Cancel</button>
    `;

    setTimeout(() => {
        if (!d.items || d.items.length === 0) {
            addItemRow();
        } else {
            d.items.forEach(item => addItemRow(item));
        }
        document.getElementById("itemsContainer").querySelector('input').focus();
        calculate();
    }, 0);

}

/* RESET */
function resetEntryView() {
    selectedPage = null;

    document.querySelectorAll(".page").forEach(p => {
        p.style.display = "block";
        p.classList.remove("full");
    });

    renderEntry();
}

/* LOCATION THEME */
function setLocation(loc) {
    const colors = {
        TN:"#e74c3c",
        KA:"#27ae60",
        AP:"#2980b9"
    };
    document.documentElement.style.setProperty('--accent', colors[loc]);
}

function editSelected() {
    if (!selectedPage) {
        alert("Select a page first");
        return;
    }

    openPage(selectedPage.el, selectedPage.d);
}

function deleteSelected() {
    if (!selectedPage) {
        alert("Select a page first");
        return;
    }

    data = data.filter(d => d !== selectedPage.d);
    selectedPage = null;
    renderEntry();
}

function selectPage(el, d) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("selected"));

    el.classList.add("selected");

    selectedPage = { el, d };
}

let unlock = true;
function selectButton(e){
    if(e.target.classList[0]=="customerbutton"){
        document.querySelectorAll(".customerbutton").forEach(el => {
            el.classList.add("location-btn");
        });
        document.querySelectorAll(".manufacturerbutton").forEach(el => {
            el.classList.remove("location-btn");
        });
        document.querySelectorAll(".wholesalerbutton").forEach(el => {
            el.classList.remove("location-btn");
        });
        current_mode = "customer";
    }
    else if(e.target.classList[0]=="manufacturerbutton"){
        document.querySelectorAll(".customerbutton").forEach(el => {
            el.classList.remove("location-btn");
        });
        document.querySelectorAll(".manufacturerbutton").forEach(el => {
            el.classList.add("location-btn");
        });
        document.querySelectorAll(".wholesalerbutton").forEach(el => {
            el.classList.remove("location-btn");
        });
        current_mode = "manufacturer";
    }
    else{
        document.querySelectorAll(".customerbutton").forEach(el => {
            el.classList.remove("location-btn");
        });
        document.querySelectorAll(".manufacturerbutton").forEach(el => {
            el.classList.remove("location-btn");
        });
        document.querySelectorAll(".wholesalerbutton").forEach(el => {
            el.classList.add("location-btn");
        });
        current_mode = "wholesaler";
    }
    if(unlock){

        if (currentModule === "entry") {
            getTransaction();
        }

        if (currentModule === "entity") {
            getEntity();
        }
    }
}

function set_current_mode(){
    if(current_mode=="customer"){
        document.querySelectorAll(".customerbutton").forEach(el => {
            el.classList.add("location-btn");
        });
        document.querySelectorAll(".manufacturerbutton").forEach(el => {
            el.classList.remove("location-btn");
        });
        document.querySelectorAll(".wholesalerbutton").forEach(el => {
            el.classList.remove("location-btn");
        });
    }
    else if(current_mode=="manufacturer"){
        document.querySelectorAll(".customerbutton").forEach(el => {
            el.classList.remove("location-btn");
        });
        document.querySelectorAll(".manufacturerbutton").forEach(el => {
            el.classList.add("location-btn");
        });
        document.querySelectorAll(".wholesalerbutton").forEach(el => {
            el.classList.remove("location-btn");
        });
    }
    else{
        document.querySelectorAll(".customerbutton").forEach(el => {
            el.classList.remove("location-btn");
        });
        document.querySelectorAll(".manufacturerbutton").forEach(el => {
            el.classList.remove("location-btn");
        });
        document.querySelectorAll(".wholesalerbutton").forEach(el => {
            el.classList.add("location-btn");
        });
    }
}

function logout() {
    // remove token
    localStorage.removeItem("token");
    // disconnect socket
    socket.disconnect();
    // go to login page
    window.location.href = "/login";
}

/* AUTO COMPLETE THINGY START */
const autocompleteRegistry = {};
let selectedItem = null;

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function setupAutocomplete(inputId, type, callback = null,entity_name = null) {

    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(`${inputId}Dropdown`);

    if (!input || !dropdown) return;

    const typeName = capitalize(type);

    const searchEvent = `search${typeName}`;
    const resultsEvent = `${typeName}Results`;
    // console.log(searchEvent);
    // console.log(resultsEvent);

    let activeIndex = -1;
    let currentList = [];

    function clearDropdown() {
        dropdown.innerHTML = "";
        activeIndex = -1;
    }

    function selectItem(item) {

        selectedItem = item;

        // 🔥 what appears in input box
        // input.value = item.name || item.location || item.value || "";

        clearDropdown();

        // 🔥 trigger custom callback
        if (callback && typeof callback === "function") {
            callback(input,item,type);
        }
    }

    function tryAutoSelect() {

        const value = input.value.trim().toLowerCase();

        if (!value) {
            selectedItem = null;
            input.classList.remove("autocomplete-error");
            return;
        }

        if (
            selectedItem &&
            (selectedItem[type] || "").trim().toLowerCase() === value
        ) {
            input.classList.remove("autocomplete-error");
            return;
        }

        const matchedItem = currentList.find((item) => {

            const temp = (item[type] || "").trim().toLowerCase();

            return temp === value;
        });

        // ✅ Exact match found
        if (matchedItem) {

            input.classList.remove("autocomplete-error");

            selectItem(matchedItem);

            return;
        }

        // ✅ If only one result exists → auto select
        if (currentList.length === 1) {

            input.classList.remove("autocomplete-error");

            selectItem(currentList[0]);

            return;
        }

        // ❌ No valid match
        input.classList.add("autocomplete-error");
    }

    input.addEventListener("keydown", onKeyDown);

    input.addEventListener("blur", () => {

        setTimeout(() => {

            tryAutoSelect();

            clearDropdown();

        }, 150);
    });

    function renderList(list = []) {

        currentList = list;

        clearDropdown();

        const rect = input.getBoundingClientRect();

        dropdown.style.position = "fixed";

        dropdown.style.top = `${rect.bottom + 2}px`;

        dropdown.style.left = `${rect.left}px`;

        dropdown.style.width = `${rect.width}px`;

        dropdown.style.zIndex = "999999";

        list.forEach((item, index) => {

            const div = document.createElement("div");

            let temp = "";
            if(item["itemTouch"]) temp = " "+item["itemTouch"];

            div.innerText = item[type]+temp;

            div.onclick = () => {
                selectItem(item);
            };

            div.addEventListener("mousedown", (e) => {
                e.preventDefault();
            });

            dropdown.appendChild(div);
        });
    }

    function onInput() {

        selectedItem = null;
        
        input.classList.remove("autocomplete-error");

        const entityName =
        typeof entity_name === "function" ? entity_name() : entity_name;
        // console.log(entityName);

        socket.emit(searchEvent, {
            token: localStorage.getItem("token"),
            value: input.value,
            created_at: input.dataset.created_at,
            entity_name: entityName,
        });
    }

    function onKeyDown(e) {

        const items = dropdown.querySelectorAll("div");

        if (!items.length) {

            if (e.key === "Enter") {
                return;
            }

            return;
        }

        // 🔥 stop global excel navigation
        e.stopPropagation();

        if (e.key === "ArrowDown") {

            e.preventDefault();

            activeIndex = (activeIndex + 1) % items.length;

            updateHighlight(items, activeIndex);
        }

        if (e.key === "ArrowUp") {

            e.preventDefault();

            activeIndex =
                (activeIndex - 1 + items.length) % items.length;

            updateHighlight(items, activeIndex);
        }

        if (e.key === "Enter") {

            e.preventDefault();

            if (activeIndex >= 0) {

                selectItem(currentList[activeIndex]);
            }
        }
    }

    function isDropdownOpen() {
        return dropdown.children.length > 0;
    }

    input.addEventListener("input", onInput);

    dropdown.addEventListener("mousedown", (e) => {
        e.preventDefault();
    });

    // // 🔥 remove old listener
    // if (autocompleteRegistry[resultsEvent]) {

    //     socket.off(
    //         resultsEvent,
    //         autocompleteRegistry[resultsEvent]
    //     );
    // }

    // autocompleteRegistry[resultsEvent] = renderList;

    // socket.on(resultsEvent, renderList);
    socket.on(resultsEvent, (list) => {

        // only render for THIS input
        if (document.activeElement === input) {
            renderList(list);
        }
    });
}


/* AUTO COMPLETE THINGY END */

/* INIT */
// renderEntry();

