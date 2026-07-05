/**
 * Fruit Trees — Preserving guides
 * Authoring spec: ./README.md
 */

import { PreservationGuide } from '@/types/preservation'
import {
  NCHFP,
  RHS_STORING_FRUIT,
  BBC_GOOD_FOOD,
  bbcFoodIngredient,
  bbcGoodFoodCollection,
} from '../resources'

export const fruitTreesPreservation: PreservationGuide[] = [
  {
    plantId: 'apple-tree',
    summary:
      'The great keeper of the plot — sound late apples wrapped and tray-stored will see you through to spring.',
    methods: [
      {
        method: 'fridge',
        how: 'Eaters keep for weeks in the salad drawer in a loose bag. Use up early varieties first — they never store long.',
        storageLife: '2–6 weeks in the fridge',
      },
      {
        method: 'store-cool',
        how: 'Only tray-store perfect, unblemished late-season keepers — one bruise spoils the box. Wrap each fruit in newspaper and lay in single layers somewhere cool, dark and frost-free, checking monthly.',
        storageLife: '2–6 months depending on variety',
        resources: [RHS_STORING_FRUIT],
      },
      {
        method: 'freeze',
        how: 'Peel, slice and freeze on trays before bagging, or stew to a purée first. Frozen slices go straight into crumbles; the windfalls and bruised fruit all end up here.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Apple chutney is the classic glut-buster — apples also lend their pectin to any low-set fruit jam or a herb jelly.',
        storageLife: '1 year+ in sealed jars',
        resources: [BBC_GOOD_FOOD.chutneys],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('apple', 'Apple'),
      bbcGoodFoodCollection('apple-recipes', 'Apple recipes'),
      bbcGoodFoodCollection('apple-crumble-recipes', 'Apple crumble recipes'),
    ],
  },
  {
    plantId: 'pear-tree',
    summary:
      'Pears ripen off the tree — pick them hard, store them cold, and bring them indoors a few at a time.',
    methods: [
      {
        method: 'store-cool',
        how: 'Pick while still hard and lay unwrapped in single layers somewhere cold and frost-free. Bring a few indoors every week to finish ripening — a ripe pear waits for no one.',
        storageLife: '1–3 months depending on variety',
        resources: [RHS_STORING_FRUIT],
      },
      {
        method: 'fridge',
        how: 'The fridge holds hard pears in suspended animation and slows ripe ones. Keep them away from strong-smelling food.',
        storageLife: '2–4 weeks in the fridge',
      },
      {
        method: 'freeze',
        how: 'Poach quarters in a light syrup and freeze in tubs — raw pears go woolly in the freezer.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Pear and ginger jam or a spiced pear chutney soaks up the fruit that all ripened in the same week.',
        storageLife: '1 year+ in sealed jars',
        resources: [BBC_GOOD_FOOD.chutneys],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('pear', 'Pear'),
      bbcGoodFoodCollection('pear-recipes', 'Pear recipes'),
    ],
  },
  {
    plantId: 'plum-tree',
    summary:
      'A plum tree gives you everything in a fortnight — eat what you can, then stone and freeze or jam the rest.',
    methods: [
      {
        method: 'fresh',
        how: 'Ripe plums keep only a few days in a cool room, a little longer in the fridge. Eat the ripest first and check daily for softening.',
        storageLife: '3–5 days',
      },
      {
        method: 'freeze',
        how: 'Halve and stone before freezing — stones turn the flavour bitter and are a menace later. Open-freeze the halves on trays, then bag for crumbles and compotes.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Plum jam sets easily and plum chutney is even more forgiving. Stone the fruit first; whole ripe plums also steep well in gin with sugar for a winter bottle.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('plum', 'Plum'),
      bbcGoodFoodCollection('plum-recipes', 'Plum recipes'),
    ],
  },
  {
    plantId: 'cherry-tree',
    summary:
      'The birds want them as much as you do — pick ripe, eat fresh, and open-freeze the surplus stoned.',
    methods: [
      {
        method: 'fresh',
        how: 'Keep unwashed in the fridge with the stalks on and wash just before eating. They fade fast once picked.',
        storageLife: 'up to 1 week in the fridge',
      },
      {
        method: 'freeze',
        how: 'Stone them first — a cherry stoner earns its keep in one evening — then open-freeze on trays and bag. Frozen cherries go straight into pies and compotes.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Cherry jam is low in pectin, so add lemon juice or mix with a sharper fruit for a set. Always stone the fruit before it goes in the pan.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('cherry', 'Cherry'),
      bbcGoodFoodCollection('cherry-recipes', 'Cherry recipes'),
    ],
  },
  {
    plantId: 'damson-tree',
    summary:
      'Too sharp to eat from the tree but the best preserving plum there is — jam, gin and the freezer take the lot.',
    methods: [
      {
        method: 'fresh',
        how: 'Damsons keep a few days in the fridge but few people eat them raw — they are a cooking fruit through and through.',
        storageLife: '3–5 days in the fridge',
      },
      {
        method: 'freeze',
        how: 'Halve and stone before freezing, or freeze whole and sieve the stones out after cooking. A freezer full of damsons means jam-making on your own schedule.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Damson jam is the classic — high pectin, deep flavour, easy set. For damson gin, prick whole fruit and steep in gin with sugar for three months, shaking weekly.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('damsons', 'Damson'),
      bbcGoodFoodCollection('damson-recipes', 'Damson recipes'),
    ],
  },
  {
    plantId: 'greengage-tree',
    summary:
      'The finest-flavoured plum of all — eat as many fresh as you can and preserve the rest like any plum.',
    methods: [
      {
        method: 'fresh',
        how: 'A ripe greengage is the reward for growing the tree — eat within days. They bruise easily, so pick gently into shallow trays.',
        storageLife: '3–5 days',
      },
      {
        method: 'freeze',
        how: 'Halve and stone, then open-freeze on trays before bagging. They hold their honeyed flavour well for compotes and tarts.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Greengage jam is a quiet luxury — stone the fruit and add a squeeze of lemon to help the set.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('greengages', 'Greengage')],
  },
  {
    plantId: 'medlar-tree',
    summary:
      'Medlars must be bletted — softened in storage until the flesh turns brown and datey — before they are any use at all.',
    methods: [
      {
        method: 'store-cool',
        how: 'Pick after the first frosts and lay eye-down in single layers somewhere cool. Wait 2–3 weeks until the flesh softens and browns — that is bletting, a controlled ripening, not rot, and the fruit is inedible before it.',
        storageLife: '2–3 weeks to blet, then use promptly',
        resources: [RHS_STORING_FRUIT],
      },
      {
        method: 'jam',
        how: 'Bletted medlars make an amber jelly that is very good with cheese and game — simmer whole, strain overnight through a jelly bag, and boil the juice with sugar.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('medlars', 'Medlar')],
  },
  {
    plantId: 'quince-tree',
    summary:
      'Rock-hard and inedible raw, but cooked quince turns fragrant and pink — store cool, then make membrillo and jelly.',
    methods: [
      {
        method: 'store-cool',
        how: 'Store unwrapped in single layers somewhere cool and dark, away from other fruit — the perfume is strong enough to flavour your apples. Use as the fruits turn fully yellow.',
        storageLife: '2–3 months',
        resources: [RHS_STORING_FRUIT],
      },
      {
        method: 'jam',
        how: 'Quince is loaded with pectin: membrillo (quince paste for cheese) and quince jelly both set beautifully. Long slow cooking turns the flesh from cream to deep pink.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
      {
        method: 'freeze',
        how: 'Poach peeled quarters until tender and freeze in their syrup — ready to drop into apple crumbles all winter.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('quince', 'Quince'),
      bbcGoodFoodCollection('quince-recipes', 'Quince recipes'),
    ],
  },
  {
    plantId: 'fig-tree',
    summary:
      'A ripe fig barely keeps a day or two — deal with the harvest the same day it is picked.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick only when fully ripe and drooping — figs never ripen off the tree. Eat within a day or two; the fridge buys you a little time at the cost of some flavour.',
        storageLife: '1–2 days',
      },
      {
        method: 'freeze',
        how: 'Open-freeze whole ripe figs on a tray the day you pick them, then bag. Thawed figs are soft, so use them for baking, compotes and jam rather than eating raw.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Fig jam is rich and sets with a little lemon juice — the best home for a sudden warm-spell glut.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
      {
        method: 'dry',
        how: 'Halve and dry in a dehydrator or the lowest oven until leathery — Scottish sunshine will not do it alone. Store the dried halves in an airtight jar.',
        storageLife: '6–12 months dried, in airtight jars',
        resources: [NCHFP.drying],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('fig', 'Fig'),
      bbcGoodFoodCollection('fig-recipes', 'Fig recipes'),
    ],
  },
  {
    plantId: 'mulberry-tree',
    summary:
      'Mulberries are too fragile to sell, which is why you grow them — pick into shallow tubs and freeze or jam the same day.',
    methods: [
      {
        method: 'fresh',
        how: 'Eat on the day of picking — they collapse and stain everything within hours. Lay a sheet under the tree and shake gently for the ripest fruit.',
        storageLife: '1 day, briefly longer in the fridge',
      },
      {
        method: 'freeze',
        how: 'Open-freeze on trays the same day, then bag. Frozen mulberries hold their flavour well for pies, compotes and later jam sessions.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Mulberry jam is a deep, winey treat — low in pectin, so add lemon juice or a grated apple for the set.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('mulberries', 'Mulberry'),
      BBC_GOOD_FOOD.jams,
    ],
  },
]
