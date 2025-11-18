def fix_lf_line_endings(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Ersetze CRLF durch LF
    fixed_content = content.replace('\r\n', '\n')

    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        f.write(fixed_content)

files_to_fix = [
    'Doku-Projekt/architektur_uebersicht.md',
]

for f in files_to_fix:
    print(f"Korrigiere Zeilenumbrüche in '{f}'...")
    fix_lf_line_endings(f)
    print(f"Zeilenumbrüche in '{f}' wurden erfolgreich korrigiert.")
