function getReport(){

    const grid =
        document.getElementById("grid");

    grid.innerHTML = `

    <div class="dashboard-page">

        <div class="dashboard-hero">

            <div class="hero-left">

                <h1>
                    Gold Report
                </h1>

                <div class="hero-subtitle">
                    Current Gold Balances
                </div>

            </div>

        </div>

        <div class="transaction-group">

            <div class="gold-report-header">

                <div>Name</div>

                <div>Balance (g)</div>

            </div>

            <div
                id="goldReportContainer"
            ></div>

            <div
                class="gold-report-total"
            >

                <div>
                    Total
                </div>

                <div
                    id="goldReportTotal"
                >
                    0.000
                </div>

            </div>

        </div>

    </div>

    `;

    socket.emit("getGoldReport",{
        token: localStorage.getItem("token")
    });
}

socket.on("goldReport",(data)=>{
    renderGoldReport(data);
});

function renderGoldReport(data){

    const container =
        document.getElementById(
            "goldReportContainer"
        );

    container.innerHTML = "";

    let total = 0;

    data.items.forEach(item=>{

        const balance =
            Number(
                item.balance || 0
            );

        total += balance;

        const row =
            document.createElement("div");

        row.className =
            "gold-report-row";

        row.innerHTML = `

            <div>
                ${item.name}
            </div>

            <div>
                ${balance.toFixed(3)}
            </div>

        `;

        container.appendChild(row);
    });

    document.getElementById(
        "goldReportTotal"
    ).innerText =
        total.toFixed(3);
}