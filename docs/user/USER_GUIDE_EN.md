# User Guide (English)

## Who this app is for

- Medical staff managing patient records
- Doctors tracking treatment cases
- Clinical teams storing and reviewing treatment images

## Main Features

- Secure login (`/login`)
- New account registration (`/register`)
- Protected dashboard (`/dashboard`)
- Patient profile management (API-driven workflow expansion phase)
- Medical case lifecycle tracking (API-driven workflow expansion phase)
- Medical image upload and retrieval (API-driven workflow expansion phase)
- Admin backup and restore (`/admin/backups`)
- Patient card printout from the patient workspace

## Current Frontend Workflow

1. Open the application home page.
2. Select preferred language (English or French) in the top bar.
3. Register a new account or sign in with existing credentials.
4. After login, access the dashboard.
5. Use logout from the top bar when finished.

## Language Support

- The interface supports English and French.
- The selected language is stored in your browser.
- API requests include `Accept-Language: en` or `Accept-Language: fr` automatically.

## Backup and Restore

Backup and restore is available to clinic admins only.

Use `/admin/backups` to:

- Create a ZIP backup before app updates or database changes.
- Create a ZIP backup at the end of each clinic day.
- Download the backup ZIP and keep a copy on an external drive or trusted clinic NAS.
- Restore a previous ZIP when moving to another machine or recovering from a bad update.

Important restore rules:

- Restore replaces the current database data and local medical image folder.
- The app creates a safety backup before restoring.
- The admin must type `RESTORE` to confirm the action.
- Always test restore on a non-production machine before relying on it for real clinic data.

## Patient Card

Front desk can open a patient workspace and print the patient card.

The card is used for clinic identification and contains the patient number plus basic non-clinical details. It is not the same thing as a patient portal account.

## Getting Help

- Technical issue: contact your system administrator
- Access issue: contact your clinic admin
- Data issue: report to support with patient/case ID reference

## Privacy and Security

- Do not share credentials.
- Access only records needed for your role.
- Report suspicious account activity immediately.
