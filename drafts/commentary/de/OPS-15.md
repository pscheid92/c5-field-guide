---
summary: Protokolle müssen die Frage beantworten, welcher Benutzer in welchem Mandanten wann worauf zugegriffen hat, mit verlässlichen Zeitstempeln. Bei einem Sicherheitsereignis muss sich der forensische Zustand sichern lassen.
tags: [logging, forensics, multi-tenancy]
lifecycle: [build, run]
related: [OPS-10, OPS-12, OPS-14, PSS-04, SIM-03]
status: Entwurf, Beispieltext für den Prototyp
---

## Was das in der Praxis bedeutet

In diesem Kriterium geht es darum, ob die Protokolle einer Untersuchung standhalten:

- **Zuordnung auf Mandantenebene** (01B). Für jeden Zugriff lässt sich sagen, welche Identität gehandelt hat und welcher Mandant betroffen war. Ein Request-Log mit Mandanten-ID, aber nur einem gemeinsamen Service-Principal als Akteur, erfüllt das nicht.
- **Zeitstempel an jedem Ereignis** (02B). Zusammen mit der Zeitsynchronisation aus OPS-10, sonst lassen sich Zeitstempel verschiedener Systeme nicht korrelieren.
- **Forensische Bereitschaft** (03B). Bei einem Sicherheitsereignis lässt sich der Zustand von Hardware-Objekten und Netzwerkkommunikation sichern, etwa durch Festplatten- und Speicher-Snapshots oder Paketmitschnitte, und eine Beweiskette erhalten. Dafür braucht es Werkzeuge und ein Runbook vor dem Vorfall.

Die Zusatzkriterien ergänzen die Pflicht, Kunden ihre Protokolle auf Anfrage herauszugeben (01AC), und Integritätsgarantien (02AC): manipulationssichere Speicherung, synchronisierte Uhren und Kopien, die nachweislich mit den Originalen übereinstimmen.

## Typische Nachweise

- Das Log-Schema und Beispielereignisse mit Akteur, Mandant und Zeitstempel
- Konfiguration der Zeitsynchronisation (NTP- oder PTP-Quellen)
- Ein Forensik-Runbook und ein Nachweis seiner Anwendung in einem Vorfall oder einer Übung
- Für Zusatzkriterien: Unveränderlichkeits-Konfiguration des Log-Speichers (WORM oder Object Lock), Verfahren zur Prüfung von Hashes oder Signaturen, Protokollanfragen von Kunden mit Antwortzeiten

## Verbreitete Missverständnisse

- **„Die Zeitstempel sind der schwierige Teil.“** Meist ist es die Zuordnung. Hintergrundjobs und Service-zu-Service-Aufrufe verlieren oft den ursprünglichen Benutzer und Mandanten.
- **„Forensik ist Sache des SOC.“** 03B braucht Plattformfähigkeiten wie Snapshots und Traffic-Mitschnitte, die das Engineering bauen muss.
- **„Der Protokoll-Export für Kunden ist Pflicht.“** Das ist das Zusatzkriterium 01AC. Kundenseitige Protokollierung regelt PSS-04 separat.

## Was sich seit C5:2020 geändert hat

_Noch nicht geschrieben. Quelle für diesen Abschnitt: das C5:2026-Änderungsprotokoll des BSI (xlsx)._
