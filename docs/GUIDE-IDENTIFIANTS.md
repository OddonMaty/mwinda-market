# Guide : obtenir les identifiants pour Mwinda Market

Ce guide explique, pas à pas, comment obtenir les 4 éléments dont la plateforme a besoin pour envoyer des messages et permettre la connexion avec Google. **Chaque élément est indépendant** : vous pouvez en faire un seul aujourd'hui et les autres plus tard. Rien ne casse tant qu'un élément manque, la fonction correspondante reste simplement désactivée.

> Les écrans de Google, Meta, Brevo et Twilio changent souvent. Les noms de menus ci-dessous sont ceux connus à la date de rédaction (novembre 2026) ; si un bouton a changé de place, cherchez le mot-clé indiqué en **gras**.

## Vue d'ensemble

| # | Fonction | Service conseillé | Coût de départ | Ce qu'il faut me donner |
|---|----------|-------------------|----------------|--------------------------|
| 1 | E-mails (commandes, mot de passe, vérification) | Brevo (ou Resend) | Gratuit jusqu'à environ 300 e-mails/jour | Adresse SMTP complète + adresse d'expéditeur |
| 2 | Connexion avec Google | Google Cloud Console | Gratuit | ID client + secret client |
| 3 | WhatsApp (notifications vendeurs, vérification) | WhatsApp Business Platform (Meta) | Paiement à la conversation (quelques centimes), un crédit gratuit mensuel existe | Jeton d'accès + identifiant du numéro |
| 4 | SMS (vérification de compte) | Twilio | Environ 0,05 à 0,10 $ par SMS vers la RDC | SID + jeton + numéro expéditeur |

**Comment me transmettre les secrets ?** Le plus sûr : enregistrez-les vous-même dans Vercel (projet `saotechmarket-api` → *Settings* → *Environment Variables*) avec les noms indiqués dans chaque section, puis dites-moi « c'est fait ». Vous pouvez aussi me les écrire dans le chat : je les enregistre sans jamais les afficher. Ne les mettez jamais dans un e-mail ou un document partagé.

---

## 1. E-mails avec Brevo (SMTP)

1. Allez sur **brevo.com** et cliquez sur **Sign up free**. Créez le compte avec l'adresse de la société et confirmez l'e-mail reçu.
2. Remplissez le profil demandé (nom de l'entreprise, pays : République démocratique du Congo, secteur : commerce en ligne).
3. **Ajouter votre domaine d'envoi** (fortement conseillé, sinon les e-mails arrivent dans les indésirables) :
   - Menu en haut à droite (votre nom) → **Senders, Domains & Dedicated IPs** → onglet **Domains** → **Add a domain**.
   - Saisissez votre nom de domaine (par exemple `mwindamarket.com`). Si vous n'en avez pas encore, passez à l'étape 4 et utilisez une adresse d'expéditeur simple ; achetez un domaine dès que possible (environ 10 à 15 $ par an chez Namecheap, OVH, Gandi...).
   - Brevo affiche 2 à 4 lignes DNS (types **TXT** et **CNAME**). Allez chez l'hébergeur de votre domaine, section **DNS / Zone DNS**, et ajoutez chaque ligne telle quelle. Revenez sur Brevo, cliquez **Authenticate**. Cela peut prendre de quelques minutes à quelques heures.
4. **Ajouter un expéditeur** : *Senders, Domains & Dedicated IPs* → **Senders** → **Add a sender** → nom « Mwinda Market », adresse `no-reply@votre-domaine` (ou une adresse Gmail pour un premier essai). Confirmez le code reçu par e-mail.
5. **Créer la clé SMTP** : menu (votre nom) → **SMTP & API** → onglet **SMTP** → **Generate a new SMTP key**. Donnez-lui le nom « mwinda-prod » et **copiez la clé tout de suite** (elle ne sera plus visible).
6. Notez les 4 informations affichées dans l'onglet SMTP :
   - Serveur : `smtp-relay.brevo.com`
   - Port : `587`
   - Identifiant : l'adresse e-mail de votre compte Brevo
   - Mot de passe : la clé SMTP de l'étape 5
7. Composez l'adresse suivante (remplacez les parties entre `<>` ; si l'identifiant contient `@`, écrivez `%40` à la place) :

   ```
   smtp://<identifiant>:<cle-smtp>@smtp-relay.brevo.com:587
   ```

**Variables Vercel (projet `saotechmarket-api`)**

| Nom | Valeur |
|-----|--------|
| `SMTP_URL` | l'adresse de l'étape 7 |
| `MAIL_FROM` | `Mwinda Market <no-reply@votre-domaine>` (la même adresse que l'expéditeur de l'étape 4) |

*Alternative :* **Resend** (resend.com) fonctionne aussi : *API Keys* → *Create API Key*, puis `SMTP_URL = smtps://resend:<cle>@smtp.resend.com:465`. Le domaine doit être vérifié dans *Domains*.

---

## 2. Connexion avec Google

1. Allez sur **console.cloud.google.com** avec le compte Google de la société.
2. En haut, cliquez sur le sélecteur de projet → **Nouveau projet** → nom « Mwinda Market » → **Créer**. Assurez-vous que ce projet est sélectionné.
3. **Écran de consentement** : menu ☰ → **API et services** → **Écran de consentement OAuth** (ou **Google Auth Platform**, selon la version).
   - Type d'utilisateur : **Externe** → **Créer**.
   - Nom de l'application : « Mwinda Market ». E-mail d'assistance : le vôtre. Logo : le logo Mwinda (facultatif).
   - **Domaines autorisés** : ajoutez `vercel.app` (puis votre propre domaine plus tard).
   - Coordonnées du développeur : votre e-mail. Enregistrez.
   - Les « Scopes » par défaut (`openid`, `email`, `profile`) suffisent, n'en ajoutez pas d'autres.
   - **Publier l'application** : tant qu'elle est en mode « Test », seuls les comptes que vous listez comme testeurs peuvent se connecter. Cliquez sur **Publier l'application** (*Publish app*) pour que tout le monde puisse l'utiliser. Pour ces scopes de base, aucune vérification longue n'est exigée.
4. **Créer l'ID client** : **API et services** → **Identifiants** → **+ Créer des identifiants** → **ID client OAuth**.
   - Type d'application : **Application Web**. Nom : « Mwinda Market Web ».
   - **Origines JavaScript autorisées** : laissez vide.
   - **URI de redirection autorisés** → **+ Ajouter un URI** et saisissez exactement :

     ```
     https://mwindamarket.vercel.app/api/v1/auth/google/callback
     ```

     (Quand vous aurez votre propre domaine, ajoutez aussi `https://votre-domaine/api/v1/auth/google/callback`. Attention : pas d'espace, pas de `/` final, `https` obligatoire.)
   - **Créer**. Une fenêtre affiche l'**ID client** et le **Code secret du client** : copiez-les.

**Variables Vercel (projet `saotechmarket-api`)**

| Nom | Valeur |
|-----|--------|
| `GOOGLE_CLIENT_ID` | l'ID client (se termine par `.apps.googleusercontent.com`) |
| `GOOGLE_CLIENT_SECRET` | le code secret du client |

> L'adresse de retour est calculée à partir de la **première** adresse de `WEB_ORIGIN`. Elle est déjà réglée sur `https://mwindamarket.vercel.app`.

---

## 3. WhatsApp (API officielle Meta)

WhatsApp ne permet pas d'envoyer des messages automatiques depuis un numéro personnel. Il faut l'API officielle (« WhatsApp Business Platform / Cloud API »). Prévoyez 30 à 60 minutes, et un **numéro de téléphone dédié** : une ligne qui n'est pas déjà inscrite sur WhatsApp ou WhatsApp Business (ou que vous acceptez de désinscrire).

1. Il faut un compte **Facebook** personnel. Allez sur **business.facebook.com** et créez un **portefeuille d'entreprise** (*Business portfolio*) : nom de la société, votre nom, e-mail professionnel.
2. Allez sur **developers.facebook.com** → **Mes applications** → **Créer une application**.
   - Cas d'usage : **Autre** → type **Entreprise** (*Business*). Nom : « Mwinda Market ». Associez le portefeuille de l'étape 1.
3. Dans le tableau de bord de l'application, trouvez le produit **WhatsApp** → **Configurer** (*Set up*).
4. Menu de gauche **WhatsApp** → **Configuration de l'API** (*API Setup*) :
   - Un numéro de test gratuit vous est fourni, utile pour un premier essai (il peut écrire à 5 numéros que vous ajoutez comme destinataires).
   - Pour la production : **Ajouter un numéro de téléphone**. Saisissez le nom d'affichage (Mwinda Market), la catégorie (Shopping), puis le numéro. Meta envoie un code par SMS ou appel : saisissez-le.
5. Notez l'**Identifiant du numéro de téléphone** (*Phone number ID*), une suite de chiffres affichée sous le numéro.
6. **Créer un jeton permanent** (le jeton temporaire de 24 h ne convient pas) :
   - **business.facebook.com** → **Paramètres de l'entreprise** → **Utilisateurs** → **Utilisateurs système** → **Ajouter** → nom « mwinda-api », rôle **Administrateur**.
   - Sur cet utilisateur : **Ajouter des éléments** → **Applications** → choisissez « Mwinda Market » → activez **Contrôle total**.
   - **Générer un jeton** → application « Mwinda Market » → expiration **Jamais** → cochez les autorisations **whatsapp_business_messaging** et **whatsapp_business_management** → **Générer** → copiez le jeton.
7. **Vérifier l'entreprise** (nécessaire pour envoyer à de nombreux clients) : **Paramètres de l'entreprise** → **Centre de sécurité** → **Démarrer la vérification**. Meta demande un document officiel (registre de commerce, numéro d'impôt...). Cela peut prendre plusieurs jours.
8. **Créer les modèles de messages** (obligatoire : un message envoyé par l'entreprise en premier doit utiliser un modèle approuvé). **WhatsApp Manager** → **Modèles de messages** → **Créer un modèle**. Langue : Français (créez aussi la version Anglais si possible). Créez ces 3 modèles, noms exacts :

   | Nom exact | Catégorie | Texte (utilisez `{{1}}`, `{{2}}`... pour les variables) |
   |-----------|-----------|-----------------------------------------------------------|
   | `mwinda_code` | Authentification | Modèle « code à usage unique » proposé par Meta (le code est `{{1}}`) |
   | `mwinda_nouvelle_commande` | Utilitaire | Nouvelle commande {{1}} pour votre boutique {{2}}. Ouvrez votre espace vendeur : {{3}} |
   | `mwinda_retrait` | Utilitaire | Votre demande de retrait {{1}} a été {{2}}. Consultez votre boutique : {{3}} |

   L'approbation prend de quelques minutes à 24 h.

**Variables Vercel (projet `saotechmarket-api`)**

| Nom | Valeur |
|-----|--------|
| `WHATSAPP_TOKEN` | le jeton permanent de l'étape 6 |
| `WHATSAPP_PHONE_ID` | l'identifiant du numéro de l'étape 5 |

> Le prix change selon le pays et le type de message. Consultez la page « Tarification » de la plateforme WhatsApp Business sur developers.facebook.com avant la mise en production.

---

## 4. SMS avec Twilio

La vérification par SMS est facultative. Si le coût ou la couverture pose problème, vous pouvez vous passer de ce canal : l'e-mail et WhatsApp resteront disponibles.

1. Allez sur **twilio.com** → **Sign up**. Confirmez l'e-mail, puis votre numéro de téléphone.
2. Répondez au court questionnaire (produit : **SMS**, langage : **Node.js**, usage : notifications).
3. Sur la page d'accueil (**Console**), repérez le bloc **Account Info** : copiez **Account SID** (commence par `AC`) et **Auth Token** (cliquez sur l'œil pour l'afficher).
4. **Obtenir un expéditeur** :
   - Compte d'essai : **Get a trial number** (numéro américain). En mode essai, vous ne pouvez envoyer qu'à vos numéros vérifiés (*Phone Numbers* → *Verified Caller IDs*), et chaque message est préfixé d'une mention d'essai.
   - Pour envoyer à n'importe quel client, passez en compte payant (**Upgrade**, à partir de 20 $ de crédit).
   - **Important pour la RDC** : *Messaging* → **Settings** → **Geo permissions** → cochez **Congo, Democratic Republic of the**. Selon la règlementation locale, un nom d'expéditeur alphanumérique (« MWINDA ») peut nécessiter un enregistrement préalable : consultez *Messaging* → **Regulatory Compliance** → pays « Congo (DRC) ».
5. Notez l'expéditeur (numéro au format `+1415...` ou nom alphanumérique).

**Variables Vercel (projet `saotechmarket-api`)**

| Nom | Valeur |
|-----|--------|
| `TWILIO_ACCOUNT_SID` | l'Account SID |
| `TWILIO_AUTH_TOKEN` | l'Auth Token |
| `TWILIO_FROM` | le numéro ou nom expéditeur |

---

## Comment enregistrer une variable dans Vercel

1. **vercel.com** → équipe *Sao Tech Agency* → projet **saotechmarket-api**.
2. **Settings** → **Environment Variables**.
3. Saisissez le nom (colonne *Key*) et la valeur (*Value*), laissez **Production** et **Preview** cochés, cochez **Sensitive** pour les secrets, puis **Save**.
4. Les variables ne sont prises en compte qu'après un **nouveau déploiement** : **Deployments** → les trois points du dernier déploiement → **Redeploy**. (Si vous me les confiez, je m'en occupe.)

## Récapitulatif à me renvoyer

Cochez ce que vous avez obtenu :

- [ ] `SMTP_URL` et `MAIL_FROM`
- [ ] `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`
- [ ] `WHATSAPP_TOKEN` et `WHATSAPP_PHONE_ID` (+ modèles `mwinda_code`, `mwinda_nouvelle_commande`, `mwinda_retrait` approuvés)
- [ ] `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` et `TWILIO_FROM`

## Sécurité

- Un secret affiché une fois (jeton, clé SMTP, code secret) ne se retrouve plus : copiez-le dans un gestionnaire de mots de passe.
- Si un secret a été partagé par erreur (capture d'écran, e-mail), **régénérez-le** dans le service concerné et mettez la valeur à jour dans Vercel.
- Le mot de passe de la base de données Neon, utilisé pendant le développement, doit être changé avant l'ouverture au public.
