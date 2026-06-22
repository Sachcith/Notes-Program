function getTransaction(){
    set_current_mode();
    selectedPage = null;
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    setupAutocomplete("newSearchElement","transactionEntityName",(input,item,type)=>{
        input.value = item[type];
        current_mode = item["type"];
        set_current_mode();
        searchbar();
    });
    // socket.emit("getTransaction",{token: localStorage.getItem("token")});
    searchbar();
}



/* SOCKET FOR RENDERING TRANSACTION */
socket.on("transactionData",(e)=>{
    const grid = document.getElementById("grid");
    grid.innerHTML = "";

    e.forEach(d => {
        if(d.type==current_mode.toUpperCase()){
            const div = document.createElement("div");
            div.className = "page";
            div.onclick = () => selectPage(div, d);

            div.innerHTML = `
                <b>${d.name}</b><br>
                Old Balance: ${parseFloat(d.old_balance.toFixed(3))}<br>
                Final Weight: ${parseFloat(d.final_weight.toFixed(3))}<br>
                New Balance: ${parseFloat(d.new_balance.toFixed(3))}<br>
                <small>${d.created_at}</small>
            `;

            grid.appendChild(div);
        }
    });
});

/* ADD ENTRY */
function addTransaction() {
    const grid = document.getElementById("grid");
    grid.innerHTML = `
        <div class="transaction-form">

            <h2>Add Transaction</h2>


            <label>Name</label>
            <div class="input-wrapper">
                <input id="name" placeholder="Enter name" autocomplete="off" value="${current_name}">
                <div id="nameDropdown" class="dropdown"></div>
            </div>

            <h3> Old Balance: <b id="old_balance"> 0 </b> </h3>

            <div class="header-row">
                <div>Item</div>
                <div>Weight</div>
                <div>Touch</div>
                <div>Seal</div>
                <div>Profit %</div>
                <div>Wastage %</div>
                <div>Stone Less</div>
                <div>Qty</div>
                <div>Final Weight</div>
            </div>

            <div id="itemsContainer"></div>

            <button class="add-item-btn" onclick="addItemRow()">
                + Add Item
            </button>

            <div class="bottom-panel">

                <!-- ===================================
                    SUMMARY ROW
                ==================================== -->
                <div class="bottom-summary-row">

                    <div></div>

                    <input disabled id="bottomBaseWeight" type="number">

                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>

                    <div></div>

                    <input disabled id="bottomQty" type="number">

                    <input disabled id="bottomFinalWeight" type="number">

                    <div></div>
                    <div></div>
                    <div></div>

                </div>

                <!-- ===================================
                    ACTION ROW
                ==================================== -->
                <div class="bottom-action-row">

                    <input id="goldRate"
                        type="number"
                        placeholder="Gold Rate">

                    <input id="cash"
                        type="number"
                        placeholder="Cash Adjustment">

                    <button id="changeCash" onclick="changeCashMode()">
                        Hand Cash
                    </button>

                    <button onclick="saveTransaction()">
                        Save
                    </button>

                    <button class="cancel-btn"
                            onclick="cancelTransaction()">
                        Cancel
                    </button>

                    <!-- RIGHT SIDE -->
                    <div class="balance-group">

                        <h3>New Balance:</h3>

                        <h3>
                            <b id="new_balance">-</b>
                        </h3>

                    </div>

                </div>

            </div>
        </div>
    `;
    addItemRow();

    setupAutocomplete("name","transactionEntityName",(input,item,type)=>{
        input.value = item[type];
        const old_balance = parseFloat(item["old_balance"] || 0);
        document.getElementById("old_balance").innerHTML = parseFloat(old_balance.toFixed(3) || 0);
        document.getElementById("old_balance").dataset.realValue = old_balance;
    });

    document.getElementById("name").focus();

    // setupAutocomplete("name","transactionEntityName",(input,item,type)=>{
    //     input.value = item[type];
    // });

    const goldRate = document.getElementById("goldRate");
    const cash = document.getElementById("cash");
    const changeCashModeBtn = document.getElementById("changeCash");

    let currentDiv = null;

    goldRate.addEventListener("input",()=>{
        currentDiv = goldRateCash(goldRate,cash,currentDiv);
    });

    cash.addEventListener("input",()=>{
        currentDiv = goldRateCash(goldRate,cash,currentDiv);
    });

    changeCashModeBtn.addEventListener("click",()=>{
        if(cashMode == "cash"){
            cashMode = "rtgs";
            changeCashModeBtn.innerHTML = "Rtgs Cash";
        }
        else{
            cashMode = "cash";
            changeCashModeBtn.innerHTML = "Hand Cash";
        }
        currentDiv = goldRateCash(goldRate,cash,currentDiv);
    });
}

socket.on("errorTransaction",(data)=>{
    if(data.type=="name"){
        const ok = confirm("Name is incorrect");
        document.getElementById("name").focus();
    }
    if(data.type=="item"){
        const ok = confirm("Item Name is incorrect");
        const rows = document.querySelectorAll(".item-row");
        for(const row of rows){
            const inputs = row.querySelectorAll("input");
            if(inputs[0].value==data.value){
                inputs[0].focus();
                break;
            }
        }
    }
    if(data.type=="nill"){
        const ok = confirm("Cannot Edit Nill Correction, Only Deleting is possible");
    }
});

let cashMode = "cash";

function goldRateCash(goldRate,cash,currentDiv){
    if (!currentDiv || !document.body.contains(currentDiv)) {
        currentDiv = addItemRow();
    }
    let inputs = currentDiv.querySelectorAll("input");
    let btn = document.getElementById("changeCash");
    if(cashMode=="cash"){
        inputs[0].value = "Cash Gold";
    }
    else{
        inputs[0].value = "Rtgs Gold";
    }
    const weight = parseFloat(cash.value/goldRate.value);
    inputs[1].value = weight.toFixed(3); 
    inputs[1].dataset.realValue = weight;
    inputs[2].value = 100;
    inputs[9].value = cash.value;

    inputs.forEach(input=>{
        input.disabled = true;
    });

    recalculate();    
    
    return currentDiv;
}

function recalculate(){
    const rows = document.querySelectorAll(".item-row");
    calculate_global_final_values(rows);
}

/* SAVE */
function saveTransaction() {
    recalculate();
    const name = document.getElementById("name").value;
    const old_balance = parseFloat(document.getElementById("old_balance").dataset.realValue || 0);

    const rows = document.querySelectorAll(".item-row");

    let totalQty = 0;
    let totalWeight = 0;
    let totalBase = 0;
    let items = [];

    rows.forEach(r => {
        const inputs = r.querySelectorAll("input");
        if(inputs[0].value=="") return;
        const buttons = r.querySelectorAll("button");

        const item = {
            itemname: inputs[0].value,
            baseweight: parseFloat(inputs[1].value || 0),
            touch: parseFloat(inputs[2].value || 0),
            seal: inputs[3].value,
            profit: parseFloat(inputs[4].value || 0),
            wastage: parseFloat(inputs[5].value || 0),
            stone: parseFloat(inputs[6].value || 0),
            qty: inputs[7].value || 0,
            finalweight: parseFloat(inputs[8].dataset.realValue || 0),
            type: buttons[0].innerText,
            cash: parseFloat(inputs[9].value || 0),
        };

        // totalQty += item.qty;
        // totalWeight += parseFloat(inputs[8].value || 0);
        // totalBase += parseFloat(inputs[1].value || 0);
        items.push(item);
    });
    totalBase = parseFloat(document.getElementById("bottomBaseWeight").dataset.realValue || 0);
    totalQty = parseFloat(document.getElementById("bottomQty").dataset.realValue || 0);
    totalWeight = parseFloat(document.getElementById("bottomFinalWeight").dataset.realValue || 0);
    const cash = parseFloat(document.getElementById("cash").value || 0);
    const goldRate = parseFloat(document.getElementById("goldRate").value || 0);

    const data = {
        token: localStorage.getItem("token"),
        name: name,
        old_balance: old_balance,
        new_balance: old_balance + totalWeight,
        base_weight: totalBase,
        final_weight: totalWeight,
        items: items,
        cash: cash,
        gold_rate: goldRate,
    }
    socket.emit("saveTransaction",data);
}

socket.on("saveTransactionOk",(e)=>{
    console.log("New Transaction Saved Successfully");
    unlock = true;
    itemRowCounter = 0;
    if(e.name!="Cash Helper") getTransaction();
    else showCash();
});

let itemRowCounter = 0;
/* ADD ITEM ROW */
function addItemRow(item = {}) {
    const container = document.getElementById("itemsContainer");

    const div = document.createElement("div");
    div.className = "item-row";

    itemRowCounter++;
    const itemId = "item-"+itemRowCounter;

    div.innerHTML = `

        <div class="input-wrapper">
            <input id="${itemId}" placeholder="Item" value="${item.item_name || ""}" data-id="${item.id}" autocomplete="off">
            <div id="${itemId}Dropdown" class="dropdown"></div>
        </div>

        <input type="number" placeholder="Base Wt" value="${item.base_weight || ""}">

        <input id="${itemId}Touch" type="number" placeholder="Touch" value="${item.touch || 92}">

        <!-- <input placeholder="Seal" value="${item.seal || ""}"> -->

        <div class="input-wrapper">
            <input id="${itemId}Seal" placeholder="Seal" autocomplete="off" value="${item.seal || ""}">
            <div id="${itemId}SealDropdown" class="dropdown"></div>
        </div>

        <input id="${itemId}Profit" type="number" placeholder="Profit %" value="${item.profit_percent || ""}">
        <input id="${itemId}Wastage" type="number" placeholder="Wastage %" value="${item.wastage_percent || ""}">
        <input type="number" placeholder="Stone Less" value="${item.stone_less || ""}">

        <input type="number" placeholder="Qty" value="${item.quantity || ""}">

        <input type="number" placeholder="Final Wt" disabled value="${""}">

        <button class="type-btn ${item.type === "SALE" ? "SALE" : "BUY"}">
            ${item.type === "SALE" ? "SALE" : "BUY"}
        </button>

        <input type="number" placeholder="Cash" value="${item.cash || ""}">

        <button class="delete-button"> Delete </button>
    `;

    // 🔥 Toggle logic
    const btn = div.querySelector(".type-btn");

    btn.addEventListener("click", () => {
        if (btn.innerText === "BUY") {
            btn.innerText = "SALE";
            btn.classList.remove("BUY");
            btn.classList.add("SALE");
        } else {
            btn.innerText = "BUY";
            btn.classList.remove("SALE");
            btn.classList.add("BUY");
        }

        const row = document.activeElement.closest(".item-row");
        const inputs = row.querySelectorAll("input");

        calculate_final_value(inputs);

        const rows = document.querySelectorAll(".item-row");
        calculate_global_final_values(rows);
    });

    // Either Profit or Wastage Logic
    const profitInput = div.querySelectorAll("input")[4];
    const wastageInput = div.querySelectorAll("input")[5];

    profitInput.addEventListener("input", () => {

        if (profitInput.value.trim() !== "") {
            wastageInput.value = "";
        }
    });

    wastageInput.addEventListener("input", () => {

        if (wastageInput.value.trim() !== "") {
            profitInput.value = "";
        }
    });
    // End of Logic for Either Profit or Wastage
    
    container.appendChild(div);

    const delete_button = div.querySelector(".delete-button");

    delete_button.addEventListener("click",()=>{
        div.remove();

        const rows = document.querySelectorAll(".item-row");
        calculate_global_final_values(rows);
    });

    setupAutocomplete(itemId,"itemName",(input,item,type)=>{
        input.value = item[type];
        const inputId = input.id;
        let touch = document.getElementById(inputId+"Touch");
        touch.value = item["itemTouch"];
        let profit = document.getElementById(inputId+"Profit");
        profit.value = item["itemProfit"];
        let wastage = document.getElementById(inputId+"Wastage");
        wastage.value = item["itemWastage"];
    },() => {return document.getElementById("name").value || ""}
    );

    setupAutocomplete(itemId+"Seal","entityName",(input,item,type)=>{
        input.value = item[type];
    });

    return div;
}

document.addEventListener("input", (e)=>{

    const active = document.activeElement;

    // ONLY INSIDE ITEM ROW
    if (
        !active ||
        !active.closest(".item-row")
    ) {
        return;
    }

    // ONLY INPUTS
    if (active.tagName !== "INPUT") {
        return;
    }

    // const row = active.closest(".item-row");

    // const inputs = row.querySelectorAll("input");

    // calculate_final_value(inputs);

    const rows = document.querySelectorAll(".item-row");
    calculate_global_final_values(rows);
    
});

/* =========================================
EXCEL STYLE NAVIGATION
========================================= */

document.addEventListener("keydown", (e) => {
    const active = document.activeElement;

    const currentDropdown =
        document.getElementById(
            active.id + "Dropdown"
        );

    if (
        currentDropdown &&
        currentDropdown.children.length > 0
    ) {
        return;
    }

    // ONLY INSIDE ITEM ROW
    if (
        !active ||
        !active.closest(".item-row")
    ) {
        return;
    }

    // ONLY INPUTS
    if (active.tagName !== "INPUT") {
        return;
    }

    const row = active.closest(".item-row");

    const rows = [
        ...document.querySelectorAll(".item-row")
    ];

    const rowIndex = rows.indexOf(row);

    // ONLY ENABLED INPUTS
    const cols = [
        ...row.querySelectorAll(
            'input:not([disabled])'
        )
    ];

    const colIndex = cols.indexOf(active);

    let target = null;

    /* =========================================
    RIGHT
    ========================================= */

    if (e.key === "ArrowRight") {

        e.preventDefault();

        target = cols[colIndex + 1];
    }

    /* =========================================
    LEFT
    ========================================= */

    if (e.key === "ArrowLeft") {

        e.preventDefault();

        target = cols[colIndex - 1];
    }

    /* =========================================
    DOWN
    ========================================= */

    if (e.key === "ArrowDown") {

        e.preventDefault();

        const nextRow = rows[rowIndex + 1];

        if (nextRow) {

            const nextCols = [
                ...nextRow.querySelectorAll(
                    'input:not([disabled])'
                )
            ];

            target = nextCols[colIndex];
        }
    }

    /* =========================================
    UP
    ========================================= */

    if (e.key === "ArrowUp") {

        e.preventDefault();

        const prevRow = rows[rowIndex - 1];

        if (prevRow) {

            const prevCols = [
                ...prevRow.querySelectorAll(
                    'input:not([disabled])'
                )
            ];

            target = prevCols[colIndex];
        }
    }

    /* =========================================
    ENTER
    ========================================= */

    if (e.key === "Enter") {

        e.preventDefault();

        target = cols[colIndex + 1];

        // CREATE NEW ROW
        if (!target) {

            const newRow = addItemRow();

            target = newRow.querySelector(
                'input:not([disabled])'
            );
        }
    }

    /* =========================================
    FINAL FOCUS
    ========================================= */

    if (target) {

        target.focus();

        // AUTO SELECT TEXT
        target.select();
    }
});

/* CANCEL */
function cancelTransaction() {
    current_name = "";
    getTransaction();
}

// itemname: inputs[0].value,
//             baseweight: parseFloat(inputs[1].value || 0),
//             touch: parseFloat(inputs[2].value || 0),
//             seal: inputs[3].value,
//             profit: parseFloat(inputs[4].value || 0),
//             wastage: parseFloat(inputs[5].value || 0),
//             stone: parseFloat(inputs[6].value || 0),
//             qty: inputs[7].value || 0,
//             finalweight: parseFloat(inputs[8].value || 0),
//             type: buttons[0].innerText,

function calculate_final_value(inputs){
    const itemname = inputs[0].value;
    if(itemname == ""){
        inputs[8].dataset.realValue = "";
        inputs[8].value = "";
        return;
    }
    let baseweight_temp = 0;
    if(inputs[1].dataset.realValue) baseweight_temp = parseFloat(inputs[1].dataset.realValue);
    else baseweight_temp = parseFloat(inputs[1].value || 0);
    const baseweight = baseweight_temp;
    const touch = parseFloat(inputs[2].value || 0);
    const profit = parseFloat(inputs[4].value || 0);
    const wastage = parseFloat(inputs[5].value || 0);
    const stone = parseFloat(inputs[6].value || 0);
    const finalweight = parseFloat(inputs[8].dataset.realValue || 0);
    let final = 0;
    if(Math.abs(wastage) > 0.0001){
        const stoneless = baseweight - stone;
        final = stoneless*((100+wastage)/100);
        if(touch==92){
            final = final*91.7/100;
        }
        else{
            final = final*touch/100;
        }
    }
    else{
        const stoneless = baseweight - stone;
        const total_touch = (touch+profit)/100;
        final = stoneless*total_touch;
    }
    inputs[8].dataset.realValue = final;
    inputs[8].value = parseFloat(final.toFixed(3));
}

function calculate_global_final_values(rows){
    let total_base = parseFloat(0);
    let total_qty = parseFloat(0);
    let total_final = parseFloat(0);
    rows.forEach(row => {
        const inputs = row.querySelectorAll("input");
        calculate_final_value(inputs);
        const buttons = row.querySelectorAll("button");
        if(inputs[8].value!=""){
            const baseweight = parseFloat(inputs[1].value || 0);
            if(buttons[0].innerText=="BUY") total_base += -1*baseweight;
            else total_base += baseweight;
            const qty = parseFloat(inputs[7].value || 0);
            total_qty += qty;
            const finalweight = parseFloat(inputs[8].dataset.realValue || 0);
            if(buttons[0].innerText=="BUY") total_final += -1*finalweight;
            else total_final += finalweight;
        }
    });
    let bottomBase = document.getElementById("bottomBaseWeight");
    bottomBase.dataset.realValue = total_base;
    bottomBase.value = parseFloat(total_base.toFixed(3));

    let bottomQuantity = document.getElementById("bottomQty");
    bottomQuantity.dataset.realValue = total_qty;
    bottomQuantity.value = parseFloat(total_qty.toFixed(0));

    let bottomFinal = document.getElementById("bottomFinalWeight");
    bottomFinal.dataset.realValue = total_final;
    bottomFinal.value = parseFloat(total_final.toFixed(3));

    let bottomNewBalance = document.getElementById("new_balance");
    let old_balance = parseFloat(document.getElementById("old_balance").dataset.realValue || 0);
    let new_balance = old_balance + total_final;
    bottomNewBalance.innerHTML = parseFloat(new_balance.toFixed(3));
}


function editTransaction(){
    socket.emit("triggerEditTransactionSequence",{token: localStorage.getItem("token"), id: selectedPage.d.id});
}

socket.on("triggerEditTransactionSequenceFromServer",(data)=>{
    const grid = document.getElementById("grid");
    grid.innerHTML = `
        <div class="transaction-form">

            <h2>Edit Transaction</h2>


            <label>Name</label>
            <div class="input-wrapper">
                <input id="name" placeholder="Enter name" autocomplete="off">
                <div id="nameDropdown" class="dropdown"></div>
            </div>

            <h3> Old Balance: <b id="old_balance"> 0 </b> </h3>

            <div class="header-row">
                <div>Item</div>
                <div>Weight</div>
                <div>Touch</div>
                <div>Seal</div>
                <div>Profit %</div>
                <div>Wastage %</div>
                <div>Stone Less</div>
                <div>Qty</div>
            </div>

            <div id="itemsContainer"></div>

            <button class="add-item-btn" onclick="addItemRow()">
                + Add Item
            </button>

            <div class="bottom-panel">

                <!-- ===================================
                    SUMMARY ROW
                ==================================== -->
                <div class="bottom-summary-row">

                    <div></div>

                    <input disabled id="bottomBaseWeight" type="number">

                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>

                    <div></div>

                    <input disabled id="bottomQty" type="number">

                    <input disabled id="bottomFinalWeight" type="number">

                    <div></div>
                    <div></div>
                    <div></div>

                </div>

                <!-- ===================================
                    ACTION ROW
                ==================================== -->
                <div class="bottom-action-row">

                    <input id="goldRate"
                        type="number"
                        placeholder="Gold Rate">

                    <input id="cash"
                        type="number"
                        placeholder="Cash Adjustment">

                    <button id="changeCash" onclick="changeCashMode()">
                        Hand Cash
                    </button>

                    <button onclick="saveEditTransaction()">
                        Save
                    </button>

                    <button class="cancel-btn"
                            onclick="cancelTransaction()">
                        Cancel
                    </button>

                    <!-- RIGHT SIDE -->
                    <div class="balance-group">

                        <h3>New Balance:</h3>

                        <h3>
                            <b id="new_balance">-</b>
                        </h3>

                    </div>

                </div>

            </div>
        </div>
    `;
    // addItemRow();
    document.getElementById("name").value = data.name;
    document.getElementById("name").dataset.id = data.id;
    document.getElementById("name").dataset.created_at = data.created_at;
    document.getElementById("name").dataset.name_backup = data.name;
    document.getElementById("old_balance").innerHTML = parseFloat(data.old_balance.toFixed(3) || 0);
    document.getElementById("old_balance").dataset.realValue = data.old_balance;
    document.getElementById("old_balance").dataset.backup = data.old_balance;
    document.getElementById("new_balance").innerHTML = data.new_balance;
    document.getElementById("goldRate").value = data.goldRate;
    document.getElementById("cash").value = data.cash;
    // document.getElementById("bottomBaseWeight").value = parseFloat(data.base_weight.toFixed(3));
    // document.getElementById("bottomBaseWeight").dataset.realValue = dataset.base_weight;
    // document.getElementById("bottomFinalWeight").value = parseFloat(data.final_weight.toFixed(3));
    // document.getElementById("bottomFinalWeight").dataset.realValue = data.final_weight;
    const item_data = data.items;

    item_data.forEach(item=>{
        addItemRow(item);
    });
    const rows = document.querySelectorAll(".item-row");
    calculate_global_final_values(rows);

    setupAutocomplete("name","transactionEntityName",(input,item,type)=>{
        input.value = item[type];
        const old_balance = parseFloat(item["old_balance"] || 0);
        document.getElementById("old_balance").innerHTML = parseFloat(old_balance.toFixed(3) || 0);
        document.getElementById("old_balance").dataset.realValue = old_balance;
    });


    const goldRate = document.getElementById("goldRate");
    const cash = document.getElementById("cash");
    const changeCashModeBtn = document.getElementById("changeCash");

    let currentDiv = findCashGoldRow();
        
    // goldRateCash(goldRate,cash,currentDiv);

    goldRate.addEventListener("input",()=>{
        currentDiv = goldRateCash(goldRate,cash,currentDiv);
    });

    cash.addEventListener("input",()=>{
        currentDiv = goldRateCash(goldRate,cash,currentDiv);
    });

    changeCashModeBtn.addEventListener("click",()=>{
        if(cashMode == "cash"){
            cashMode = "rtgs";
            changeCashModeBtn.innerHTML = "Rtgs Cash";
        }
        else{
            cashMode = "cash";
            changeCashModeBtn.innerHTML = "Hand Cash";
        }
        currentDiv = goldRateCash(goldRate,cash,currentDiv);
    });
});

function findCashGoldRow() {
    const rows = document.querySelectorAll(".item-row");

    for(const row of rows){
        const inputs = row.querySelectorAll("input");

        if(inputs[0].value == "Cash Gold"){
            inputs.forEach(input=>{
                input.disabled=true;
            });
            document.getElementById("changeCash").innerHTML = "Cash Gold";
            cashMode = "cash";
            return row;
        }

        if(inputs[0].value == "Rtgs Gold"){
            inputs.forEach(input=>{
                input.disabled=true;
            });
            document.getElementById("changeCash").innerHTML = "Rtgs Gold";
            cashMode = "rtgs";
            return row;
        }
    }

    return null;
}

function saveEditTransaction(){
    const name = document.getElementById("name").value;
    const old_balance = parseFloat(document.getElementById("old_balance").dataset.realValue || 0);

    const rows = document.querySelectorAll(".item-row");

    let totalQty = 0;
    let totalWeight = 0;
    let totalBase = 0;
    let items = [];

    rows.forEach(r => {
        const inputs = r.querySelectorAll("input");
        if(inputs[0].value=="") return;
        const buttons = r.querySelectorAll("button");

        const item = {
            id: inputs[0].dataset.id,
            itemname: inputs[0].value,
            baseweight: parseFloat(inputs[1].value || 0),
            touch: parseFloat(inputs[2].value || 0),
            seal: inputs[3].value,
            profit: parseFloat(inputs[4].value || 0),
            wastage: parseFloat(inputs[5].value || 0),
            stone: parseFloat(inputs[6].value || 0),
            qty: parseFloat(inputs[7].value || 0),
            finalweight: parseFloat(inputs[8].dataset.realValue || 0),
            type: buttons[0].innerText,
            cash: parseFloat(inputs[9].value || 0),
        };

        // totalQty += item.qty;
        // totalWeight += parseFloat(inputs[8].value || 0);
        // totalBase += parseFloat(inputs[1].value || 0);
        items.push(item);
    });
    totalBase = parseFloat(document.getElementById("bottomBaseWeight").dataset.realValue || 0);
    totalQty = parseFloat(document.getElementById("bottomQty").dataset.realValue || 0);
    totalWeight = parseFloat(document.getElementById("bottomFinalWeight").dataset.realValue || 0);
    const cash = parseFloat(document.getElementById("cash").value || 0);
    const goldRate = parseFloat(document.getElementById("goldRate").value || 0);

    const data = {
        token: localStorage.getItem("token"),
        id: document.getElementById("name").dataset.id,
        name: name,
        old_balance: old_balance,
        old_balance_backup: document.getElementById("old_balance").dataset.backup,
        backup_name: document.getElementById("name").dataset.name_backup,
        new_balance: old_balance + totalWeight,
        base_weight: totalBase,
        final_weight: totalWeight,
        items: items,
        cash: cash,
        gold_rate: goldRate,
    }
    socket.emit("saveEditTransaction",data);
}

socket.on("saveEditTransactionOk",(e)=>{
    console.log("Saved Changes Successfully!!");
    if(e.name!="Cash Helper") getTransaction();
    else showCash();
});

function deleteTransaction(){
    if (selectedPage == null || !selectedPage || !selectedPage.el) {
        console.error("selectedPage not set");
        confirm("Please select a page for Deleting");
        return;
    }

    const ok = confirm("Are you sure you want to delete this transaction?");

    if (!ok) return;
    socket.emit("deleteTransaction",{
        token: localStorage.getItem("token"),
        id:selectedPage.d.id,
        old_balance:selectedPage.d.old_balance,
    });
}

socket.on("deleteTransactionOk",(e)=>{
    console.log("Transaction Deleted Successfully");
    if(e.name!="Cash Helper") getTransaction();
    else showCash();
});