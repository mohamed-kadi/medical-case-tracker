# Guide Utilisateur (Francais)

## Pour qui est cette application

- Personnel medical pour la gestion des dossiers patients
- Medecins pour le suivi des cas de traitement
- Equipes cliniques pour charger et consulter les images medicales

## Fonctions principales

- Connexion securisee (`/login`)
- Inscription d'un nouveau compte (`/register`)
- Tableau de bord protege (`/dashboard`)
- Gestion du profil patient (phase d'extension des ecrans)
- Suivi du cycle de vie des cas medicaux (phase d'extension des ecrans)
- Chargement et telechargement des images medicales (phase d'extension des ecrans)
- Sauvegarde et restauration admin (`/admin/backups`)
- Impression de la carte patient depuis l'espace patient

## Workflow frontend actuel

1. Ouvrez la page principale de l'application.
2. Choisissez la langue preferee (anglais ou francais) dans la barre haute.
3. Inscrivez un nouveau compte ou connectez-vous.
4. Apres connexion, accedez au tableau de bord.
5. Utilisez la deconnexion dans la barre haute en fin de session.

## Support des langues

- L'interface supporte l'anglais et le francais.
- La langue choisie est conservee dans le navigateur.
- Les requetes API incluent automatiquement `Accept-Language: en` ou `Accept-Language: fr`.

## Sauvegarde et restauration

La sauvegarde/restauration est disponible seulement pour les admins de la clinique.

Utilisez `/admin/backups` pour:

- Creer une sauvegarde ZIP avant une mise a jour ou un changement de base de donnees.
- Creer une sauvegarde ZIP a la fin de chaque journee clinique.
- Telecharger le ZIP et garder une copie sur disque externe ou NAS fiable de la clinique.
- Restaurer un ancien ZIP lors d'un changement de machine ou apres une mauvaise mise a jour.

Regles importantes de restauration:

- La restauration remplace la base actuelle et le dossier local des images medicales.
- L'application cree une sauvegarde de securite avant la restauration.
- L'admin doit taper `RESTORE` pour confirmer l'action.
- Testez toujours une restauration sur une machine non-production avant de faire confiance au processus avec de vraies donnees cliniques.

## Carte patient

L'accueil peut ouvrir l'espace patient et imprimer la carte patient.

La carte sert a identifier le dossier clinique avec le numero patient et des informations non-cliniques de base. Ce n'est pas un compte portail patient.

## Obtenir de l'aide

- Probleme technique: contactez l'administrateur systeme
- Probleme d'acces: contactez l'admin de la clinique
- Probleme de donnees: envoyez un ticket avec l'ID patient/cas

## Confidentialite et securite

- Ne partagez jamais vos identifiants.
- Consultez uniquement les dossiers necessaires a votre role.
- Signalez immediatement toute activite suspecte.
