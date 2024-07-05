#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use sysinfo::{
    Disk, Disks, System
};
use std::fs;
use serde::Serialize;
use std::process::{Command, Stdio};
use std::os::windows::process::CommandExt;

#[tauri::command]
fn get_number_of_disks() -> usize {
    let d = Disks::new_with_refreshed_list();
    d.len()
}

#[tauri::command]
fn get_disk(w: usize) -> [String; 5] {
    let odisk: &Disk = &Disks::new_with_refreshed_list()[w];
    let disk = [
        odisk.name().to_os_string().into_string().expect("Invalid"),
        odisk.mount_point().display().to_string(),
        odisk.file_system().to_os_string().into_string().expect("Invalid"),
        odisk.total_space().to_string(),
        odisk.available_space().to_string()
    ];
    return disk;
}

#[derive(Serialize)]
struct FileEntry {
    file_name: String,
    is_file: bool,
    is_dir: bool,
}

#[tauri::command]
fn list_dir(path: &str) -> Vec<Vec<FileEntry>> {
    list_directory_contents(path)
}

fn list_directory_contents(directory_path: &str) -> Vec<Vec<FileEntry>> {
    let mut result: Vec<Vec<FileEntry>> = Vec::new();

    if let Ok(entries) = fs::read_dir(directory_path) {
        for entry in entries.filter_map(|e| e.ok()) {
            let file_name = entry.file_name();
            let path = entry.path();
            let is_file = path.is_file();
            let is_dir = path.is_dir();

            // Create FileEntry object
            let file_entry = FileEntry {
                file_name: file_name.to_string_lossy().into_owned(),
                is_file,
                is_dir,
            };

            // Find or create vector for the current directory
            if let Some(dir_vec) = result.iter_mut().find(|v| v[0].is_dir && v[0].file_name == file_name.to_os_string().into_string().expect("failed")) {
                dir_vec.push(file_entry);
            } else {
                result.push(vec![file_entry]);
            }
        }
    }

    result
}


#[tauri::command]
fn run_executable(p: String) {
    Command::new("cmd")
        .args(&[p])
        .stdout(Stdio::null())  // Redirect stdout to null
        .stderr(Stdio::null())  // Redirect stderr to null
        .creation_flags(0x08000000)  // CREATE_NO_WINDOW flag for Windows
        .spawn()
        .expect("Failed to spawn command");
}

fn main() {
    let mut sys = System::new();
    sys.refresh_all();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_disk, get_number_of_disks, list_dir, run_executable])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
