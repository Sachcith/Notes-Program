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
                selectPage(div, d);
                openEntityPage();
            };

            div.innerHTML = `
                <b>${d.name || "New Entry"}</b><br>
                Old Balance: ${parseFloat(d.balance.toFixed(3) || 0)}<br>
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
            <input id="balance" type="number" value="${d.opening_balance.toFixed(3)}">
            
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

let dashboardMode = "transactions";

function openEntityPage() {

    const grid = document.getElementById("grid");

    const client = selectedPage.d;

    grid.innerHTML = `

    <div class="dashboard-page">

        <!-- HERO -->
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

                <button class="hero-btn" onclick="clearBalance()">
                    Nil Balance
                </button>

                <button class="hero-btn cancel-btn" onclick="deleteEntity()">
                    Delete Client
                </button>

            </div>

        </div>

        <!-- STATS -->
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

        <!-- MODE SWITCH -->
        <div class="dashboard-modes">

            <button
                id="transactionsModeBtn"
                class="dashboard-mode-btn active"
                onclick="switchDashboardMode('transactions')"
            >
                Transactions
            </button>

            <button
                id="itemsModeBtn"
                class="dashboard-mode-btn"
                onclick="switchDashboardMode('items')"
            >
                Items
            </button>

        </div>

        <!-- CONTENT -->
        <div id="dashboardContent"></div>

    </div>
    `;

    renderDashboardContent();
}

function switchDashboardMode(mode){

    dashboardMode = mode;

    document
        .getElementById("transactionsModeBtn")
        .classList.remove("active");

    document
        .getElementById("itemsModeBtn")
        .classList.remove("active");

    if(mode === "transactions"){
        document
            .getElementById("transactionsModeBtn")
            .classList.add("active");
    }
    else{
        document
            .getElementById("itemsModeBtn")
            .classList.add("active");
    }

    renderDashboardContent();
}

function renderDashboardContent(){

    const container =
        document.getElementById("dashboardContent");

    /* =====================================
    TRANSACTIONS MODE
    ====================================== */

    if(dashboardMode === "transactions"){

        container.innerHTML = `

            <div class="dashboard-section">

                <div class="section-top">

                    <h2>
                        Transactions
                    </h2>

                    <button
                        class="add-item-btn"
                        onclick="addTransaction()"
                    >
                        + Add Transaction
                    </button>

                </div>

                <!-- =================================
                PHOTO SENT
                ================================== -->

                <div class="transaction-group">

                    <div class="transaction-group-top">

                        <h3>
                            Photo Sent
                        </h3>

                    </div>

                    <!-- HEADER -->
                    <div class="transaction-header-row">

                        <div>Date</div>
                        <div>Item Name</div>
                        <div>Touch</div>
                        <div>Base Weight</div>
                        <div>Stone Less</div>
                        <div>Wastage</div>
                        <div>Final Pure</div>

                    </div>

                    <!-- ROWS -->
                    <div id="sentTransactionsContainer"></div>

                </div>

                <!-- =================================
                PHOTO NOT SENT
                ================================== -->

                <div class="transaction-group">

                    <div class="transaction-group-top">

                        <h3>
                            Pending Photo
                        </h3>

                        <button
                            class="hero-btn"
                            onclick="capturePendingTransactions()"
                        >
                            Capture & Send
                        </button>

                    </div>

                    <!-- HEADER -->
                    <div class="transaction-header-row">

                        <div>Date</div>
                        <div>Item Name</div>
                        <div>Touch</div>
                        <div>Base Weight</div>
                        <div>Stone Less</div>
                        <div>Wastage</div>
                        <div>Final Pure</div>

                    </div>

                    <!-- ROWS -->
                    <div id="pendingTransactionsContainer"></div>

                </div>

            </div>

        `;
        loadTransactions();
    }

    /* =====================================
    ITEMS MODE
    ====================================== */

    else{

        container.innerHTML = `

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

                <div class="dashboard-header-row">

                    <div>Item Name</div>

                    <div>Touch</div>

                    <div>Default Profit %</div>

                    <div>Default Wastage %</div>

                    <div>Actions</div>

                </div>

                <div id="itemsContainer"></div>

            </div>

        `;

        socket.emit("addItemsForEntitiesSequence",{
            token: localStorage.getItem("token"),
            entity_id: selectedPage.d.id,
        });
    }
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

        if(editBtn.innerText == "Save"){
            confirm("Save Rule To Delete Item");
            editBtn.focus();
            return;
        }

        const ok =
            confirm("Delete this Item?");

        if (!ok) return;

        row.remove();

        socket.emit("deleteRule",{
            token: localStorage.getItem("token"),
            itemName: inputs[0].value,
            touch: parseFloat(inputs[1].value),
            entity_id: selectedPage.d.id,
        });
    });

    return row;
}

socket.on("deleteRuleOk",(e)=>{
    console.log("Rule Deleted Successfully!!");
});

/* =========================================
FORMAT DATE
YYYY-MM-DD -> DD/MM/YYYY
========================================= */

function formatDate(dateString){

    if(!dateString) return "";

    const parts = dateString.split("-");

    if(parts.length !== 3){
        return dateString;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/* =========================================
ADD TRANSACTION ROW
========================================= */

function addTransactionRow(
    transaction,
    containerId,
    showDate = true
){

    const container =
        document.getElementById(containerId);

    if(!container) return;

    const row =
        document.createElement("div");

    row.className =
        "transaction-row";

    row.dataset.id =
        transaction.transaction_item_id || "";

    row.innerHTML = `

        <!-- DATE -->
        <div class="transaction-date">
            ${showDate
                ? formatDate(transaction.date)
                : ""}
        </div>

        <!-- ITEM -->
        <div class="transaction-item-name">
            ${transaction.item_name || "-"}
        </div>

        <!-- TOUCH -->
        <div>
            ${transaction.touch ?? "-"}
        </div>

        <!-- BASE WEIGHT -->
        <div>
            ${
                transaction.base_weight != null
                ? Number(transaction.base_weight).toFixed(3)
                : "-"
            }
        </div>

        <!-- STONE LESS -->
        <div>
            ${
                transaction.stone_less != null
                ? Number(transaction.stone_less).toFixed(3)
                : "-"
            }
        </div>

        <!-- WASTAGE -->
        <div>
            ${
                transaction.wastage != null
                ? Number(transaction.wastage).toFixed(2)
                : "-"
            }
        </div>

        <!-- FINAL PURE -->
        <div>
            ${
                transaction.final_pure != null
                ? (
                    transaction.type === "PURCHASE"
                        ? -Number(transaction.final_pure)
                        : Number(transaction.final_pure)
                ).toFixed(3)
                : "-"
            }
        </div>

    `;

    container.appendChild(row);
}

/* =========================================
SOCKET RECEIVE
========================================= */

socket.on("entityTransactions",(data)=>{

    if(!data || !data.transactions){
        return;
    }

    renderTransactions(
        data.transactions
    );
});

/* =========================================
RENDER TRANSACTIONS
========================================= */

function renderTransactions(data){

    let runningBalance =
    Number(
        selectedPage.d.opening_balance || 0
    );

    const pendingContainer =
        document.getElementById(
            "pendingTransactionsContainer"
        );

    const sentContainer =
        document.getElementById(
            "sentTransactionsContainer"
        );

    if(pendingContainer){
        pendingContainer.innerHTML = "";
    }

    if(sentContainer){
        sentContainer.innerHTML = "";
    }

    /* =====================================
    SORT BY DATE DESCENDING
    ====================================== */

    // data.sort((a,b)=>{

    //     return new Date(b.date)
    //         - new Date(a.date);
    // });

    let lastPendingDate = "";
    let lastSentDate = "";

    data.forEach((transaction,index) => {

        /* =================================
        PENDING PHOTO
        ================================= */
        const delta =
            transaction.type === "PURCHASE"
            ? -Number(
                transaction.final_pure || 0
            )
            : Number(
                transaction.final_pure || 0
            );

        runningBalance += delta;

        if(
            transaction.photo_sent === "NOT_SENT"
        ){

            const showDate =
                lastPendingDate !==
                transaction.date;

            addTransactionRow(
                transaction,
                "pendingTransactionsContainer",
                showDate
            );

            lastPendingDate =
                transaction.date;
        }

        /* =================================
        PHOTO SENT
        ================================= */

        else{

            const showDate =
                lastSentDate !==
                transaction.date;

            addTransactionRow(
                transaction,
                "sentTransactionsContainer",
                showDate
            );

            lastSentDate =
                transaction.date;
        }
        
        const nextTransaction =
            data[index + 1];

        const isLastTransactionOfDay =
            !nextTransaction ||
            nextTransaction.date !==
            transaction.date;

        if(isLastTransactionOfDay){

            addClosingBalanceRow(
                transaction.photo_sent ===
                "NOT_SENT"
                    ? "pendingTransactionsContainer"
                    : "sentTransactionsContainer",

                runningBalance
            );
        }
    });
}

function addClosingBalanceRow(
    containerId,
    balance
){

    const container =
        document.getElementById(
            containerId
        );

    const row =
        document.createElement("div");

    row.className =
        "closing-balance-row";

    row.innerHTML = `

        <div>
            Closing Balance
        </div>

        <div>
            ${balance.toFixed(3)} g
        </div>

    `;

    container.appendChild(row);
}

function loadTransactions(){

    socket.emit("getTransactionsForEntity",{
        token: localStorage.getItem("token"),
        entity_id: selectedPage.d.id,
    });
}

function clearBalance(){
    if (!selectedPage || !selectedPage.el) {
        console.error("selectedPage not set");
        return;
    }

    const ok = confirm("Are you sure you want to clear balance for "+selectedPage.d.name);

    if (!ok) return;
    socket.emit("clearBalance",{
        token: localStorage.getItem("token"),
        id:selectedPage.d.id,
    });


}

socket.on("clearBalanceOk",(e)=>{
    console.log("Cleared Balance Successfully!!");
    openEntityPage();
});