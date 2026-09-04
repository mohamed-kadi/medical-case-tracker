# Guide utilisateur (français)

## Connexion et navigation

1. Ouvrez l'application et choisissez le français ou l'anglais.
2. Connectez-vous avec le compte fourni par l'administrateur de la clinique.
3. Utilisez le tableau de bord adapté à votre rôle et la navigation principale.
4. Sur un petit écran, utilisez le bouton de menu ; la touche `Échap` ferme le volet de navigation.
5. Déconnectez-vous à la fin. Si la session expire, l'application revient à la connexion et en indique la raison.

L'inscription publique crée uniquement un compte pour le portail patient. Elle ne crée pas de dossier clinique officiel et ne donne pas accès à un dossier existant.

## Workflow de l'accueil

1. Ouvrez **Patients** et recherchez par identité, coordonnées ou numéro patient.
2. Créez le dossier s'il n'existe pas. L'application attribue un numéro patient et conserve l'identité de la personne qui l'a enregistré.
3. Ouvrez l'espace patient pour vérifier les informations non cliniques et imprimer la carte patient.
4. Sélectionnez **Planifier un rendez-vous**. La page des rendez-vous s'ouvre avec ce patient présélectionné.
5. Choisissez une date et une heure futures et saisissez le motif. L'application bloque un créneau déjà réservé pour le patient ou son médecin assigné.
6. Consultez les visites à venir dans **Rendez-vous** ou dans le calendrier du tableau de bord. Les dates colorées contiennent des rendez-vous ; survolez, ciblez au clavier ou sélectionnez une date pour voir les patients.
7. Utilisez **Comptes patients** seulement après vérification de la carte, du numéro et de l'identité. Les données du portail restent masquées tant que le lien n'est pas vérifié.

L'accueil ne peut pas consulter les antécédents médicaux, les cas, les images ni les notes cliniques.

## Workflow du médecin

1. Ouvrez un patient assigné depuis le tableau de bord ou l'annuaire.
2. Consultez ou mettez à jour le dossier et les antécédents médicaux.
3. Ouvrez **Cas** depuis l'espace patient pour créer ou modifier un cas médical.
4. Chargez, catégorisez, prévisualisez ou téléchargez les images du cas.
5. Vérifiez attentivement avant de supprimer une image ; une image supprimée ne peut plus être ouverte.
6. Planifiez et gérez les rendez-vous depuis la page dédiée.

## Workflow de l'administrateur

- **Équipe :** créer les comptes médecin et accueil.
- **Affectations :** affecter ou réaffecter la responsabilité des patients.
- **Audit :** consulter les modifications enregistrées récemment.
- **Sauvegardes :** créer, télécharger ou restaurer les sauvegardes de la clinique.

L'administrateur gère la clinique mais ne reçoit pas l'accès clinique réservé au médecin.

## Portail patient

Un compte portail affiche des données uniquement après la création par la clinique d'un lien `VERIFIED` vers le dossier officiel. Le portail est en lecture seule et présente un résumé d'identité limité, les contacts assignés et les rendez-vous à venir. Il n'expose ni antécédents médicaux, ni cas, ni images, ni notes de rendez-vous, ni données d'audit.

## Statut du patient et actions sensibles

- Le passage d'un patient actif au statut inactif ou archivé demande une confirmation.
- La suppression d'un rendez-vous dans l'interface l'enregistre comme annulé au lieu d'effacer silencieusement son historique.
- La suppression d'une image médicale demande une confirmation.
- Les statuts et les dates suivent la langue sélectionnée.

## Sauvegarde et restauration

La sauvegarde et la restauration sont réservées à l'administrateur de la clinique sur `/admin/backups`.

- Créez une sauvegarde avant une mise à jour ou un changement de base de données et à la fin de chaque journée clinique.
- Copiez le ZIP sur un disque externe ou un NAS fiable de la clinique.
- Une restauration remplace les données actuelles et les images médicales locales.
- L'administrateur doit saisir `RESTORE` ; l'application crée d'abord une sauvegarde de sécurité.
- Testez régulièrement la restauration sur une machine hors production.

## Confidentialité et assistance

- Ne partagez jamais vos identifiants et ne laissez pas une session ouverte sans surveillance.
- Consultez uniquement les dossiers nécessaires à votre rôle.
- Pour signaler un problème, indiquez l'écran, l'heure, le message d'erreur et l'identifiant patient/cas, sans inclure de contenu clinique.
- Les problèmes d'accès relèvent de l'administrateur de la clinique ; les pannes techniques relèvent du support technique.
