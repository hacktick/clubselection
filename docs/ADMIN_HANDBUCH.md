# Administratorhandbuch

**Repository**: [https://github.com/hacktick/clubselection](https://github.com/hacktick/clubselection)

Dieses Handbuch beschreibt alle Funktionen des Club Selection Management Systems für Administratoren.

## Inhaltsverzeichnis

1. [Anmeldung](#anmeldung)
2. [Dashboard-Übersicht](#dashboard-übersicht)
3. [Projektverwaltung](#projektverwaltung)
4. [Kursverwaltung](#kursverwaltung)
5. [Zeitabschnitte verwalten](#zeitabschnitte-verwalten)
6. [Kategorien (Tags) verwalten](#kategorien-tags-verwalten)
7. [Schülerverwaltung](#schülerverwaltung)
8. [Anmeldungen verfolgen](#anmeldungen-verfolgen)
9. [Systemeinstellungen](#systemeinstellungen)

---

## Anmeldung

### Administrator-Login

1. Öffnen Sie die Anwendung im Browser
2. Klicken Sie auf **Admin-Login**
3. Geben Sie Ihren Benutzernamen und Ihr Passwort ein
4. Nach erfolgreicher Anmeldung werden Sie zum Dashboard weitergeleitet

**Standardzugangsdaten** (nach Erstinstallation):
- Benutzername: `admin`
- Passwort: `admin`

> **Wichtig**: Ändern Sie das Standardpasswort nach der ersten Anmeldung!

---

## Dashboard-Übersicht

Das Admin-Dashboard zeigt:

- **Projektliste**: Alle erstellten Wahlperioden mit Statusanzeige
- **Schnellaktionen**: Neues Projekt erstellen
- **Systemeinstellungen**: Seitentitel anpassen

Jedes Projekt zeigt folgende Informationen:
- Projektname und Beschreibung
- Anmeldezeitraum (Start- und Enddatum)
- Anzahl der abgeschlossenen Anmeldungen
- Anzahl der Anmeldungen in Bearbeitung

---

## Projektverwaltung

Ein **Projekt** repräsentiert eine Wahlperiode (z.B. "AG-Wahl Schuljahr 2024/25").

### Neues Projekt erstellen

1. Klicken Sie auf **Neues Projekt**
2. Füllen Sie folgende Felder aus:
   - **Name**: Bezeichnung der Wahlperiode (z.B. "AG-Wahl 2. Halbjahr")
   - **Beschreibung** (optional): Zusätzliche Informationen für Schüler
   - **Zeitzone**: Wählen Sie die lokale Zeitzone (z.B. "Europe/Berlin")
   - **Anmeldebeginn**: Datum und Uhrzeit, ab wann Schüler wählen können
   - **Anmeldeende**: Deadline für die Kurswahl
3. Klicken Sie auf **Speichern**

### Projekt bearbeiten

1. Klicken Sie auf ein Projekt in der Liste
2. Wählen Sie **Bearbeiten**
3. Ändern Sie die gewünschten Felder
4. Klicken Sie auf **Speichern**

> **Hinweis**: Projekte mit bestehenden Schüleranmeldungen können nicht mehr bearbeitet werden, um die Datenintegrität zu gewährleisten.

### Projekt exportieren

Sie können die Projektstruktur als YAML-Datei exportieren:

1. Öffnen Sie das Projekt
2. Klicken Sie auf **Exportieren**
3. Die Datei enthält alle Kurse, Zeitabschnitte und Kategorien
4. Nützlich für Backups oder zum Duplizieren von Projekten

> **Hinweis**: Schülerdaten und Anmeldungen werden aus Datenschutzgründen nicht exportiert.

### Alle Anmeldungen löschen

Falls Sie eine Wahlperiode zurücksetzen möchten:

1. Öffnen Sie das Projekt
2. Klicken Sie auf **Alle Anmeldungen löschen**
3. Bestätigen Sie die Aktion

> **Warnung**: Diese Aktion löscht alle Schüleranmeldungen unwiderruflich!

### Projekt löschen

Um ein Projekt vollständig zu entfernen:

1. Öffnen Sie das Admin-Dashboard
2. Klicken Sie auf das **Löschen**-Symbol (Mülleimer) neben dem Projekt
3. Bestätigen Sie die Aktion im Bestätigungsdialog

> **Warnung**: Beim Löschen werden alle zugehörigen Daten unwiderruflich entfernt:
> - Alle Kurse und deren Termine
> - Alle Schüleranmeldungen
> - Alle Kategorien (Tags)
> - Alle Zeitabschnitte
> - Alle Submissions

### Projekt importieren

Sie können ein zuvor exportiertes Projekt importieren:

1. Klicken Sie auf **Importieren** im Dashboard
2. Wählen Sie die YAML-Datei aus
3. Das Projekt wird mit allen Kursen, Zeitabschnitten und Kategorien erstellt

> **Hinweis**: Schülerdaten werden aus Datenschutzgründen nicht importiert.

---

## Kursverwaltung

Kurse repräsentieren die wählbaren AGs, Clubs oder Unterrichtseinheiten.

### Kursübersicht (Kalenderansicht)

Die Kursübersicht zeigt einen interaktiven Stundenplan:
- **Y-Achse**: Zeitabschnitte (z.B. "1. Stunde", "2. Stunde")
- **X-Achse**: Wochentage (Montag bis Sonntag)
- Kurse werden als farbige Karten angezeigt

### Neuen Kurs erstellen

**Methode 1 - Über Kalender:**
1. Klicken Sie auf eine leere Zelle im Kalender
2. Das Formular öffnet sich mit vorausgewähltem Tag und Zeitabschnitt

**Methode 2 - Über Button:**
1. Klicken Sie auf **Neuer Kurs**
2. Füllen Sie das Formular aus

**Kursformular:**
- **Name**: Bezeichnung des Kurses (z.B. "Basketball AG")
- **Beschreibung** (optional): Details zum Kursinhalt
- **Kapazität** (optional): Maximale Teilnehmerzahl (leer = unbegrenzt)
- **Termine**: Wählen Sie Tag(e) und Zeitabschnitt(e)
- **Kategorien**: Weisen Sie passende Tags zu

### Kurs mit mehreren Terminen

Ein Kurs kann an mehreren Tagen/Zeiten stattfinden:

1. Klicken Sie auf **Termin hinzufügen**
2. Wählen Sie den zusätzlichen Wochentag
3. Wählen Sie den Zeitabschnitt
4. Wiederholen Sie für weitere Termine

**Beispiel**: "Theater AG" findet Montag und Mittwoch jeweils in der 7. Stunde statt.

### Kurs bearbeiten

1. Klicken Sie auf die Kurskarte im Kalender
2. Ändern Sie die gewünschten Felder
3. Klicken Sie auf **Speichern**

### Kurs löschen

1. Klicken Sie auf die Kurskarte im Kalender
2. Klicken Sie auf **Löschen**
3. Bestätigen Sie die Aktion

> **Hinweis**: Beim Löschen eines Kurses werden auch alle zugehörigen Anmeldungen entfernt.

---

## Zeitabschnitte verwalten

Zeitabschnitte definieren die möglichen Zeitslots für Kurse (z.B. Schulstunden).

### Zeitabschnitt erstellen

1. Wechseln Sie zum Tab **Zeitabschnitte**
2. Klicken Sie auf **Neuer Zeitabschnitt**
3. Füllen Sie aus:
   - **Bezeichnung**: Name des Zeitslots (z.B. "1. Stunde", "Mittagspause")
   - **Startzeit**: Beginn im Format HH:MM (z.B. "08:00")
   - **Endzeit**: Ende im Format HH:MM (z.B. "08:45")
4. Klicken Sie auf **Speichern**

### Zeitabschnitt bearbeiten

1. Klicken Sie auf den Zeitabschnitt in der Liste
2. Ändern Sie die Felder
3. Klicken Sie auf **Speichern**

### Zeitabschnitt löschen

1. Klicken Sie auf das Löschen-Symbol neben dem Zeitabschnitt
2. Bestätigen Sie die Aktion

> **Wichtig**: Zeitabschnitte können nur gelöscht werden, wenn keine Kurse diesen Zeitslot verwenden. Entfernen Sie zuerst alle Kurstermine, die diesen Zeitabschnitt nutzen.

### Beispiel-Zeitabschnitte

| Bezeichnung | Startzeit | Endzeit |
|-------------|-----------|---------|
| 1. Stunde   | 08:00     | 08:45   |
| 2. Stunde   | 08:50     | 09:35   |
| Große Pause | 09:35     | 10:00   |
| 3. Stunde   | 10:00     | 10:45   |
| 4. Stunde   | 10:50     | 11:35   |
| 5. Stunde   | 11:40     | 12:25   |
| Mittagspause| 12:25     | 13:15   |
| 7. Stunde   | 13:15     | 14:00   |
| 8. Stunde   | 14:05     | 14:50   |

---

## Kategorien (Tags) verwalten

Kategorien ermöglichen die Gruppierung von Kursen und die Definition von Wahlregeln.

### Kategorie erstellen

1. Wechseln Sie zum Tab **Kategorien**
2. Klicken Sie auf **Neue Kategorie**
3. Füllen Sie aus:
   - **Name**: Bezeichnung (z.B. "Sport", "Musik", "MINT")
   - **Farbe**: Wählen Sie eine Farbe zur visuellen Unterscheidung
   - **Minimum**: Mindestanzahl Kurse, die aus dieser Kategorie gewählt werden müssen
   - **Maximum**: Höchstanzahl Kurse, die aus dieser Kategorie gewählt werden dürfen (leer = unbegrenzt)
4. Klicken Sie auf **Speichern**

### Beispiele für Kategorien mit Regeln

| Kategorie | Minimum | Maximum | Bedeutung |
|-----------|---------|---------|-----------|
| Sport     | 1       | 2       | Mindestens 1, maximal 2 Sport-AGs wählen |
| Musik     | 0       | 1       | Optional, aber maximal 1 Musik-AG |
| MINT      | 2       | -       | Mindestens 2 MINT-AGs, keine Obergrenze |
| Pflicht   | 1       | 1       | Genau 1 Pflichtkurs wählen |

### Kategorie bearbeiten

1. Klicken Sie auf die Kategorie in der Liste
2. Ändern Sie die gewünschten Felder
3. Klicken Sie auf **Speichern**

### Kategorie löschen

1. Klicken Sie auf das Löschen-Symbol
2. Bestätigen Sie die Aktion

> **Hinweis**: Beim Löschen einer Kategorie wird diese von allen zugeordneten Kursen entfernt. Die Kurse selbst bleiben erhalten.

---

## Schülerverwaltung

### Schüler importieren

Schüler werden über ihre Kennungen (E-Mail-Adresse oder Schüler-ID) hinzugefügt.

1. Wechseln Sie zum Tab **Schüler**
2. Klicken Sie auf **Schüler importieren**
3. Fügen Sie die Kennungen ein (eine pro Zeile):
   ```
   max.mustermann@schule.de
   anna.schmidt@schule.de
   12345
   67890
   ```
4. Klicken Sie auf **Importieren**

**Automatische Token-Generierung:**
- Für jeden Schüler wird automatisch ein eindeutiger Token erstellt
- Der Token basiert auf der Kennung (SHA-256 Hash)
- Derselbe Schüler erhält immer denselben Token

### Schülerliste anzeigen

Die Schülerliste zeigt:
- Kennung/Name
- Generierter Token
- Anmeldestatus

### QR-Codes für Schüler

Schüler können sich über ihren Token anmelden. Sie können:
- Tokens direkt an Schüler verteilen
- QR-Codes mit eingebettetem Token erstellen
- Links mit Token per E-Mail versenden

**URL-Format**: `https://ihre-domain.de/#/enroll?token=SCHÜLER_TOKEN`

### Alle Schüler entfernen

1. Klicken Sie auf **Alle Schüler entfernen**
2. Bestätigen Sie die Aktion

> **Warnung**: Diese Aktion entfernt alle Schüler und deren Anmeldungen aus dem Projekt!

---

## Anmeldungen verfolgen

### Übersicht der Anmeldungen

Die Projektdetailseite zeigt:
- **Abgeschlossene Anmeldungen**: Schüler, die ihre Wahl bestätigt haben
- **In Bearbeitung**: Schüler, die Kurse ausgewählt, aber noch nicht abgeschickt haben

### Anmeldestatus

Jede Kursanmeldung hat einen Status:
- **PENDING** (Ausstehend): Schüler hat gewählt, aber nicht abgeschickt
- **CONFIRMED** (Bestätigt): Anmeldung wurde abgeschickt
- **CANCELLED** (Storniert): Anmeldung wurde zurückgezogen

### Einzelne Anmeldungen einsehen

1. Öffnen Sie das Projekt
2. Scrollen Sie zur Anmeldungsliste
3. Sehen Sie für jeden Schüler:
   - Name/Kennung
   - Gewählte Kurse
   - Zeitstempel der Anmeldung
   - Status

---

## Systemeinstellungen

### Seitentitel ändern

1. Im Dashboard finden Sie die Einstellungen-Karte
2. Geben Sie den neuen Seitentitel ein (z.B. "AG-Wahl Musterschule")
3. Klicken Sie auf **Speichern**

Der Seitentitel wird im Header der Anwendung angezeigt.

### Sprache ändern

Die Anwendung unterstützt mehrere Sprachen:
- Deutsch (DE)
- Englisch (EN)
- Französisch (FR)
- Spanisch (ES)

1. Klicken Sie auf das Benutzermenü (oben rechts)
2. Wählen Sie die gewünschte Sprache aus
3. Die Oberfläche wird sofort in der neuen Sprache angezeigt

> **Hinweis**: Datumsformate passen sich automatisch der Sprache an (z.B. dd.MM.yyyy für Deutsch).

### Abmelden

1. Klicken Sie auf das Benutzermenü (oben rechts)
2. Wählen Sie **Abmelden**
3. Sie werden zur Startseite weitergeleitet

---

## Häufige Fragen (FAQ)

### Warum kann ich ein Projekt nicht bearbeiten?

Projekte mit bestehenden Schüleranmeldungen sind gesperrt, um die Datenintegrität zu schützen. Löschen Sie zuerst alle Anmeldungen, um das Projekt wieder bearbeiten zu können.

### Warum kann ich einen Zeitabschnitt nicht löschen?

Der Zeitabschnitt wird noch von einem oder mehreren Kursen verwendet. Bearbeiten Sie diese Kurse und entfernen Sie den entsprechenden Termin, bevor Sie den Zeitabschnitt löschen.

### Wie setze ich eine Wahlperiode zurück?

1. Öffnen Sie das Projekt
2. Klicken Sie auf "Alle Anmeldungen löschen"
3. Optional: Entfernen Sie alle Schüler
4. Das Projekt kann nun erneut verwendet werden

### Wie kann ich ein Projekt duplizieren?

1. Exportieren Sie das Projekt als YAML (Klicken Sie auf das Export-Symbol)
2. Klicken Sie auf **Importieren** im Dashboard
3. Wählen Sie die exportierte YAML-Datei
4. Das Projekt wird mit allen Kursen, Zeitabschnitten und Kategorien erstellt

> **Hinweis**: Schülerdaten und Anmeldungen werden nicht dupliziert.

### Wie generiere ich QR-Codes für Schüler?

Verwenden Sie einen QR-Code-Generator (z.B. online) mit der URL:
```
https://ihre-domain.de/#/enroll?token=SCHÜLER_TOKEN
```

Ersetzen Sie `SCHÜLER_TOKEN` durch den jeweiligen Token aus der Schülerliste.

---

## Support

Bei technischen Problemen oder Fragen:
- Besuchen Sie das Repository: [https://github.com/hacktick/clubselection](https://github.com/hacktick/clubselection)
- Erstellen Sie ein Issue für Fehlerberichte oder Feature-Anfragen
- Wenden Sie sich an Ihren Systemadministrator
