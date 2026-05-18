/* GET ENTITY */
function getEntity(){
    set_current_mode();
    selectedPage = null;
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    // socket.emit("getEntity",{token: localStorage.getItem("token")});
    searchbar();
}

/* SOCKET FOR RENDERING ENTITY */
socket.on("entityData",(e)=>{
    const grid = document.getElementById("grid");
    grid.innerHTML = "";

    e.forEach(d => {
        if(d.type==current_mode.toUpperCase()){
            const div = document.createElement("div");
            div.className = "page";
            div.onclick = () => {
                selectPage(div, d)

            };

            div.innerHTML = `
                <b>${d.name || "New Entry"}</b><br>
                Old Balance: ${d.balance || 0}<br>
                <small>${d.location || ""}</small>
            `;

            grid.appendChild(div);
        }
    });
});

/* ADD ENTITY */
function addEntity(){
    const grid = document.getElementById("grid");
    grid.innerHTML = `
        <div class="form-container">

            <h2>Add Entity</h2>

            <label>Name</label>
            <div class="input-wrapper">
                <input id="name" placeholder="Enter name" value="${current_name}" autocomplete="off">
                <div id="nameDropdown" class="dropdown"></div>
            </div>

            <label>Type</label>
            <br>
            <button class="customerbutton" onclick=selectButton(event)>Customer</button>
            <button class="manufacturerbutton" onclick=selectButton(event)>Manufacturer</button>
            <button class="wholesalerbutton" onclick=selectButton(event)>Wholesaler</button>
            <br><br>

            <label>Balance</label>
            <input id="balance" type="number" value="0">
            
            <label>Phone</label>
            <input id="phone" placeholder="Enter phone">

            <label>Location</label>
            <div class="input-wrapper">
                <input id="location" placeholder="Enter location" autocomplete="off">
                <div id="locationDropdown" class="dropdown"></div>
            </div>

            <div class="actions">
                <button onclick="saveEntity()">Save</button>
                <button onclick="cancelEntity()">Cancel</button>
            </div>
        </div>
    `;
    set_current_mode();
    unlock = false;
    setupAutocomplete("name","entityName",(input,item,type)=>{
        input.value = item[type];
    });
    setupAutocomplete("location","entityLocation",(input,item,type)=>{
        input.value = item[type];
    });
    // const nameInput = document.getElementById("name");
    // const nameDropdown = document.getElementById("nameDropdown");

    // nameInput.addEventListener("input", () => {
    //     const value = nameInput.value;

    //     socket.emit("searchEntityName", {
    //         token: localStorage.getItem("token"),
    //         value: value
    //     });
    // });

    // const locationInput = document.getElementById("location");
    // const locationDropdown = document.getElementById("locationDropdown");

    // locationInput.addEventListener("input", () => {
    //     const value = locationInput.value;

    //     socket.emit("searchEntityLocation", {
    //         token: localStorage.getItem("token"),
    //         value: value
    //     });
    // });

    // let activeIndex = -1;
    // let currentList = [];

    // socket.on("entityNameResults", (list) => {
    //     currentList = list;
    //     activeIndex = -1;
    //     nameDropdown.innerHTML = "";

    //     list.forEach((item, index) => {
    //         const div = document.createElement("div");
    //         div.innerText = item;

    //         div.onclick = () => {
    //             nameInput.value = item;
    //             nameDropdown.innerHTML = "";
    //         };

    //         nameDropdown.appendChild(div);
    //     });
    // });

    // nameInput.addEventListener("keydown", (e) => {
    //     const items = nameDropdown.querySelectorAll("div");

    //     if (!items.length) return;

    //     if (e.key === "ArrowDown") {
    //         e.preventDefault();
    //         activeIndex = (activeIndex + 1) % items.length;
    //         updateHighlight(items, activeIndex); // ✅ FIX
    //     }

    //     if (e.key === "ArrowUp") {
    //         e.preventDefault();
    //         activeIndex = (activeIndex - 1 + items.length) % items.length;
    //         updateHighlight(items, activeIndex); // ✅ FIX
    //     }

    //     if (e.key === "Enter") {
    //         e.preventDefault();
    //         if (activeIndex >= 0) {
    //             nameInput.value = items[activeIndex].innerText;
    //             nameDropdown.innerHTML = "";
    //         }
    //     }
    // });

    // let locationActiveIndex = -1;

    // socket.on("entityLocationResults", (list) => {
    //     locationActiveIndex = -1;
    //     locationDropdown.innerHTML = "";

    //     list.forEach((item, index) => {
    //         const div = document.createElement("div");
    //         div.innerText = item;

    //         div.onclick = () => {
    //             locationInput.value = item;
    //             locationDropdown.innerHTML = "";
    //         };

    //         locationDropdown.appendChild(div);
    //     });
    // });

    // locationInput.addEventListener("keydown", (e) => {
    //     const items = locationDropdown.querySelectorAll("div");

    //     if (!items.length) return;

    //     if (e.key === "ArrowDown") {
    //         e.preventDefault();
    //         locationActiveIndex = (locationActiveIndex + 1) % items.length;
    //         updateHighlight(items, locationActiveIndex);
    //     }

    //     if (e.key === "ArrowUp") {
    //         e.preventDefault();
    //         locationActiveIndex = (locationActiveIndex - 1 + items.length) % items.length;
    //         updateHighlight(items, locationActiveIndex);
    //     }

    //     if (e.key === "Enter") {
    //         e.preventDefault();
    //         if (locationActiveIndex >= 0) {
    //             locationInput.value = items[locationActiveIndex].innerText;
    //             locationDropdown.innerHTML = "";
    //         }
    //     }
    // });

    // locationDropdown.addEventListener("mousedown", (e) => {
    //     e.preventDefault();
    // });
    
    // document.getElementById("name").focus();
}

function updateHighlight(items, index){
    items.forEach(el => el.classList.remove("active"));

    if (index >= 0) {
        items[index].classList.add("active");
    }
}

function cancelEntity(){
    unlock = true;
    selectedPage = null;
    getEntity();
}

function editEntity() {
    if (!selectedPage || !selectedPage.el) {
        console.error("selectedPage not set");
        return;
    }

    let d = selectedPage.d;
    const grid = document.getElementById("grid");

    grid.innerHTML = `
        <div class="form-container">

            <h2>Edit Entity</h2>

            <label>Name</label>
            <div class="input-wrapper">
                <input id="name" placeholder="Enter name" value="${d.name}" autocomplete="off">
                <div id="nameDropdown" class="dropdown"></div>
            </div>

            <label>Type</label>
            <br>
            <button class="customerbutton" onclick=selectButton(event)>Customer</button>
            <button class="manufacturerbutton" onclick=selectButton(event)>Manufacturer</button>
            <button class="wholesalerbutton" onclick=selectButton(event)>Wholesaler</button>
            <br><br>

            <label>Balance</label>
            <input id="balance" type="number" value="${d.balance}">
            
            <label>Phone</label>
            <input id="phone" placeholder="Enter phone" value="${d.phone}">

            <label>Location</label>
            <div class="input-wrapper">
                <input id="location" placeholder="Enter location" value="${d.location}" autocomplete="off">
                <div id="locationDropdown" class="dropdown"></div>
            </div>

            <div class="actions">
                <button onclick="saveEntityEdit()">Save Changes</button>
                <button onclick="cancelEntity()">Cancel</button>
            </div>
        </div>
    `;

    set_current_mode();
    unlock = false;
    setupAutocomplete("name","entityName",(input,item,type)=>{
        input.value = item[type];
    });
    setupAutocomplete("location","entityLocation",(input,item,type)=>{
        input.value = item[type];
    });

    // const nameInput = document.getElementById("name");
    // const nameDropdown = document.getElementById("nameDropdown");

    // const locationInput = document.getElementById("location");
    // const locationDropdown = document.getElementById("locationDropdown");

    // let activeIndex = -1;
    // let locationActiveIndex = -1;

    // // 🔥 NAME SEARCH
    // nameInput.addEventListener("input", () => {
    //     socket.emit("searchEntityName", {
    //         token: localStorage.getItem("token"),
    //         value: nameInput.value
    //     });
    // });

    // socket.off("entityNameResults");
    // socket.on("entityNameResults", (list) => {
    //     activeIndex = -1;
    //     nameDropdown.innerHTML = "";

    //     list.forEach((item) => {
    //         const div = document.createElement("div");
    //         div.innerText = item;

    //         div.onclick = () => {
    //             nameInput.value = item;
    //             nameDropdown.innerHTML = "";
    //         };

    //         nameDropdown.appendChild(div);
    //     });
    // });

    // nameInput.addEventListener("keydown", (e) => {
    //     const items = nameDropdown.querySelectorAll("div");
    //     if (!items.length) return;

    //     if (e.key === "ArrowDown") {
    //         e.preventDefault();
    //         activeIndex = (activeIndex + 1) % items.length;
    //         updateHighlight(items, activeIndex);
    //     }

    //     if (e.key === "ArrowUp") {
    //         e.preventDefault();
    //         activeIndex = (activeIndex - 1 + items.length) % items.length;
    //         updateHighlight(items, activeIndex);
    //     }

    //     if (e.key === "Enter") {
    //         e.preventDefault();
    //         if (activeIndex >= 0) {
    //             nameInput.value = items[activeIndex].innerText;
    //             nameDropdown.innerHTML = "";
    //         }
    //     }
    // });

    // nameDropdown.addEventListener("mousedown", (e) => {
    //     e.preventDefault();
    // });

    // // 🔥 LOCATION SEARCH
    // locationInput.addEventListener("input", () => {
    //     socket.emit("searchEntityLocation", {
    //         token: localStorage.getItem("token"),
    //         value: locationInput.value
    //     });
    // });

    // socket.off("entityLocationResults");
    // socket.on("entityLocationResults", (list) => {
    //     locationActiveIndex = -1;
    //     locationDropdown.innerHTML = "";

    //     list.forEach((item) => {
    //         const div = document.createElement("div");
    //         div.innerText = item;

    //         div.onclick = () => {
    //             locationInput.value = item;
    //             locationDropdown.innerHTML = "";
    //         };

    //         locationDropdown.appendChild(div);
    //     });
    // });

    // locationInput.addEventListener("keydown", (e) => {
    //     const items = locationDropdown.querySelectorAll("div");
    //     if (!items.length) return;

    //     if (e.key === "ArrowDown") {
    //         e.preventDefault();
    //         locationActiveIndex = (locationActiveIndex + 1) % items.length;
    //         updateHighlight(items, locationActiveIndex);
    //     }

    //     if (e.key === "ArrowUp") {
    //         e.preventDefault();
    //         locationActiveIndex = (locationActiveIndex - 1 + items.length) % items.length;
    //         updateHighlight(items, locationActiveIndex);
    //     }

    //     if (e.key === "Enter") {
    //         e.preventDefault();
    //         if (locationActiveIndex >= 0) {
    //             locationInput.value = items[locationActiveIndex].innerText;
    //             locationDropdown.innerHTML = "";
    //         }
    //     }
    // });

    // locationDropdown.addEventListener("mousedown", (e) => {
    //     e.preventDefault();
    // });

    // nameInput.focus();
}

function saveEntity(){
    let data = {
        token: localStorage.getItem("token"),
        name: document.getElementById("name").value,
        type: current_mode,
        phone: document.getElementById("phone").value,
        location: document.getElementById("location").value,
        balance: document.getElementById("balance").value,
    }
    socket.emit("saveEntity",data);
}

function saveEntityEdit(){
    let data = {
        token: localStorage.getItem("token"),
        name: document.getElementById("name").value,
        type: current_mode,
        phone: document.getElementById("phone").value,
        location: document.getElementById("location").value,
        balance: document.getElementById("balance").value,
        id: selectedPage.d.id,
    }
    socket.emit("saveEntityEdit",data);
}

socket.on("saveEntityOk",(e)=>{
    console.log("New Entity Saved Successfully");
    unlock = true;
    getEntity();
});

socket.on("editEntityOk",(e)=>{
    console.log("Entity Edited and Saved Successfully");
    unlock = true;
    getEntity();
});

function deleteEntity(){
    if (!selectedPage || !selectedPage.el) {
        console.error("selectedPage not set");
        return;
    }

    const ok = confirm("Are you sure you want to delete this entity?");

    if (!ok) return;
    socket.emit("deleteEntity",{
        token: localStorage.getItem("token"),
        id:selectedPage.d.id,
    });
}

socket.on("deleteEntityOk",(e)=>{
    console.log("Entity Deleted Successfully");
    unlock = true;
    getEntity();
});


/* =========================================
CLIENT DASHBOARD PAGE
ERP STYLE
========================================= */

function openEntityPage() {

    const grid = document.getElementById("grid");

    const client = selectedPage.d;

    grid.innerHTML = `

    <div class="dashboard-page">

        <!-- =====================================
        HERO SECTION
        ====================================== -->

        <div class="dashboard-hero">

            <div class="hero-left">

                <h1>
                    ${client.name || "Client Name"}
                </h1>

                <div class="hero-subtitle">
                    ERP Client Dashboard
                </div>

            </div>

            <div class="hero-right">

                <button class="hero-btn">
                    Edit Client
                </button>

                <button class="hero-btn cancel-btn">
                    Delete Client
                </button>

            </div>

        </div>

        <!-- =====================================
        STATS CARDS
        ====================================== -->

        <div class="stats-grid">

            <div class="stat-card">
                <div class="stat-title">
                    Gold Balance
                </div>

                <div class="stat-value">
                    ${client.old_balance || 0} g
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-title">
                    Average Transactions Per Month
                </div>

                <div class="stat-value">
                    ${client.total_average_transactions || 0}
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-title">
                    Average Weight Per Transaction
                </div>

                <div class="stat-value">
                    ${client.total_average_transactions || 0}
                </div>
            </div>

        </div>

        <!-- =====================================
        ITEMS SECTION
        ====================================== -->

        <div class="dashboard-section">

            <div class="section-top">

                <h2>
                    Item Configuration
                </h2>

                <button
                    class="add-item-btn"
                    onclick="addDashboardItemRow()"
                >
                    + Add Item
                </button>

            </div>

            <!-- =================================
            HEADER
            ================================== -->

            <div class="dashboard-header-row">

                <div>Item Name</div>

                <div>Default Profit %</div>

                <div>Default Wastage %</div>

                <div>Touch</div>

                <div>Actions</div>

            </div>

            <!-- =================================
            ITEMS
            ================================== -->

            <div id="itemsContainer"></div>

        </div>

    </div>
    `;

    if (client.items) {

        client.items.forEach(item => {
            addDashboardItemRow(item);
        });
    }
}

/* =========================================
ADD ITEM ROW
========================================= */

let dashboardItemCounter = 0;

function addDashboardItemRow(item = {}) {

    const container =
        document.getElementById("itemsContainer");

    const row = document.createElement("div");

    row.className = "dashboard-item-row";

    dashboardItemCounter++;

    const itemId =
        "dashboard-item-" + dashboardItemCounter;

    row.innerHTML = `

        <!-- ITEM -->
        <div class="input-wrapper">

            <input
                id="${itemId}"
                placeholder="Item Name"
                value="${item.item_name || ""}"
                autocomplete="off"
                disabled
            >

            <div
                id="${itemId}Dropdown"
                class="dropdown"
            ></div>

        </div>

        <!-- PROFIT -->
        <input
            type="number"
            placeholder="Profit %"
            value="${item.profit_percent || ""}"
            disabled
        >

        <!-- WASTAGE -->
        <input
            type="number"
            placeholder="Wastage %"
            value="${item.wastage_percent || ""}"
            disabled
        >

        <!-- TOUCH -->
        <input
            type="number"
            placeholder="Touch"
            value="${item.touch || 92}"
            disabled
        >

        <!-- ACTIONS -->
        <div class="row-actions">

            <button class="edit-btn">
                Edit
            </button>

            <button class="delete-btn">
                Delete
            </button>

        </div>
    `;

    container.appendChild(row);

    /* =====================================
    AUTOCOMPLETE
    ====================================== */

    setupAutocomplete(
        itemId,
        "itemName",
        (input, itemData, type) => {

            input.value = itemData[type];
        }
    );

    const editBtn =
        row.querySelector(".edit-btn");

    const deleteBtn =
        row.querySelector(".delete-btn");

    const inputs =
        row.querySelectorAll("input");

    /* =====================================
    EDIT
    ====================================== */

    editBtn.addEventListener("click", () => {

        const isSave =
            editBtn.innerText === "Save";

        if (isSave) {

            inputs.forEach(input => {
                input.disabled = true;
            });

            editBtn.innerText = "Edit";

            editBtn.classList.remove("save-mode");

            console.log("SAVE ITEM");

        } else {

            inputs.forEach(input => {
                input.disabled = false;
            });

            editBtn.innerText = "Save";

            editBtn.classList.add("save-mode");

            inputs[0].focus();
        }
    });

    /* =====================================
    DELETE
    ====================================== */

    deleteBtn.addEventListener("click", () => {

        const ok =
            confirm("Delete this item?");

        if (!ok) return;

        row.remove();
    });

    return row;
}