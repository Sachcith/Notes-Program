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
                openEntityPage();
            };

            div.innerHTML = `
                <b>${d.name || "New Entry"}</b><br>
                Old Balance: ${d.balance.toFixed(3) || 0}<br>
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
}

function updateHighlight(items, index){
    items.forEach(el => el.classList.remove("active"));

    if (index >= 0) {
        items[index].classList.add("active");
    }
}

function cancelEntity(){
    unlock = true;
    openEntityPage();
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
            <input id="balance" type="number" value="${d.balance.toFixed(3)}">
            
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
    openEntityPage();
});

function deleteEntity(){
    if (!selectedPage || !selectedPage.el) {
        console.error("selectedPage not set");
        return;
    }

    const ok = confirm("Are you sure you want to delete "+selectedPage.d.name);

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
                    ${client.location || "Client Location"}
                </div>

            </div>

            <div class="hero-right">

                <button class="hero-btn" onclick="editEntity()">
                    Edit Client
                </button>

                <button class="hero-btn cancel-btn" onclick="deleteEntity()">
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
                    ${client.balance.toFixed(3) || 0} g
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

                <div>Touch</div>

                <div>Default Profit %</div>

                <div>Default Wastage %</div>

                <div>Actions</div>

            </div>

            <!-- =================================
            ITEMS
            ================================== -->

            <div id="itemsContainer"></div>

        </div>

    </div>
    `;

    socket.emit("addItemsForEntitiesSequence",{
        token: localStorage.getItem("token"),
        entity_id: client.id,
    });

    // if (client.items) {

    //     client.items.forEach(item => {
    //         addDashboardItemRow(item);
    //     });
    // }
}

socket.on("addItemsForEntities",(data)=>{
    if(data.items){
        data.items.forEach(item=>{
            addDashboardItemRow(item);
        });
    }
});

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

        <!-- TOUCH -->
        <input
            type="number"
            placeholder="Touch"
            value="${item.touch || 92}"
            disabled
        >

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

            const data = {
                token: localStorage.getItem("token"),
                item_name: inputs[0].value,
                entity_id: selectedPage.d.id,
                touch: parseFloat(inputs[1].value || 0),
                profit: parseFloat(inputs[2].value || 0),
                wastage: parseFloat(inputs[3].value || 0),
            }
            socket.emit("saveItemRule",data);
            

        } else {

            inputs.forEach(input => {
                input.disabled = false;
            });
            inputs[1].disabled = true;

            editBtn.innerText = "Save";

            editBtn.classList.add("save-mode");

            inputs[0].focus();
        }
    });

    const profit = inputs[2];
    const wastage = inputs[3];
    
    profit.addEventListener("input",()=>{
        wastage.value = "";
    });

    wastage.addEventListener("input",()=>{
        profit.value = "";
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