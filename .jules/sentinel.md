## 2024-06-06 - Fix ICS Data Injection
**Vulnerability:** Calendar export functionality (`generateICS`) concatenated unsanitized data directly into the `.ics` format. A malicious input containing CRLF characters in the title, location, or description could allow an attacker to inject arbitrary calendar events.
**Learning:** Concatenating user-controlled or third-party data into file formats like ICS or CSV without proper escaping opens the door to format injection attacks.
**Prevention:** Always sanitize and escape data before interpolating it into structured text formats. For ICS, backslashes, semicolons, and commas must be escaped, and newlines must be properly encoded.
