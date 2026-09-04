# User Guide (English)

## Sign In and Navigation

1. Open the application and choose English or French.
2. Sign in with the account provided by your clinic administrator.
3. Use the role-specific dashboard and main navigation to open your work areas.
4. On a small screen, use the menu button; `Escape` closes the navigation drawer.
5. Sign out when you finish. If the session expires, the app returns to sign-in and explains why.

Public registration creates a patient portal login only. It does not create an official clinic patient file or grant access to an existing one.

## Front Desk Workflow

1. Open **Patients** and search by identity, contact information, or patient number.
2. Create the patient file if it does not exist. The app assigns a patient number and records the registrar.
3. Open the patient workspace to review non-clinical information and print the patient card.
4. Select **Schedule appointment**. The appointments page opens with that patient preselected.
5. Choose a future date and time and enter the reason. The app blocks an already-booked patient or assigned-doctor slot.
6. Use **Appointments** or the dashboard calendar to review upcoming visits. Colored dates contain appointments; hover, focus, or select a date to see patient details.
7. Use **Patient accounts** only after checking the patient number/card and identity. Portal data remains hidden until the link is verified.

Front desk users cannot see medical history, cases, images, or clinical notes.

## Doctor Workflow

1. Use the dashboard or patient directory to open an assigned patient.
2. Review or update the patient record and medical history.
3. Open **Cases** from the patient workspace to create or update a medical case.
4. Upload, categorize, preview, or download case images.
5. Confirm carefully before deleting an image; deleted image records cannot be opened afterward.
6. Schedule and manage appointments from the dedicated appointments page.

## Administrator Workflow

- **Team:** create doctor and front desk accounts.
- **Assignments:** assign or reassign patient responsibility.
- **Audit:** review recent recorded changes.
- **Backups:** create, download, or restore clinic backups.

Administrators manage the clinic but do not receive doctor-only clinical access.

## Patient Portal

A patient portal account shows data only after clinic staff creates a `VERIFIED` link to the official patient file. The portal is read-only and includes a limited identity summary, assigned contacts, and upcoming appointments. It does not expose medical history, cases, images, appointment notes, or audit data.

## Patient Status and Destructive Actions

- Changing an active patient to inactive or archived requires confirmation.
- Appointment removal in the interface records the appointment as cancelled instead of silently deleting its history.
- Medical-image deletion requires confirmation.
- Statuses and dates follow the selected application language.

## Backup and Restore

Backup and restore is available to clinic administrators only at `/admin/backups`.

- Create a backup before application updates or database changes and at the end of each clinic day.
- Download the ZIP to an external drive or trusted clinic NAS.
- A restore replaces current database data and local medical images.
- The administrator must type `RESTORE`; the app creates a safety backup first.
- Test the restore process on a non-production machine regularly.

## Privacy and Support

- Never share credentials or leave an active session unattended.
- Access only the records needed for your role.
- Include the screen, time, error message, and patient/case ID—not clinical content—when reporting a problem.
- Access problems go to the clinic administrator; technical failures go to engineering support.
