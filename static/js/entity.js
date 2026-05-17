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