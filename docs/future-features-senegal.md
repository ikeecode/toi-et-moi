# Pistes de fonctionnalités — ancrage culturel sénégalais

Idées issues d'une recherche sur les traditions de couple wolof / sénégalaises.
À garder pour plus tard — probablement quand on passera à l'app mobile.

---

## Synthèse culturelle

### Le mariage (takk) et ses étapes
Le mariage wolof n'est pas un événement mais un **enchaînement de rituels étalés** : **kholé** (fiançailles, négociation entre familles, échange de tissus/bijoux), **safar/warugar** (dot), **nikah** (cérémonie religieuse), **wolima** (lendemain des noces, sacrifice du bœuf, partage de la viande). Les festivités se prolongent jusqu'à **sept jours**. Chaque étape est ponctuée d'objets symboliques (la **kande**, corbeille à mil ; la **noix de kola**, symbole d'union).

### Le jongué et l'art séducteur
Le **jongué** désigne l'arsenal de séduction féminin destiné à entretenir le désir : **bine-bine** (chaînes de hanches), **bethio/beeco** (pagnes intimes), encens (**thiouraye**), parfums, gestuelle. Devoir conjugal d'entretien du désir, transmis de mère à fille.

### Mbotaay et solidarité féminine
Cercle de femmes "sœurs choisies" qui se cotisent en nature et en argent selon un calendrier — **tontine relationnelle** avant d'être financière. Entraide lors des grandes dépenses (mariage, baptême, Tabaski, construction).

### Belle-famille (goro)
Centralité énorme. On "cuisine pour la belle-mère" pendant le Ramadan, on lui apporte des plats en cérémonie. Les **mague yi** (anciennes des deux familles) négocient les protocoles. Les bénédictions de la belle-mère sont déterminantes.

### Langage de l'affection et pudeur
Wolof riche : **nob naa la** (je t'aime), **sopp naa la** (je t'adore), **bégoo naa la** (passion), **sama xol** (mon cœur), **sa bët si sama xol** (ton regard gravé dans mon cœur). La pudeur (**kersa**) prime : l'amour se dit par allusion, cadeau, soin.

### Proverbes et kasak
Les proverbes wolof structurent la sagesse conjugale : *« Ceux qui montent dans la même pirogue ont les mêmes aspirations. »* Les **kasak** (chants initiatiques) et l'humour codé disent ce que la pudeur empêche.

### Fêtes partagées
**Korité, Tabaski, Magal, Gamou, ngénté** — moments-clés où le couple performe sa cohésion : nouveaux habits assortis, plats partagés, sacrifice du mouton, **sarax** (distribution aux voisins et aux pauvres).

---

## 10 propositions de fonctionnalités

### 1. Sama Xol — Messages codés en wolof
**Concept** : pack de messages prédéfinis en wolof/français avec audio natif (nob naa la, sopp naa la, sa bët si sama xol). Apprentissage progressif.
**Ancrage** : richesse poétique du wolof amoureux + pudeur (« dire sans dire »).
**MVP** : nouveau `message_kind = 'wolof_phrase'` avec payload audio + traduction + transcription. Catalogue éditorialisé.
**Différenciant** : localisation affective réelle, pas juste de l'UI traduite.

### 2. Wolima Replay — Anniversaire en 7 jours
**Concept** : à chaque date anniversaire de mariage, l'app rejoue **7 jours de souvenirs** (un par jour comme les 7 jours du wolima) + 1 question du rituel chaque jour.
**Ancrage** : le wolima et la durée des festivités traditionnelles.
**MVP** : job planifié sur la date de mariage, sélectionne 7 souvenirs + 7 questions, les pousse jour par jour dans le fil.
**Différenciant** : étire un moment unique en rituel d'une semaine — très sénégalais.

### 3. Kasak & Léebu — Proverbe du jour
**Concept** : un proverbe wolof envoyé chaque vendredi dans le fil avec mini-débat (« Êtes-vous dans la même pirogue cette semaine ? »).
**Ancrage** : transmission orale par proverbes + humour codé du kasak.
**MVP** : table `proverbs` (texte wolof, traduction, prompt) + cron hebdo + `message_kind = 'proverb_prompt'`.
**Différenciant** : prolonge le « 36 Questions » avec un corpus culturel local plutôt qu'un format US.

### 4. Sarax & Salat — Rituels spirituels partagés
**Concept** : calendrier hijri partagé (Korité, Tabaski, Magal, Gamou, vendredi) avec intentions communes : verset à lire ensemble, sarax à donner, parent à appeler.
**Ancrage** : la prière partagée et le sarax comme ciment du couple musulman sénégalais.
**MVP** : table `spiritual_moments (id, couple_id, feast, year, intention, done)` + notifications calendaires.
**Différenciant** : aucune app couple grand public n'intègre la vie spirituelle islamique comme première classe.

### 5. Takk Timeline — Frise des étapes du couple
**Concept** : frise verticale qui ne s'arrête pas à la rencontre/mariage mais documente chaque « étape rituelle » (kholé, dot, nikah, wolima, premier ngénté…).
**Ancrage** : la conception sénégalaise du mariage comme processus en 7 étapes.
**MVP** : table `milestones (id, couple_id, ritual_type, date, photos, notes)` + écran timeline + types prédéfinis localisés FR/wolof.
**Différenciant** : les apps occidentales célèbrent un « anniversaire » unique ; ici on honore une chaîne d'étapes.

### 6. Jongué Box — Carnet secret d'attentions
**Concept** : espace privé où chacun note un cadeau, un parfum, une intention envers l'autre, avec rappel programmé (déposer un thiouraye, écrire un mot, préparer un plat).
**Ancrage** : le jongué comme devoir d'entretien du désir et de la surprise.
**MVP** : table `intentions (id, sender_id, type, scheduled_at, delivered)` + notif + galerie d'idées (bine-bine, parfum, plat préféré).
**Différenciant** : pas une wishlist transactionnelle, mais un rituel d'attention asymétrique — l'autre ne voit que ce qui lui est offert.

### 7. Mbotaay — Cagnotte rituelle partagée
**Concept** : tontine numérique du couple. Objectif (Tabaski, baptême, voyage à Touba), cotisation selon un rythme, progression visible.
**Ancrage** : le mbotaay féminin transposé à l'échelle du couple.
**MVP** : tables `pots` + `pot_contributions` + écran progression.
**Différenciant** : épargne événementielle et culturelle, pas budgétaire générique.

### 8. Goro Bridge — Pont vers la belle-famille
**Concept** : carnet partagé des belles-familles : anniversaires des beaux-parents, plats préférés, rappel « appeler yaay boroom avant Ramadan », photos des cérémonies familiales.
**Ancrage** : centralité du goro dans la stabilité du couple.
**MVP** : table `in_laws (id, couple_id, name, relation, birthday, prefs)` + rappels saisonniers.
**Différenciant** : aucune app occidentale ne reconnaît la belle-famille comme partie prenante du couple.

### 9. Kande — Coffre des objets symboliques
**Concept** : galerie d'objets-totems numérisés du couple (première noix de kola, tissu du mariage, bine-bine offert, photo du mouton de Tabaski 2024). Chaque objet porte une histoire orale (audio).
**Ancrage** : la kande, les objets-symboles, la transmission orale.
**MVP** : table `relics (id, couple_id, name, photo, audio_story, date)` + écran « musée du couple ».
**Différenciant** : objets chargés culturellement, racontés à la voix, transmissibles aux enfants (vs feed photo silencieux).

### 10. Ngénté Album — Album cérémoniel
**Concept** : sous-album dédié aux cérémonies familiales (ngénté, mariage, Tabaski) avec rôle assigné aux invités (qui a égorgé, qui a cuisiné le thiéboudienne, qui a fait le sarax).
**Ancrage** : la cérémonie comme acte communautaire.
**MVP** : extension de `memories` avec `event_type` + table `participants (memory_id, name, role)`.
**Différenciant** : documente la communauté autour du couple, pas juste le couple.

---

## Mon avis sur l'ordre

Pour démarrer (impact culturel × facilité d'implémentation) :

1. **Sama Xol** — petit, viral, ancrage immédiat. Juste un nouveau `message_kind` + catalogue.
2. **Wolima Replay** — réutilise les données existantes (souvenirs + questions) avec un job planifié. Effet « wow » annuel.
3. **Kasak & Léebu** — extension naturelle du rituel actuel, faible coût.

---

## Sources

- [Tout savoir sur les traditions de mariage au Sénégal — ABC Salles](https://www.abcsalles.com/guide/mariage/traditions-mariage-senegal)
- [Coutumes autour des mariages sénégalais — Senekeur](https://senekeur.sn/coutumes-mariages-senegalais/)
- [Le mariage sénégalais, rite de passage — Ma Location de Salle](https://malocationdesalle.com/le-mariage-senegalais-un-rite-de-passage-entre-tradition-religion-et-fete/)
- [Djongué sénégalaise ou l'art de la séduction — O'Fem Magazine](https://ofemmagazine.com/2020/06/22/djongue-senegalaise-ou-lart-de-la-seduction/)
- [Objets de plaisir : les armes des femmes à Dakar — The Conversation](https://theconversation.com/objets-de-plaisir-les-armes-des-femmes-a-dakar-86261)
- [Tontines et empowerment des femmes au Sénégal (thèse Laval)](https://corpus.ulaval.ca/entities/publication/762d158c-d952-4530-b6c5-ef3daf60a58d)
- [Famille chez les Wolof — Wikipédia](https://fr.wikipedia.org/wiki/Famille_chez_les_Wolof)
- [La place des anciens dans la société sénégalaise — SILO](https://silogora.org/la-place-des-anciens-dans-la-societe-senegalaise/)
- [Le Ngente, cérémonie de baptême — Anadolu Agency](https://www.aa.com.tr/fr/afrique/le-ngente-la-c%C3%A9r%C3%A9monie-de-bapt%C3%AAme-propre-s%C3%A9n%C3%A9gal-et-en-gambie-une-tradition-perp%C3%A9tu%C3%A9e-depuis-des-ann%C3%A9es/3492549)
- [Lexique des 10 mots d'amour en wolof — Voyage Sénégal](https://www.voyage-senegal.info/lexique-des-10-mots-damour-les-plus-utilises-en-wolof/)
- [Je t'aime en wolof — Targumi](https://www.targumi.com/blog/je-taime-wolof)
- [Proverbes wolof — Au Sénégal](https://www.au-senegal.com/-proverbes-wolof-.html?lang=fr)
- [Wisdom of the Wolof Sages (PDF)](http://wolofresources.org/language/download/proverbs.pdf)
- [La Tabaski au Sénégal — Au Sénégal](https://www.au-senegal.com/la-tabaski-au-senegal,068.html?lang=fr)
- [La fête de la Tabaski en milieu urbain (PDF)](https://horizon.documentation.ird.fr/exl-doc/pleins_textes/2026-02/010085485.pdf)
- [Gamou — Wikipédia](https://fr.wikipedia.org/wiki/Gamou)
- [Korité et Tabaski au Sénégal — SenePlus](https://www.seneplus.com/article/korite-et-tabaski-au-senegal-au-dela-de-la-lune)
