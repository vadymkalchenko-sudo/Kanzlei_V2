-- Tabelle: aktenverwaltung_mandant / aktenverwaltung_gegner
-- Speichert Stammdaten. ON DELETE muss auf PROTECT oder RESTRICT gesetzt werden.
CREATE TABLE aktenverwaltung_mandant (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    adresse TEXT,
    bankverbindung TEXT,
    -- Weitere Stammdatenfelder
);

-- Tabelle: aktenverwaltung_akte
CREATE TABLE aktenverwaltung_akte (
    id SERIAL PRIMARY KEY,
    aktenzeichen VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Offen', 'Geschlossen', 'Archiviert')),
    
    -- Fremdschlüssel zu Stammdaten
    mandant_id INTEGER REFERENCES aktenverwaltung_mandant(id) ON DELETE PROTECT,
    gegner_id INTEGER REFERENCES aktenverwaltung_gegner(id) ON DELETE PROTECT,
    
    -- Flexibles und historisches Datenmanagement
    info_zusatz JSONB,
    mandant_historie JSONB, -- Snapshot der Mandantendaten bei Aktenabschluss
    gegner_historie JSONB,  -- Snapshot der Gegnerdaten bei Aktenabschluss

    -- Dokumentenpfad (Wird in Dokument-Tabelle detailliert)
    dokumenten_pfad_root VARCHAR(255)
);

-- Tabelle: aktenverwaltung_dokument (Speichert Metadaten der Dokumente)
CREATE TABLE aktenverwaltung_dokument (
    id SERIAL PRIMARY KEY,
    akte_id INTEGER REFERENCES aktenverwaltung_akte(id) ON DELETE CASCADE,
    titel VARCHAR(255),
    dateiname VARCHAR(255),
    pfad_auf_server VARCHAR(512) -- Relativer Pfad: [AKTENZEICHEN]/[DATEINAME]
);

-- Tabelle: finanzen_zahlungsposition
CREATE TABLE finanzen_zahlungsposition (
    id SERIAL PRIMARY KEY,
    akte_id INTEGER REFERENCES aktenverwaltung_akte(id) ON DELETE CASCADE,
    betrag_soll DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    betrag_haben DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Anstehend', 'Ausstehend_Abgleich', 'Abgeschlossen'))
    -- ... weitere Felder
);