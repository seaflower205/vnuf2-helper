## 2024-05-18 - Fix ICS Format Injection in Calendar Export
**Vulnerability:** User-controlled inputs from the DOM (`tenMon`, `phong`, `gv`) were concatenated directly into a `.ics` file without escaping in `content/export-calendar.js`.
**Learning:** This allowed ICS format injection attacks where crafted data in the UI could inject arbitrary calendar events, execute alarms, or break the ICS file format entirely by injecting CRLF or unescaped control characters.
**Prevention:** Always use an `escapeICS()` function that escapes `\`, `;`, `,`, and `\n` per RFC 5545 when building structured text files like `.ics` or `.csv`.
