/**
 * Berries — Preserving guides
 * Authoring spec: ./README.md
 */

import { PreservationGuide } from '@/types/preservation'
import { NCHFP, BBC_GOOD_FOOD, bbcFoodIngredient, bbcGoodFoodCollection } from '../resources'

export const berriesPreservation: PreservationGuide[] = [
  {
    plantId: 'strawberry',
    summary:
      'Eat them fresh in the June rush — anything left over should be frozen or jammed the day it is picked.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick dry, keep unwashed and unhulled in a single layer in the fridge, and wash only just before eating. They fade fast.',
        storageLife: '2–3 days in the fridge',
      },
      {
        method: 'freeze',
        how: 'Hull, then open-freeze whole on a tray before bagging so they stay loose. Frozen strawberries collapse on thawing — use them for smoothies, sauces and jam.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Strawberries are low in pectin, so use jam sugar with added pectin or a good squeeze of lemon juice to get a set. A soft set is traditional — do not boil it to toffee chasing a firm one.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('strawberry', 'Strawberry'),
      bbcGoodFoodCollection('strawberries-recipes', 'Strawberry recipes'),
    ],
  },
  {
    plantId: 'raspberry',
    summary:
      'The great Scottish berry — a summer and autumn glut crop that freezes almost as well as it eats fresh.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick into shallow trays so they do not crush, and eat within a day or two. Do not wash until just before serving.',
        storageLife: '1–2 days in the fridge',
      },
      {
        method: 'freeze',
        how: 'Open-freeze on trays then pour into bags — they stay separate so you can shake out a handful all winter. No blanching, no prep beyond a check for beasties.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'A short rolling boil keeps the fresh flavour — raspberry jam sets more easily than strawberry. Sieve half the pulp if the seeds annoy you, or make seedless raspberry jelly.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('raspberry', 'Raspberry'),
      bbcGoodFoodCollection('raspberry-recipes', 'Raspberry recipes'),
    ],
  },
  {
    plantId: 'blackcurrant',
    summary:
      'Too sharp to eat fresh in quantity — this is the cordial and jam bush, and the berries freeze whole with no fuss.',
    methods: [
      {
        method: 'freeze',
        how: 'Strip the berries off the strigs with a fork, open-freeze on a tray and bag. Frozen currants are actually easier to destalk — freeze on the strig and shake.',
        storageLife: '12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Blackcurrants are loaded with pectin so jam sets readily — simmer with water first to soften the skins before adding sugar. The classic Scottish move is cordial: simmer, strain through a jelly bag, sweeten and bottle.',
        storageLife: 'jam 1 year+; cordial 2–3 weeks in the fridge or freeze in bottles',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
      {
        method: 'fridge',
        how: 'Fresh currants keep a few days loosely covered in the fridge — longer than most soft fruit thanks to their tough skins.',
        storageLife: '4–7 days in the fridge',
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('blackcurrant', 'Blackcurrant'),
      bbcGoodFoodCollection('blackcurrant-recipes', 'Blackcurrant recipes'),
      bbcGoodFoodCollection('cordial-recipes', 'Cordial recipes'),
    ],
  },
  {
    plantId: 'redcurrant',
    summary:
      'The jelly-maker of the fruit cage — sky-high pectin means redcurrant jelly sets almost by itself.',
    methods: [
      {
        method: 'freeze',
        how: 'Freeze whole sprigs on a tray, then shake the frozen berries off the strigs into bags — far quicker than destalking fresh.',
        storageLife: '12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Redcurrant jelly is the obvious preserve: simmer, drip through a jelly bag overnight and boil briefly with sugar — the pectin is so high it sets fast. Brilliant with lamb, in gravies and glazing tarts.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
      {
        method: 'fridge',
        how: 'Keep on the strig, loosely covered, and pull off berries as needed. A few sprigs also look grand on a pudding.',
        storageLife: '4–7 days in the fridge',
      },
    ],
    recipeIdeas: [bbcFoodIngredient('redcurrant', 'Redcurrant')],
  },
  {
    plantId: 'gooseberry',
    summary:
      'A heavy cropper that freezes brilliantly — top and tail in front of the telly and the freezer does the rest.',
    methods: [
      {
        method: 'fridge',
        how: 'Firm underripe berries keep better than most soft fruit — a week in the fridge is fine. Dessert varieties for eating, culinary ones for cooking.',
        storageLife: 'up to 1 week in the fridge',
      },
      {
        method: 'freeze',
        how: 'Top and tail, open-freeze on trays and bag. You can also freeze them untrimmed and top-and-tail from frozen when the ends snap off cleanly.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Gooseberries are rich in pectin so jam and chutney both set well — no jam sugar needed. Pick slightly underripe for the best set and the proper sharp flavour.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.chutneys],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('gooseberry', 'Gooseberry'),
      bbcGoodFoodCollection('gooseberry-recipes', 'Gooseberry recipes'),
    ],
  },
  {
    plantId: 'blueberry',
    summary:
      'One of the better keepers among the soft fruit — a week in the fridge, and they freeze without turning to mush.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep unwashed in a covered tub in the fridge — the waxy bloom protects them. Wash just before eating.',
        storageLife: 'up to 1 week in the fridge',
      },
      {
        method: 'freeze',
        how: 'Open-freeze unwashed on a tray then bag; the berries stay separate and hold their shape better than most soft fruit. Use straight from frozen in porridge, muffins and pancakes.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Blueberries are lowish in pectin, so add lemon juice or pair with an apple for a reliable set. A gentle simmer keeps the whole-berry texture.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('blueberry', 'Blueberry'),
      bbcGoodFoodCollection('blueberry-recipes', 'Blueberry recipes'),
    ],
  },
  {
    plantId: 'blackberry',
    summary:
      'Free food from the hedge or trained canes — freeze the gluts and turn the rest into bramble jelly and gin.',
    methods: [
      {
        method: 'fresh',
        how: 'Eat within a day or two of picking — brambles go mouldy fast in a warm kitchen. Keep them cold and unwashed until needed.',
        storageLife: '1–3 days in the fridge',
      },
      {
        method: 'freeze',
        how: 'Open-freeze on trays then bag. Frozen brambles are perfect for crumbles and jelly through the winter — texture matters less once cooked.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Bramble jelly solves the seed problem: simmer with a chopped apple for pectin, strain through a jelly bag and boil with sugar. Whole-fruit bramble jam works too if the seeds do not bother you.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('blackberry', 'Blackberry'),
      bbcGoodFoodCollection('blackberry-recipes', 'Blackberry recipes'),
      bbcGoodFoodCollection('flavoured-gin-recipes', 'Flavoured gin recipes'),
    ],
  },
  {
    plantId: 'tayberry',
    summary:
      'A Scottish-bred raspberry-bramble cross — softer than either parent, so it is freezer and jam pan territory within days.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick fully ripe and handle gently — tayberries bruise even faster than raspberries. Eat within a day or two.',
        storageLife: '1–2 days in the fridge',
      },
      {
        method: 'freeze',
        how: 'Open-freeze on trays the day you pick, then bag. They collapse on thawing, so plan on cooked uses — crumbles, sauces and jam.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Treat like raspberry jam with a squeeze of lemon for insurance — the flavour is richer and winier than either parent. A short boil keeps it bright.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('tayberry', 'Tayberry')],
  },
  {
    plantId: 'loganberry',
    summary:
      'Sharper than a raspberry and softer too — best cooked, so freeze the picking and jam the glut.',
    methods: [
      {
        method: 'fresh',
        how: 'Eat dead ripe or not at all — underripe loganberries are mouth-puckering. Keep cold and use within a couple of days.',
        storageLife: '1–2 days in the fridge',
      },
      {
        method: 'freeze',
        how: 'Open-freeze on trays then bag. Their sharpness is an asset in cooked puddings, so the freezer is arguably where loganberries belong.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Loganberry jam is a classic — sharper and deeper than raspberry, with enough acid to set well with ordinary sugar. Sieve for a seedless jelly if you prefer.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('loganberry', 'Loganberry')],
  },
  {
    plantId: 'jostaberry',
    summary:
      'A gooseberry-blackcurrant cross that crops heavily — use it like either parent: freeze whole, or cook into a dark, well-set jam.',
    methods: [
      {
        method: 'fridge',
        how: 'Tougher skinned than most soft fruit, so a few days in the fridge is no bother. Ripe berries eat fresh like a mild blackcurrant.',
        storageLife: '4–5 days in the fridge',
      },
      {
        method: 'freeze',
        how: 'Open-freeze on trays and bag — no topping and tailing needed, unlike the gooseberry parent. Use from frozen in crumbles and compotes.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Jostaberries inherit high pectin from both parents, so jam sets easily with ordinary sugar. Any blackcurrant or gooseberry jam recipe works unchanged.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
    ],
  },
  {
    plantId: 'honeyberry',
    summary:
      'The first berry of the Scottish year — eat the earlies fresh and treat any glut like a soft-skinned blueberry.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick when fully blue right through — outwardly ripe berries can still be green and sharp inside. Eat within a few days.',
        storageLife: '3–4 days in the fridge',
      },
      {
        method: 'freeze',
        how: 'Open-freeze on trays then bag. The soft skins mean they thaw softer than blueberries, so use frozen berries for baking, porridge and sauces.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Haskap jam tastes somewhere between blueberry and blackcurrant — add lemon juice or jam sugar as the pectin is modest. Small batches suit the small harvests of young bushes.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
    ],
  },
  {
    plantId: 'goji-berry',
    summary:
      'Traditionally a dried berry — dry the harvest like the ones you buy, and freeze or nibble the rest fresh.',
    methods: [
      {
        method: 'fresh',
        how: 'Eat a few straight off the bush — fresh goji berries are mildly bitter-sweet and divide opinion. Handle gently; they bruise and darken fast.',
        storageLife: '2–3 days in the fridge',
      },
      {
        method: 'dry',
        how: 'Dry whole berries in a dehydrator or a very low oven until leathery like a raisin — this is how goji is used worldwide. Store in an airtight jar and scatter on porridge or steep in tea.',
        storageLife: '6–12 months in an airtight jar',
        resources: [NCHFP.drying],
      },
      {
        method: 'freeze',
        how: 'Open-freeze on a tray and bag for smoothies and baking — simpler than drying if you only have a handful.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
  },
  {
    plantId: 'aronia',
    summary:
      'Chokeberries are mouth-dryingly astringent raw — this is a crop you freeze, juice, jam or dry, never a bowl fruit.',
    methods: [
      {
        method: 'freeze',
        how: 'Open-freeze on trays then bag — freezing also mellows the astringency, so many growers freeze first on principle before cooking.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Cook into juice, jelly or jam, ideally blended with apple or blackcurrant to soften the tannic edge. The colour is spectacularly dark and the pectin is decent.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
      {
        method: 'dry',
        how: 'Dry whole berries until hard and raisin-like for teas and winter porridge — drying concentrates the sweetness and tames the pucker.',
        storageLife: '6–12 months in an airtight jar',
        resources: [NCHFP.drying],
      },
    ],
  },
  {
    plantId: 'elderberry',
    summary:
      'Always cook elderberries before eating — raw berries, stems and leaves are mildly toxic. Cooked, they make superb cordial, jelly and winter syrup.',
    methods: [
      {
        method: 'jam',
        how: 'Strip berries off the stalks with a fork, discard every bit of stem, and simmer well — cooking destroys the mildly toxic compounds in raw elderberries. Strain for cordial or syrup, or set with apple as elderberry jelly.',
        storageLife: 'jelly 1 year+ in sealed jars; cordial 2–3 weeks in the fridge or freeze',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
      {
        method: 'freeze',
        how: 'Freeze whole sprays on a tray, then shake the frozen berries off the stems into bags — much faster than forking them off fresh. Remember they still need cooking before eating.',
        storageLife: '12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'dry',
        how: 'Dry destemmed berries in a dehydrator or low oven until hard, and store in a jar for winter teas and syrups. As with fresh, always simmer dried elderberries before consuming — never eat them raw.',
        storageLife: '6–12 months in an airtight jar',
        resources: [NCHFP.drying],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('elderflower', 'Elderflower'),
      bbcGoodFoodCollection('cordial-recipes', 'Cordial recipes'),
    ],
  },
  {
    plantId: 'sea-buckthorn',
    summary:
      'Ferociously sharp orange berries on ferociously thorny branches — freeze to harvest, then turn the juice into cordial and jam.',
    methods: [
      {
        method: 'freeze',
        how: 'The classic trick is to cut small berry-laden twigs, freeze them, then shake or knock the frozen berries off — far kinder to your hands than picking the squashy fruit among thorns. Bag the loose berries and keep frozen.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Simmer and sieve for an intensely sharp, vitamin-C-rich juice, then sweeten well for cordial, jelly or jam — think citrus levels of sugar. It pairs beautifully with apple, which adds pectin for the set.',
        storageLife: 'jam and jelly 1 year+ in sealed jars; cordial 2–3 weeks in the fridge or freeze',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
    ],
  },
]
