---
summary: Jede privilegierte Aktion eigener Mitarbeitender oder Automatisierung muss auf eine Person zurückführbar, zeitlich begrenzt und mit automatischer Missbrauchserkennung protokolliert sein. Die Admin-Zugänge brauchen MFA.
tags: [access-control, admin-interfaces, mfa, logging]
lifecycle: [design, run]
related: [IAM-01, IAM-08, OPS-10, OPS-13, COS-05, SIM-01]
status: Entwurf, Beispieltext für den Prototyp
---

## Was das in der Praxis bedeutet

„Privilegiert“ hat hier eine genaue Bedeutung (siehe ergänzende Informationen): Zugriffe, mit denen Mitarbeitende des Anbieters Kundendaten lesen oder schreiben können, sofern diese nicht verschlüsselt sind, oder die Betriebs- oder Sicherheitskonfiguration in der Produktion ändern. Kann die Admin-API eines davon, ist sie im Scope.

Aus Engineering-Sicht übersetzen sich die Basis-Unterkriterien so:

- **Keine anonymen Admins.** Gemeinsam genutzte technische Konten wie `root` oder ein Break-Glass-Benutzer dürfen existieren, sind aber nur erreichbar, nachdem sich die Person mit ihrer eigenen Identität authentisiert hat (03B). Also „Auschecken über einen Vault oder `sudo` nach persönlichem Login“, nicht ein geteiltes Passwort im Wiki.
- **Befristete Berechtigungen.** Privilegierte Rollen laufen ab. Wie lange sie gelten, bestimmt die eigene Risikobeurteilung (02B), aber „2023 vergeben, immer noch aktiv“ übersteht kein Audit.
- **Protokollieren, erkennen, benachrichtigen.** Privilegierte Aktivitäten nur zu protokollieren reicht nicht. Es braucht automatische Regeln über diese Protokolle und eine Person, die benachrichtigt wird, wenn sie auslösen (04B bis 06B).
- **MFA an jeder Administrationsschnittstelle** (09B), auch an internen Konsolen und CLIs, die mit der Admin-API sprechen.

Die Zusatzkriterien heben die Latte: ein Verzeichnis privilegierter Identitäten, benannte Verantwortliche für nicht-menschliche Identitäten, **phishing-resistente MFA** (FIDO2 oder gleichwertig) und eine **PAM-Lösung mit Just-in-time-Rechteerhöhung**.

## Typische Nachweise

- Die Richtlinie für privilegierte Zugriffe (Teil der IAM-Richtlinie oder eine eigene, vgl. IAM-01)
- Export der privilegierten Rollen und Gruppen mit Mitgliedern und Ablaufdaten zu einem Stichtag
- Eine Stichprobe von Zugriffsanträgen mit Genehmigung, Vergabe und automatischem Ablauf
- Konfiguration des Identity Providers, die MFA für die Admin-Anwendungen erzwingt
- SIEM-Erkennungsregeln für privilegierten Missbrauch, dazu ein oder zwei Alarme mit dem zugehörigen Ticket
- Für Zusatzkriterien: PAM-Konfiguration, FIDO2-Richtlinie, die Liste der Verantwortlichen für nicht-menschliche Identitäten mit dem halbjährlichen Review

## Verbreitete Missverständnisse

- **„C5 verbietet geteilte Konten.“** Tut er nicht. Er verlangt, dass sie nur nach persönlicher Authentisierung genutzt werden (03B).
- **„Dauerhafte Admin-Rechte sind schon im Basiskriterium verboten.“** Das Basiskriterium verlangt eine Befristung auf Basis einer Risikobeurteilung. Just-in-time-Rechteerhöhung über PAM verlangt ausdrücklich erst das Zusatzkriterium 04AC.
- **„Jede MFA reicht.“** Für die Basiskriterien ja, der Text verlangt nur MFA. Phishing-resistente MFA ist ein Zusatzkriterium (03AC). Also prüfen, welche Kriterien die eigene Prüfung umfasst.
- **„Wir protokollieren alles, also passt das.“** 05B und 06B verlangen automatische Überwachung und Benachrichtigung, nicht nur Aufbewahrung.

## Was sich seit C5:2020 geändert hat

_Noch nicht geschrieben. Quelle für diesen Abschnitt: das C5:2026-Änderungsprotokoll des BSI (xlsx)._
