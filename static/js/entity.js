/* GET ENTITY */
function getEntity(){
    set_current_mode();
    selectedPage = null;
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    socket.emit("getEntity",{token: localStorage.getItem("token")});
}

/* SOCKET FOR RENDERING ENTITY */
socket.on("entityData",(e)=>{
    const grid = document.getElementById("grid");
    grid.innerHTML = "";

    e.forEach(d => {
        if(d.type==current_mode.toUpperCase()){
            const div = document.createElement("div");
            div.className = "page";
            div.onclick = () => selectPage(div, d);

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
            <input id="name" placeholder="Enter name" value="${current_name}">

            <label>Type</label>
            <br>
            <button class="customerbutton" onclick=selectButton(event)>Customer</button>
            <button class="manufacturerbutton" onclick=selectButton(event)>Manufacturer</button>
            <button class="wholesalerbutton" onclick=selectButton(event)>Wholesaler</button>
            <br>
            <br>

            <label>Balance</label>
            <input id="balance" type="number" value="0">
            
            <label>Phone</label>
            <input id="phone" placeholder="Enter phone">

            <label>Location</label>
            <input id="location" placeholder="Enter location">

            <div class="actions">
                <button onclick="saveEntity()">Save</button>
                <button onclick="cancelEntity()">Cancel</button>
            </div>
        </div>
    `;
    set_current_mode();
    unlock = false;
    document.getElementById("name").focus();
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
    grid.innerHTML = `
        <div class="form-container">

            <h2>Add Entity</h2>

            <label>Name</label>
            <input id="name" placeholder="Enter name" value="${d.name}">

            <label>Type</label>
            <br>
            <button class="customerbutton" onclick=selectButton(event)>Customer</button>
            <button class="manufacturerbutton" onclick=selectButton(event)>Manufacturer</button>
            <button class="wholesalerbutton" onclick=selectButton(event)>Wholesaler</button>
            <br>
            <br>

            <label>Balance</label>
            <input id="balance" type="number" value="${d.balance}">
            
            <label>Phone</label>
            <input id="phone" placeholder="Enter phone" value="${d.phone}">

            <label>Location</label>
            <input id="location" placeholder="Enter location" value="${d.location}">

            <div class="actions">
                <button onclick="saveEntityEdit()">Save Changes</button>
                <button onclick="cancelEntity()">Cancel</button>
            </div>
        </div>
    `;
    set_current_mode();
    unlock = false;  

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
    if (!selectedPage) return;

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