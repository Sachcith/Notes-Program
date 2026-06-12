let cashReportMode = "cash";

function getCash(){

    const grid =
        document.getElementById("grid");

    grid.innerHTML = `

    <div class="dashboard-page">

        <div class="dashboard-hero">

            <div class="hero-left">

                <h1>
                    Cash Report
                </h1>

                <div class="hero-subtitle">
                    Cash & RTGS Ledger
                </div>

            </div>

        </div>

        <div class="stats-grid">

            <div class="stat-card">

                <div class="stat-title">
                    Cash Balance
                </div>

                <div
                    id="cashBalance"
                    class="stat-value"
                >
                    ₹0
                </div>

            </div>

            <div class="stat-card">

                <div class="stat-title">
                    RTGS Balance
                </div>

                <div
                    id="rtgsBalance"
                    class="stat-value"
                >
                    ₹0
                </div>

            </div>

            <div class="stat-card">

                <div class="stat-title">
                    Total Funds
                </div>

                <div
                    id="totalFunds"
                    class="stat-value"
                >
                    ₹0
                </div>

            </div>

        </div>

        <div class="dashboard-modes">

            <button
                id="cashModeBtn"
                class="dashboard-mode-btn active"
                onclick="switchCashReportMode('cash')"
            >
                Cash
            </button>

            <button
                id="rtgsModeBtn"
                class="dashboard-mode-btn"
                onclick="switchCashReportMode('rtgs')"
            >
                RTGS Cash
            </button>

        </div>

        <div id="cashReportContent"></div>

    </div>

    `;

    socket.emit("getCashReport",{
        token: localStorage.getItem("token")
    });
}

socket.on("cashReport",(data)=>{

    cashReportData = data;

    document.getElementById(
        "cashBalance"
    ).innerText =
        "₹" +
        Number(
            data.cash_balance || 0
        ).toLocaleString();

    document.getElementById(
        "rtgsBalance"
    ).innerText =
        "₹" +
        Number(
            data.rtgs_balance || 0
        ).toLocaleString();

    document.getElementById(
        "totalFunds"
    ).innerText =
        "₹" +
        Number(
            (data.cash_balance || 0)
            +
            (data.rtgs_balance || 0)
        ).toLocaleString();

    renderCashReport();
});

function switchCashReportMode(mode){

    cashReportMode = mode;

    document
        .getElementById("cashModeBtn")
        .classList.remove("active");

    document
        .getElementById("rtgsModeBtn")
        .classList.remove("active");

    if(mode === "cash"){

        document
            .getElementById("cashModeBtn")
            .classList.add("active");
    }
    else{

        document
            .getElementById("rtgsModeBtn")
            .classList.add("active");
    }

    renderCashReport();
}

function formatCashDate(dateString){

    if(!dateString){
        return "";
    }

    const parts =
        dateString.split("-");

    if(parts.length !== 3){
        return dateString;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function renderCashReport(){

    if(!cashReportData){
        return;
    }

    const container =
        document.getElementById(
            "cashReportContent"
        );

    container.innerHTML = "";

    const days =
        cashReportMode === "cash"
        ? cashReportData.cash_days
        : cashReportData.rtgs_days;

    console.log(days);

    days.forEach((day,index)=>{

        const group =
            document.createElement("div");

        group.className =
            "transaction-group";

        group.innerHTML = `

            <div class="transaction-group-top">

                <h3>
                    ${formatCashDate(day.date)}
                </h3>

            </div>

            <div class="cash-header-row">

                <div>Time</div>

                <div>Party</div>

                <div>Type</div>

                <div>Amount</div>

            </div>

            <div
                id="cashDayRows${index}"
            ></div>

            <div class="cash-closing-row">

                <div>
                    Day Closing
                </div>

                <div>
                    ₹${Number(
                        day.closing_balance || 0
                    ).toLocaleString()}
                </div>

            </div>

        `;

        container.appendChild(group);

        const rows =
            document.getElementById(
                `cashDayRows${index}`
            );

        day.transactions.forEach(t=>{
            const amountClass =
                t.type === "SALE"
                ? "cash-in"
                : "cash-out";

            const row =
                document.createElement("div");

            row.className =
                "cash-row";

            const amount =
                Number(
                    t.cash || 0
                ).toLocaleString();

            const sign =
                t.type === "SALE"
                ? "+"
                : "-";

            row.innerHTML = `

                <div>
                    ${
                        new Date(
                            t.created_at
                        ).toLocaleTimeString(
                            "en-IN",
                            {
                                hour: "2-digit",
                                minute: "2-digit"
                            }
                        )
                    }
                </div>

                <div>
                    ${t.entity_name || "-"}
                </div>

                <div>
                    ${t.type}
                </div>

                <div class="cash-amount ${amountClass}">
                    ${sign}₹${amount}
                </div>

            `;

            rows.appendChild(row);
        });

    });
}




/* ADD ENTRY */
function addCash() {
    const grid = document.getElementById("grid");
    grid.innerHTML = `
        <div class="transaction-form">

            <h2>Add Cash</h2>


            <label>Name</label>
                <input id="name" placeholder="Enter name" disabled value="Cash Helper">

            <div class="header-row">
                <div>Cash</div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>

            <div id="itemsContainer"></div>

            <button class="add-item-btn" onclick="addCashRow()">
                + Add Cash
            </button>

            <div class="bottom-panel">

                <!-- ===================================
                    SUMMARY ROW
                ==================================== -->
                <div class="bottom-summary-row">

                    <div></div>
                    <div></div>

                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>

                    <div></div>

                    <div></div>

                    <div></div>

                    <div></div>
                    <div></div>
                    <div></div>

                </div>

                <!-- ===================================
                    ACTION ROW
                ==================================== -->
                <div class="bottom-action-row">

                    <button onclick="saveCash()">
                        Save
                    </button>

                    <button class="cancel-btn"
                            onclick="getCash()">
                        Cancel
                    </button>

                </div>

            </div>
        </div>
    `;
    addCashRow();
}



function addCashRow(item = {}) {
    const container = document.getElementById("itemsContainer");

    const div = document.createElement("div");
    div.className = "item-row";

    itemRowCounter++;
    const itemId = "item-"+itemRowCounter;

    div.innerHTML = `

        <input disabled id="${itemId}" placeholder="Item" value="Cash Gold" data-id="${item.id}" autocomplete="off">

        <input id="cash" placeholder="Cash" autocomplete="off">

        <button class="type-btn ${item.type === "SALE" ? "SALE" : "BUY"}">
            ${item.type === "SALE" ? "SALE" : "BUY"}
        </button>

        <button class="type-btn-cash">
            Cash
        </button>

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
    });

    const cashbtn = div.querySelector(".type-btn-cash");

    const first_input = div.querySelectorAll("input")[0];

    cashbtn.addEventListener("click",()=>{
        if(cashbtn.innerText === "Cash"){
            cashbtn.innerText = "Rtgs";
            first_input.value = "Rtgs Gold";
        }
        else{
            cashbtn.innerText = "Cash";
            first_input.value = "Cash Gold";
        }
    });

    container.append(div);

    const delete_button = div.querySelector(".delete-button");

    delete_button.addEventListener("click",()=>{
        div.remove();
    });

    return div;
}


/* SAVE */
function saveCash() {
    const name = document.getElementById("name").value;

    const rows = document.querySelectorAll(".item-row");

    let items = [];

    rows.forEach(r => {
        const inputs = r.querySelectorAll("input");
        const buttons = r.querySelectorAll("button");

        const item = {
            itemname: inputs[0].value,
            cash: parseFloat(inputs[1].value || 0),
            baseweight: 0,
            touch: 100,
            seal: "",
            profit: 0,
            wastage: 0,
            stone: 0,
            qty: 0,
            finalweight: 0,
            type: buttons[0].innerText,
        };
        items.push(item);
    });

    const data = {
        token: localStorage.getItem("token"),
        name: name,
        old_balance: 0,
        new_balance: 0,
        base_weight: 0,
        final_weight: 0,
        items: items,
        cash: 0,
        gold_rate: 0,
    }
    socket.emit("saveTransaction",data);
}