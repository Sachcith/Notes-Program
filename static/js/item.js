/* GET ITEM */
function getItem(){
    selectedPage = null;
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    socket.emit("getItem",{token: localStorage.getItem("token")});
}

/* SOCKET FOR RENDERING ITEM */
socket.on("itemData",(e)=>{
    const grid = document.getElementById("grid");
    grid.innerHTML = "";

    e.forEach(d => {
        const div = document.createElement("div");
        div.className = "page";
        div.onclick = () => selectPage(div, d);

        div.innerHTML = `
            <b>${d.name || "New Entry"}</b><br>
            Touch: ${d.touch || 0}<br>
        `;

        grid.appendChild(div);
    });
});

/* ADD ITEM */
function addItem(){
    const grid = document.getElementById("grid");
    grid.innerHTML = `
    <div class="form-container">
        <h2>Add Item</h2>

        <label>Name</label>
        <div class="input-wrapper">
            <input id="name" placeholder="Enter Item Name" value="" autocomplete="off">
            <div id="nameDropdown" class="dropdown"></div>
        </div>

        <label>Touch</label>
        <input id="touch" type="number" step="any" placeholder="Enter touch value" value=92>

        <div class="actions">
            <button onclick="saveItem()">Save</button>
            <button onclick="cancelItem()">Cancel</button>
        </div>
    </div>
    `;
    document.getElementById("name").focus();

    setupAutocomplete("name","itemName",(input,item,type)=>{
        input.value = item[type];
        const inputId = input.id;
        let touch = document.getElementById("touch");
        touch.value = item["itemTouch"];
    });
}

function cancelItem(){
    selectedPage = null;
    getItem();
}

function editItem() {
    if (!selectedPage || !selectedPage.el) {
        console.error("selectedPage not set");
        return;
    }
    let d = selectedPage.d;
    grid.innerHTML = `
    <div class="form-container">
        <h2>Edit Item</h2>

        <label>Name</label>
        <div class="input-wrapper">
            <input id="name" placeholder="Enter Item Name" value="${d.name}" autocomplete="off">
            <div id="nameDropdown" class="dropdown"></div>
        </div>

        <label>Touch</label>
        <input id="touch" type="number" step="any" placeholder="Enter touch value" value=${d.touch}>

        <div class="actions">
            <button onclick="saveItemEdit()">Save Changes</button>
            <button onclick="cancelItem()">Cancel</button>
        </div>
    </div>
    `;
    document.getElementById("name").focus();

    setupAutocomplete("name","itemName",(input,item,type)=>{
        input.value = item[type];
        const inputId = input.id;
        let touch = document.getElementById("touch");
        touch.value = item["itemTouch"];
    });

}

function saveItem(){
    let data = {
        token: localStorage.getItem("token"),
        name: document.getElementById("name").value,
        touch: document.getElementById("touch").value,
    }
    socket.emit("saveItem",data);
}

function saveItemEdit(){
    let data = {
        token: localStorage.getItem("token"),
        name: document.getElementById("name").value,
        touch: document.getElementById("touch").value,
        id: selectedPage.d.id,
    }
    socket.emit("saveItemEdit",data);
}

socket.on("saveItemOk",(e)=>{
    console.log("New Item Saved Successfully");
    getItem();
});

socket.on("editItemOk",(e)=>{
    console.log("Item Edited and Saved Successfully");
    getItem();
});

function deleteItem(){
    if (!selectedPage || !selectedPage.el) {
        console.error("selectedPage not set");
        return;
    }

    const ok = confirm("Are you sure you want to delete this Item?");

    if (!ok) return;
    socket.emit("deleteItem",{
        token: localStorage.getItem("token"),
        id:selectedPage.d.id,
    });
}

socket.on("deleteItemOk",(e)=>{
    console.log("Item Deleted Successfully");
    getItem();
});