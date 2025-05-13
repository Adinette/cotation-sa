# 🧠 Guide de prise en main – Cotation Rule Editor (Sahges Cotation)

## 🎯 Objectif de l’éditeur

L’éditeur permet de créer une formule de calcul de prime d’assurance sous forme de blocs visuels, sans écrire de code.

Il est destiné aux utilisateurs métier (Direction Technique ou partenaires bancaires) pour définir :

- Des **formules de calcul**
- Des **conditions** (ex. : si l’âge > 60, ajouter une surprime)
- Des **boucles** si besoin (ex. : parcourir les garanties additionnelles)

---

## 📦 Blocs disponibles

| Bloc              | Rôle |
|-------------------|------|
| ✅ **Variable**     | Représente une donnée d’entrée (ex. âge, capital, taux) |
| ➕ **Opération**    | Effectue un calcul (ex. multiplication, addition) |
| 🔀 **Condition**    | Gère une logique conditionnelle (if, else if, else) |
| 🔁 **Boucle**       | Répète un traitement (optionnel) |
| 🎯 **Retour**       | Définit la valeur de sortie (ex. la prime finale) |

---

## 🧩 Exemple concret

> Calcul d'une prime :
>
> La prime est égale à `capital * taux`.
> Si `âge > 60`, on applique une majoration de 20%.
> Puis on ajoute des frais fixes.

### Étapes dans l'éditeur

1. **Variables d’entrée** :
   - `capital` (formulaire)
   - `taux` (paramétrage)
   - `age` (formulaire)
   - `frais_fixes` (paramétrage)

2. **Définir une variable calculée** :
   - `prime_brute = capital * taux`

3. **Ajouter une condition** :
   - Si `age > 60`, alors `prime_brute *= 1.2`

4. **Ajouter les frais fixes** :
   - `prime_totale = prime_brute + frais_fixes`

5. **Retourner la prime finale** :
   - `return prime_totale`

---

## ✅ Comportement attendu

L’éditeur doit :

- Valider que les variables utilisées sont bien déclarées
- Vérifier les types (nombres, textes…)
- Empêcher les erreurs logiques (ex : return avant calcul)
- Générer automatiquement un **fichier JSON** bien structuré
- Permettre de **tester** la règle avec des données fictives
- Permettre de **voir ou exporter** le JSON

---

## 🖥️ Interface attendue

- À gauche : panneau avec les blocs disponibles
- Au centre : zone de construction des règles (glisser-déposer)
- En haut ou en bas :
  - Bouton **"Tester la règle"**
  - Bouton **"Afficher le JSON"**
  - Bouton **"Valider et enregistrer"**

---

## 💡 Bonnes pratiques

- Chaque bloc a un identifiant unique
- Les noms de variables doivent être clairs
- Les calculs doivent être testables avec des valeurs simulées
- L’interface doit être **simple à comprendre**, même sans connaissances en développement

---