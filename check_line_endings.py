import os

def check_lf_line_endings(filepath):
    with open(filepath, 'rb') as f:
        content = f.read()
        if b'\r\n' in content:
            return False
    return True

files_to_check = [
    'README.md',
    'Doku-Projekt/architektur_uebersicht.md',
]

all_lf = True
for f in files_to_check:
    if not check_lf_line_endings(f):
        print(f"Datei '{f}' enthält CRLF-Zeilenumbrüche.")
        all_lf = False
    else:
        print(f"Datei '{f}' enthält LF-Zeilenumbrüche.")

if all_lf:
    print("\nAlle überprüften Dateien verwenden LF-Zeilenumbrüche.")
else:
    print("\nEs wurden Dateien mit CRLF-Zeilenumbrüchen gefunden. Bitte korrigieren Sie diese.")
