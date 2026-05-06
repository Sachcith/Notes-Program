function getTransaction(){
    set_current_mode();
    selectedPage = null;
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    socket.emit("getTransaction",{token: localStorage.getItem("token")});
    // searchbar();
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
                Old Balance: ${d.old_balance}<br>
                Final Weight: ${d.final_weight}<br>
                New Balance: ${d.new_balance}<br>
                <small>${d.created_at}</small>
            `;

            grid.appendChild(div);
        }
    });
});