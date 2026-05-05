let mode = "login";

function toggle() {
    mode = mode === "login" ? "signup" : "login";
    document.getElementById("title").innerText = mode;
}

document.getElementById("authForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const url = mode === "login" ? "/api/login" : "/api/signup";

    const res = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, password})
    });

    const data = await res.json();

    if (mode === "login" && res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);

        window.location.href = "/dashboard";
    }
});