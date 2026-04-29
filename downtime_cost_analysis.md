# Analyse du Calcul d'Impact Financier (Downtime Cost)

L'approche actuelle dans le tableau de bord (`Downtime * Coût par Minute`) est une **approximation de premier ordre**. Bien qu'elle soit utile pour une visualisation rapide, elle ne reflète pas la complexité réelle d'une usine pharmaceutique (INDUPHARMA).

## 1. La méthode actuelle est-elle logique ?
**Partiellement.** Elle est logique pour calculer le "manque à gagner" théorique basé sur le temps, mais elle ignore les spécificités critiques de l'industrie pharmaceutique.

> [!WARNING]
> Dans le secteur Pharma, 1 minute d'arrêt ne coûte pas toujours la même chose. Si l'arrêt survient au milieu d'un cycle de stérilisation (Autoclave) ou affecte une zone froide, le coût n'est pas proportionnel au temps, mais à la **perte totale du lot (Batch Loss)**.

## 2. Comment calculent les usines de pointe (Standards Industriels) ?

Selon les standards GMP (Good Manufacturing Practice) et les benchmarks industriels, le coût réel du temps d'arrêt se décompose comme suit :

### Formule Logique Complète :
`Coût Total = (Valeur de la Production Perdue) + (Coût de la Main-d'œuvre Inactive) + (Coût des Rebuts/Scrap) + (Coût de Redémarrage/Validation)`

### Détail des composantes pour INDUPHARMA :
| Composante | Description | Importance en Pharma |
| :--- | :--- | :--- |
| **Production Perdue** | Unités non produites × Marge par unité. | Élevée (Haute valeur ajoutée). |
| **Main-d'œuvre Idle** | Techniciens et opérateurs payés à attendre. | Moyenne. |
| **Perte de Lot (Scrap)** | Valeur des matières premières perdues suite à une rupture de la chaîne du froid ou thermique. | **CRITIQUE** (Peut représenter des millions de MAD en un seul arrêt). |
| **Re-validation (QA)** | Temps passé par l'Assurance Qualité pour valider que l'équipement est de nouveau conforme GMP. | **ÉLEVÉE** (Le temps de redémarrage est souvent plus long que le temps de réparation). |

## 3. Amélioration Proposée pour le Dashboard

Pour rendre l'estimateur plus "logique" et professionnel, nous pourrions passer d'un simple champ "Coût par minute" à un modèle basé sur la **Criticité GMP** :

### Modèle Recommandé :
1.  **Coût Fixe de Panne (Batch Risk) :** Une valeur forfaitaire ajoutée dès qu'un incident "Critique" survient (ex: 50,000 MAD pour perte de lot potentielle).
2.  **Coût Variable (Time-based) :** Le coût actuel par minute (ex: 500 MAD/min) pour couvrir les frais de personnel et d'énergie.

---

### Questions pour l'utilisateur :
- Souhaitez-vous que j'intègre une notion de **"Perte de Lot"** automatique pour les machines critiques (comme les Autoclaves ou Chambres Froides) ?
- Souhaitez-vous différencier le coût selon la **Criticité de la Machine** (une panne sur une machine de packaging coûte moins cher qu'une panne sur le réacteur principal) ?
