# Comment mettre Mwinda Market en ligne sur CongoCloud (NitroHost)

Vous avez déjà le site **mwindaglobal.cd** hébergé sur CongoCloud.  
Mwinda Market sera mis sur un **sous-domaine** (exemple : `market.mwindaglobal.cd` ou le nom que vous avez choisi).

Ce guide explique quoi faire **étape par étape**, sans trop de termes techniques.

---

## Avant de commencer

Vous aurez besoin de :
- Votre accès au panneau CongoCloud / NitroHost (cPanel)
- Le sous-domaine déjà créé pour Mwinda Market
- Le fichier zip ou tar.gz du projet (celui que vous avez téléchargé)

---

## Étape 1 — Préparer le dossier du sous-domaine

1. Connectez-vous à votre panneau CongoCloud.
2. Allez dans **Gestionnaire de fichiers** (File Manager).
3. Trouvez le dossier principal de votre sous-domaine Mwinda Market.  
   Il s’appelle souvent quelque chose comme :
   - `market.mwindaglobal.cd`
   - ou `public_html/market`
   - ou le nom que vous avez donné au sous-domaine.

4. **Vide ce dossier** (supprimez les fichiers qui s’y trouvent déjà, s’il y en a).  
   On va y mettre les fichiers de Mwinda Market.

---

## Étape 2 — Télécharger et mettre les fichiers

1. Sur votre ordinateur, décompressez le fichier `mwinda-market-nitrohost.tar.gz` (ou le zip).
2. Vous obtenez un dossier qui contient tous les fichiers du projet.
3. Dans le **Gestionnaire de fichiers** de CongoCloud :
   - Ouvrez le dossier du sous-domaine Mwinda Market.
   - Cliquez sur **Téléverser** (Upload).
   - Envoyez **tous** les fichiers et dossiers du projet dans ce dossier.

   À la fin, vous devez voir des fichiers comme :
   - `package.json`
   - `prisma`
   - `src`
   - `public`
   - `ecosystem.config.js`
   - etc.

---

## Étape 3 — Créer la base de données

1. Dans le panneau CongoCloud, allez dans **Bases de données MySQL** (ou PostgreSQL si disponible).
2. Créez une nouvelle base de données pour Mwinda Market (exemple : `mwindamarket`).
3. Créez un utilisateur pour cette base et notez :
   - Le nom de la base
   - Le nom d’utilisateur
   - Le mot de passe
   - L’adresse du serveur (souvent `localhost`)

> **Important** : Mwinda Market utilise **PostgreSQL**.  
> Si CongoCloud ne propose que MySQL, contactez le support CongoCloud pour savoir s’ils peuvent vous créer une base PostgreSQL, ou demandez-leur comment procéder pour une application Node.js.

---

## Étape 4 — Créer le fichier de configuration (.env)

1. Dans le Gestionnaire de fichiers, dans le dossier de Mwinda Market, créez un nouveau fichier nommé exactement :
   ```
   .env
   ```
2. Ouvrez-le et collez le texte suivant (en remplaçant les valeurs par les vôtres) :

```
DATABASE_URL="postgresql://UTILISATEUR:MOTDEPASSE@localhost:5432/NOM_DE_LA_BASE?schema=public"
NODE_ENV=production
PORT=3000

ADMIN_ACCESS_TOKEN=un-mot-secret-que-vous-choisissez

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Mwinda Market <noreply@mwindaglobal.cd>"
ADMIN_EMAIL=votre-email@mwindaglobal.cd
```

3. Enregistrez le fichier.

---

## Étape 5 — Activer l’application Node.js

CongoCloud / NitroHost permet de faire tourner des applications Node.js.

1. Dans le panneau, cherchez la section **Node.js** ou **Applications Node.js** (parfois sous « Setup Node.js App » ou « Node.js Apps »).
2. Créez une nouvelle application :
   - **Dossier de l’application** : le dossier de votre sous-domaine Mwinda Market
   - **Version de Node.js** : 18 ou 20 (la plus récente disponible)
   - **Fichier de démarrage** : `server.js` ou laissez le panneau détecter (Next.js utilise souvent `npm start`)
   - **Port** : 3000 (ou le port que le panneau vous donne)
3. Cliquez sur **NPM Install** (ou « Installer les dépendances ») pour installer les bibliothèques.
4. Une fois l’installation terminée, cliquez sur **Démarrer** ou **Start**.

---

## Étape 6 — Préparer la base de données (première fois)

Après avoir démarré l’application une première fois, il faut créer les tables.

1. Dans le panneau Node.js, cherchez l’option **Terminal** ou **Console** (ou utilisez SSH si vous l’avez).
2. Allez dans le dossier de Mwinda Market.
3. Lancez ces deux commandes (une après l’autre) :

```
npx prisma generate
npx prisma db push
npx prisma db seed
```

La commande `seed` crée deux comptes de test :
- **Admin** : `admin@mwinda.market` / `admin123`
- **Vendeur** : `vendeur@mwinda.market` / `admin123`

---

## Étape 7 — Lier le sous-domaine

1. Dans le panneau CongoCloud, allez dans **Sous-domaines** ou **Domaines**.
2. Vérifiez que votre sous-domaine Mwinda Market pointe bien vers le dossier où vous avez mis les fichiers.
3. Activez le **certificat SSL** (HTTPS) pour ce sous-domaine (souvent un bouton « Installer SSL » ou « Let’s Encrypt »).

---

## Étape 8 — Vérifier que tout fonctionne

1. Ouvrez votre sous-domaine dans le navigateur (exemple : `https://market.mwindaglobal.cd`).
2. Vous devez voir la page d’accueil de Mwinda Market avec le carrousel d’images.
3. Testez :
   - La connexion avec le compte admin
   - La page `/admin`
   - La page `/vendeur/finances`
   - Un ajout de produit (si vous êtes vendeur)

---

## En cas de problème

- **Page blanche ou erreur 500** : retournez dans la section Node.js du panneau et cliquez sur **Redémarrer**.
- **Erreur de base de données** : vérifiez que le fichier `.env` contient les bons identifiants.
- **Images qui ne s’affichent pas** : vérifiez que le dossier `public/uploads` existe et qu’il est accessible.
- **Besoin d’aide** : contactez le support CongoCloud en leur disant que vous voulez faire tourner une application Node.js (Next.js) sur un sous-domaine.

---

## Récapitulatif rapide

1. Vider le dossier du sous-domaine Mwinda Market
2. Y téléverser tous les fichiers du projet
3. Créer la base de données et noter les identifiants
4. Créer le fichier `.env` avec ces identifiants
5. Créer et démarrer l’application Node.js dans le panneau
6. Lancer les commandes Prisma pour créer les tables
7. Activer le SSL sur le sous-domaine
8. Tester le site

Une fois ces étapes faites, Mwinda Market est en ligne et prêt pour les tests.
