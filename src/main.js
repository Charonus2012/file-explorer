
const { invoke } = window.__TAURI__.tauri;

function getQueryParams() {
  const params = {};
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  for (const [key, value] of urlParams.entries()) {
    params[key] = value;
  }

  return params;
}

function set_get(f, w, n) {
    f.innerHTML += "<input type=\"hidden\" name="+n+" value=\""+ w +"\">";
}

function set_sub(f, c, t) {
    f.innerHTML += '<a id="link" href="javascript:{}" onclick="document.getElementById(\''+c+'\').submit()">'+t+'</a>'
}

function set_form(aid, c, i) {
    var f = document.createElement("form");
    f.className = c;
    f.id = i;
    f.method = "get";
    f.action = "";
    document.getElementById(aid).appendChild(f);
    return f;
}

async function dir(path) {
    dir = await invoke("list_dir", { path: path });
    console.log(dir);
    for (let index = 0; index < dir.length; index++) {
        let cd = dir[index][0];
        if (cd["is_dir"]) {
            let form = set_form("epl", "dir", cd["file_name"]);
            set_get(form, path + cd["file_name"] + "\\", "path");
            set_sub(form, cd["file_name"], "[" + cd["file_name"] + "]");
        }
    }
    let sc = document.getElementById("clicks");
    for (let i = 0; i < dir.length; i++) {
        let cd = dir[i][0];
        if (cd["is_file"]) {
            /*
            let form = set_form("epl", "file", cd["file_name"]);
            set_get(form, path, "path");
            set_get(form, form.id, "run");
            set_sub(form, cd["file_name"], cd["file_name"]);
            */
            let div = document.createElement("div");
            div.className = "file";
            div.id = cd["file_name"];
            document.getElementById("epl").appendChild(div);
            
            div.innerHTML += "<a id=\"link\" class=\""+cd["file_name"]  +"\">"+ cd["file_name"] +"</a>"

            sc.innerHTML += 'async function a'+i+'() {\n    await invoke("run_executable", {p: "'+ path + cd["file_name"] +'"});\n}\n';
            sc.innerHTML += 'document.addEventListener("click", a'+ i +');\n';
        }
    }
}
async function disks() {
    /*
    name
    mount point
    file system
    total space
    available space
    */
    for (let index = 0; index < await invoke("get_number_of_disks"); index++) {
        let disk = await invoke("get_disk", { w: index });
        var form = document.createElement("form");
        form.id = disk[1].slice(0,-2);
        form.className = "disk";
        form.method = "get";
        form.action = "";

        document.getElementById("epl").appendChild(form);
        set_get(form, disk[1], "path");
        set_sub(form, disk[1].slice(0,-2), disk[0]+ " (" + disk[1].slice(0,-1) + ")")
        //+ disk[0]+ " (" + disk[1].slice(0,-1) + ")" + 
        
    }
}
async function run(f, p) {
    await invoke("run_executable", { executablePath: p+f });
}

function back(params) {
    let path = params["path"].split("\\");
    if (path[-1]=="") {
        path = params["path"].split("\\", path.length-2);
    }
    path = params["path"].split("\\", path.length-2);
    path = path.join("\\")+"\\";
    let f = document.createElement("form");
    document.body.appendChild(f);
    set_get(f, path, "path");
    f.submit();
}

// Only when not writing path

// var for detection
let stoob = 0;

// Detect when backspace in search
document.getElementById("search").onkeydown = function (e) {
    if(e.keyCode == 8) {
        stoob = 1;
    }
}
// Detect all backspaces
document.onkeyup = function (e) {
    if (e.keyCode == 8 && stoob != 1) {
        back(getQueryParams());
    }
    stoob = 0;
};



window.addEventListener("DOMContentLoaded", () => {
    let params = getQueryParams();
    document.getElementById("back").addEventListener("click", () => back(params));
    let inp = document.getElementById("search")
    if (params["path"]==null || params["path"]=="\\" || params["path"] == "" || params["path"]=="/") {
        inp.value = "\\"
        disks();
    } else {
        inp.value = params["path"];
        dir(params["path"]);
    }
});