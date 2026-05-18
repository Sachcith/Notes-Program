/* GET STOCK */
function getStock(){
    selectedPage = null;
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    socket.emit("getStock",{token: localStorage.getItem("token")});
}

/* SOCKET FOR RENDERING STOCK */
socket.on("stockData",(e)=>{
    const grid = document.getElementById("grid");
    grid.innerHTML = "";

    e.forEach(d => {
        const div = document.createElement("div");
        div.className = "page";
        div.onclick = () => selectPage(div, d);

        div.innerHTML = `
            <b>${d.name || "New Entry"}</b><br>
            Touch: ${d.touch || 0}<br>
            Current Stock: ${d.current_stock}<br>
        `;

        grid.appendChild(div);
    });
});

/* ADD STOCK */
function addStock(){
    const grid = document.getElementById("grid");
    grid.innerHTML = `
    <div class="form-container">
        <h2>Add Stock</h2>

        <label>Name</label>
        <input id="name" placeholder="Enter name" value="${current_name}">

        <label>Touch</label>
        <input id="touch" type="number" step="any" placeholder="Enter touch value" value=92>

        <label>Current Stock</label>
        <input id="current_stock" type="number" step="any" placeholder="Enter Current Stock">

        <div class="actions">
            <button onclick="saveStock()">Save</button>
            <button onclick="cancelStock()">Cancel</button>
        </div>
    </div>
    `;
    document.getElementById("name").focus();
}

function cancelStock(){
    selectedPage = null;
    getStock();
}

function editStock() {
    if (!selectedPage || !selectedPage.el) {
        console.error("selectedPage not set");
        return;
    }
    let d = selectedPage.d;
    grid.innerHTML = `
    <div class="form-container">
        <h2>Edit Stock</h2>

        <label>Name</label>
        <input id="name" placeholder="Enter name" value="${current_name}">

        <label>Touch</label>
        <input id="touch" type="number" step="any" placeholder="Enter touch value" value=92>

        <label>Current Stock</label>
        <input id="current_stock" type="number" step="any" placeholder="Enter Current Stock">

        <div class="actions">
            <button onclick="saveStockEdit()">Save</button>
            <button onclick="cancelStock()">Cancel</button>
    </div>
    `;

}

function saveStock(){
    let data = {
        token: localStorage.getItem("token"),
        name: document.getElementById("name").value,
        touch: document.getElementById("touch").value,
        current_stock: document.getElementById("current_stock").value,
    }
    socket.emit("saveStock",data);
}

function saveStockEdit(){
    let data = {
        token: localStorage.getItem("token"),
        name: document.getElementById("name").value,
        touch: document.getElementById("touch").value,
        current_stock: document.getElementById("current_stock").value,
        id: selectedPage.d.id,
    }
    socket.emit("saveStockEdit",data);
}

socket.on("saveStockOk",(e)=>{
    console.log("New Stock Saved Successfully");
    getItem();
});

socket.on("editStockOk",(e)=>{
    console.log("Stock Edited and Saved Successfully");
    getItem();
});

function deleteStock(){
    if (!selectedPage || !selectedPage.el) {
        console.error("selectedPage not set");
        return;
    }

    const ok = confirm("Are you sure you want to delete "+selectedPage.d.name);

    if (!ok) return;
    socket.emit("deleteStock",{
        token: localStorage.getItem("token"),
        id:selectedPage.d.id,
    });
}

socket.on("deleteStockOk",(e)=>{
    console.log("Stock Deleted Successfully");
    getStock();
});