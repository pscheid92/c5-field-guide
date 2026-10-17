---
summary: Die Autorisierungsprüfungen im Produkt müssen vor jeder neuen Funktion und bei jeder Änderung der Autorisierungslogik validiert werden. Gefundene Schwachstellen laufen durch den Schwachstellenprozess.
tags: [access-control, product-security, testing]
lifecycle: [design, build]
related: [PSS-08, DEV-05, DEV-07, PSS-02, OPS-22]
status: Entwurf, Beispieltext für den Prototyp
---

## Was das in der Praxis bedeutet

PSS behandelt die Sicherheit des Cloud-Dienstes als Produkt. Dieses Kriterium betrifft also die Autorisierungsprüfungen, die die Funktionen schützen, die Kunden aufrufen. Die eigenen Mitarbeitenden des Anbieters sind unter IAM geregelt.

Das interessante Unterkriterium ist 02B: Die Autorisierung muss **validiert werden, bevor eine neue Funktion bereitgestellt wird** und **immer dann, wenn sich der Autorisierungsmechanismus einer bestehenden Funktion ändert**. In der Praxis heißt das:

- Jeder neue Endpunkt und jede neue Operation kommt mit Tests, die belegen, dass unberechtigte Aufrufer abgewiesen werden: falscher Mandant, falsche Rolle, fehlender Scope.
- Eine Änderung an der Policy-Engine, am Rollenmodell oder an der Middleware löst die Autorisierungs-Testsuite aus, nicht nur die Tests des Features, das die Änderung angestoßen hat.
- Die Tests sind Teil des Änderungsprozesses (vgl. DEV-07). Der Nachweis ist also ein CI-Lauf, der einem Release zugeordnet ist.

Finden diese Tests oder ein Pentest eine Lücke, etwa eine IDOR oder eine fehlende Mandantenprüfung, wird sie als Schwachstelle behandelt (03B, vgl. PSS-02). Ein stiller Bugfix reicht nicht.

## Typische Nachweise

- Entwurfsdokumentation des Autorisierungsmodells (vgl. DEV-05)
- Automatisierte Autorisierungs-Testsuiten und CI-Ergebnisse zu ausgewählten Releases
- Der Änderungsprozess, der zeigt, dass Änderungen an der Autorisierung eine Validierung auslösen
- Pentest-Berichte, die fehlerhafte Autorisierung auf Objekt- und Funktionsebene abdecken
- Schwachstellen-Tickets zu Autorisierungsbefunden mit Schweregrad und Behebungsdatum

## Verbreitete Missverständnisse

- **„Wir brauchen ABAC.“** Attributbasierte Zugriffskontrolle ist das Zusatzkriterium 01AC. Das Basiskriterium verlangt nur wirksame Zugriffskontrolle.
- **„Der jährliche Pentest deckt das ab.“** 02B knüpft die Validierung an jede neue Funktion und jede Änderung, nicht an einen Kalender.
- **„Es geht um unsere Admins.“** Es geht um den Zugriff auf die Funktionen des Dienstes. Privilegierte Zugriffe auf Anbieterseite regelt IAM-06.

## Was sich seit C5:2020 geändert hat

_Noch nicht geschrieben. Quelle für diesen Abschnitt: das C5:2026-Änderungsprotokoll des BSI (xlsx)._
