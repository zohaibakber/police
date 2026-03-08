use tauri_plugin_sql::{Migration, MigrationKind};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_fir_table",
            sql: "CREATE TABLE IF NOT EXISTS fir (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                serial_number INTEGER NOT NULL,
                fir TEXT NOT NULL,
                dated TEXT NOT NULL,
                police_station TEXT NOT NULL,
                complainant_name TEXT NOT NULL,
                id_card_number TEXT NOT NULL,
                mobile_number TEXT NOT NULL,
                prepared_and_dispatched_by TEXT NOT NULL,
                writer TEXT NOT NULL,
                date_of_incident TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('pending', 'registered', 'under_investigation', 'closed'))
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_templates_table",
            sql: "CREATE TABLE IF NOT EXISTS templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                workflow_step TEXT NOT NULL CHECK(workflow_step IN ('pending', 'registered', 'under_investigation', 'closed')),
                source_mode TEXT NOT NULL CHECK(source_mode IN ('editor', 'docx')),
                content TEXT NOT NULL,
                docx_file_name TEXT,
                placeholders_json TEXT NOT NULL DEFAULT '[]',
                status TEXT NOT NULL CHECK(status IN ('active', 'inactive')),
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:fir.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
